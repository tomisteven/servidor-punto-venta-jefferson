const Cliente = require("../../models/Cliente");
const Cuenta = require("../../models/Cuenta");
const Compra = require("../../models/Compra");
const Banco = require("../../models/Banco");
const mongoose = require("mongoose");

const {
  crearNuevoCliente,
} = require("../../services/POST/Clientes/crearNuevoClienteService");
const { createBug } = require("../../utils/bug");
const Servicio = require("../../models/Servicio");
const CompraCombo = require("../../models/CompraCombo");

const crearNuevoClienteController = async (req, res) => {
  const { nombreCompleto, email, telefono } = req.body;

  try {
    if (!nombreCompleto || !email || !telefono) {
      return res.status(400).json({
        message: "Todos los campos (nombre, email, teléfono) son obligatorios.",
        ok: false,
      });
    }

    const nuevoCliente = await crearNuevoCliente({
      nombreCompleto,
      email,
      telefono,
    });

    return res.status(201).json({
      message: "Cliente creado con éxito.",
      cliente: nuevoCliente,
      ok: true,
    });
  } catch (error) {
    console.error("Error en crearNuevoClienteController:", error);
    //await createBug(error, "cliente:crearNuevoCliente");
    return res.status(500).json({
      message: `Error en el servidor: ${error.message}`,
      ok: false,
    });
  }
};

const crearNuevaVentaController = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id_cliente, servicios, banco, generarVenta, precioManual } =
      req.body;

    // Validación inicial
    if (
      !id_cliente ||
      !Array.isArray(servicios) ||
      servicios.length === 0 ||
      !banco
    ) {
      return res.status(400).json({
        message: "Los campos id_cliente, servicios y banco son obligatorios.",
        ok: false,
      });
    }

    // Buscar cliente y banco
    const cliente = await Cliente.findById(id_cliente).session(session);
    const bancoSeleccionado = await Banco.findOne({ nombre: banco }).session(
      session
    );

    if (!cliente) {
      return res
        .status(404)
        .json({ message: "Cliente no encontrado", ok: false });
    }
    if (!bancoSeleccionado) {
      return res
        .status(404)
        .json({ message: "Banco no encontrado", ok: false });
    }

    // Buscar cuentas disponibles
    const ordenes = [];
    for (const servicioNombre of servicios) {
      const cuenta = await Cuenta.findOne({
        servicio: servicioNombre,
        cliente: null,
      }).session(session);

      if (!cuenta) {
        return res.status(404).json({
          message: `No hay cuentas disponibles para el servicio: ${servicioNombre}`,
          ok: false,
        });
      }

      ordenes.push(cuenta);
    }

    // Si no se va a generar la venta, devolvemos la previsualización
    if (!generarVenta) {
      return res.status(200).json({
        message: "Previsualización de venta",
        ok: true,
        ordenes,
      });
    }

    // Generación de la venta
    const compras = [];
    const serviciosActualizados = new Map();
    for (const cuenta of ordenes) {
      const servicio =
        serviciosActualizados.get(cuenta.servicio) ||
        (await Servicio.findById(cuenta.servicioID).session(session));

      if (!servicio) {
        throw new Error(`Servicio no encontrado: ${cuenta.servicio}`);
      }

      serviciosActualizados.set(cuenta.servicio, servicio);

      // Crear la compra
      const nuevaCompra = new Compra({
        cliente: cliente._id,
        cuenta: cuenta._id,
        banco: bancoSeleccionado._id,
        precio: precioManual ? precioManual : servicio.precio,
        servicio: servicio._id,
      });

      // Actualizar las entidades en memoria
      cliente.totalGastado += nuevaCompra.precio;
      cliente.comprasRealizadas.push(nuevaCompra);
      servicio.clientesQueLoCompraron.push(cliente._id);
      cuenta.cliente = cliente._id;
      bancoSeleccionado.comprasRealizadas.push(nuevaCompra);
      bancoSeleccionado.totalGastado += nuevaCompra.precio;
      // Agregar la compra para guardarla después
      compras.push(nuevaCompra);
    }

    // Guardar los documentos afectados
    await Promise.all([
      ...compras.map((compra) => compra.save({ session })),
      cliente.save({ session }),
      bancoSeleccionado.save({ session }),
      ...Array.from(serviciosActualizados.values()).map((servicio) =>
        servicio.save({ session })
      ),
      ...ordenes.map((cuenta) => cuenta.save({ session })),
    ]);

    // Confirmar la transacción
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Venta realizada con éxito",
      ok: true,
      compras,
    });
  } catch (error) {
    console.error("Error en crearNuevaVentaController:", error);

    // Revertir cambios en caso de error
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      message: `Error en el servidor: ${error.message}`,
      ok: false,
    });
  }
};

const crearNuevaVentaConComboController = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id_cliente, servicio, banco, generarVenta, precioManual } =
      req.body;

    // Validación inicial
    if (!id_cliente || !servicio || !banco) {
      return res.status(400).json({
        message: "Los campos id_cliente, servicio y banco son obligatorios.",
        ok: false,
      });
    }

    // Buscar cliente, banco y servicio
    const cliente = await Cliente.findById(id_cliente).session(session);
    const bancoSeleccionado = await Banco.findOne({ nombre: banco }).session(
      session
    );
    const servicioPrincipal = await Servicio.findById(servicio).session(
      session
    );

    if (!cliente) {
      return res
        .status(404)
        .json({ message: "Cliente no encontrado", ok: false });
    }

    if (!bancoSeleccionado) {
      return res
        .status(404)
        .json({ message: "Banco no encontrado", ok: false });
    }

    if (!servicioPrincipal) {
      return res
        .status(404)
        .json({ message: "Servicio no encontrado", ok: false });
    }

    // Obtener servicios del combo
    const serviciosCombo = servicioPrincipal.servicioCombo || [];

    if (serviciosCombo.length === 0) {
      return res.status(400).json({
        message:
          "El servicio seleccionado no tiene servicios en combo asociados.",
        ok: false,
      });
    }

    // Buscar cuentas disponibles para los servicios del combo
    const cuentas = [];
    for (const servicioID of serviciosCombo) {
      const servicio = await Servicio.findById(servicioID).session(session);
      const cuenta = await Cuenta.findOne({
        servicioID: servicioID,
        cliente: null,
      }).session(session);

      if (!cuenta) {
        return res.status(404).json({
          message: `No hay cuentas disponibles para el servicio: ${servicio.nombre}`,
          ok: false,
        });
      }

      cuentas.push(cuenta);
    }

    // Si no se va a generar la venta, devolvemos la previsualización
    if (!generarVenta) {
      return res.status(200).json({
        message: "Previsualización de venta",
        ok: true,
        cuentas,
      });
    }

    // Generar una sola compra
    const nuevaCompra = new CompraCombo({
      cliente: cliente._id,
      banco: bancoSeleccionado._id,
      precio: precioManual || servicioPrincipal.precio,
      servicio: servicioPrincipal._id,
      cuentas: cuentas.map((cuenta) => cuenta._id),
    });

    // Actualizar las entidades en memoria
    cliente.totalGastado += nuevaCompra.precio;
    cliente.comprasRealizadas.push(nuevaCompra);
    bancoSeleccionado.comprasRealizadas.push(nuevaCompra);
    bancoSeleccionado.totalGastado += nuevaCompra.precio;

    for (const cuenta of cuentas) {
      cuenta.cliente = cliente._id;
    }

    // Guardar los documentos afectados
    await Promise.all([
      nuevaCompra.save({ session }),
      cliente.save({ session }),
      bancoSeleccionado.save({ session }),
      ...cuentas.map((cuenta) => cuenta.save({ session })),
    ]);

    // Confirmar la transacción
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Venta realizada con éxito",
      ok: true,
      compra: nuevaCompra,
    });
  } catch (error) {
    console.error("Error en crearNuevaVentaConComboController:", error);

    // Revertir cambios en caso de error
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      message: `Error en el servidor: ${error.message}`,
      ok: false,
    });
  }
};

const crearClientesMasivos = async (req, res) => {
  const { arrayNombres } = req.body;

  try {
    if (!Array.isArray(arrayNombres) || arrayNombres.length === 0) {
      return res.status(400).json({
        message:
          "El campo arrayNombres debe ser un arreglo con al menos un nombre.",
        ok: false,
      });
    }

    const nuevosClientes = await Promise.all(
      arrayNombres.map((nombre) =>
        crearNuevoCliente({
          nombreCompleto: nombre,
          telefono: Math.floor(Math.random() * 1000000000),
        })
      )
    );

    return res.status(201).json({
      message: "Clientes creados con éxito.",
      clientes: nuevosClientes,
      ok: true,
    });
  } catch (error) {
    console.error("Error en crearClientesMasivos:", error);
    return res.status(500).json({
      message: `Error en el servidor: ${error.message}`,
      ok: false,
    });
  }
};

module.exports = {
  crearNuevoClienteController,
  crearNuevaVentaController,
  crearClientesMasivos,
  crearNuevaVentaConComboController,
};
