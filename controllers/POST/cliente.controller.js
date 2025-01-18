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
    if (!nombreCompleto) {
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
      clienteCompleto: nuevoCliente,
      cliente: {
        id: nuevoCliente._id,
        nombre: nuevoCliente.nombreCompleto,
        totalGastado: nuevoCliente.totalGastado,
      },
      idCliente: nuevoCliente._id,
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
  try {
    const { id_cliente, servicios, banco, generarVenta, precioManual } =
      req.body;

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

    const [cliente, bancoSeleccionado] = await Promise.all([
      Cliente.findById(id_cliente),
      Banco.findById(banco),
    ]);

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

    const ordenes = [];
    for (const servicioNombre of servicios) {
      const cuenta = await Cuenta.findOne({
        servicio: servicioNombre,
        cliente: null,
      });

      if (!cuenta) {
        return res.status(404).json({
          message: `No hay cuentas disponibles para el servicio: ${servicioNombre}`,
          ok: false,
        });
      }

      ordenes.push(cuenta);
    }

    if (!generarVenta) {
      return res.status(200).json({
        message: "Previsualización de venta",
        ok: true,
        ordenes,
      });
    }

    const compras = [];
    const serviciosActualizados = new Map();

    for (const cuenta of ordenes) {
      const servicio =
        serviciosActualizados.get(cuenta.servicio) ||
        (await Servicio.findById(cuenta.servicioID));

      if (!servicio) {
        throw new Error(`Servicio no encontrado: ${cuenta.servicio}`);
      }

      serviciosActualizados.set(cuenta.servicio, servicio);

      const nuevaCompra = new Compra({
        cliente: cliente._id,
        cuenta: cuenta._id,
        banco: bancoSeleccionado._id,
        precio: precioManual ? precioManual : servicio.precio,
        servicio: servicio._id,
      });

      cliente.totalGastado += nuevaCompra.precio;
      servicio.clientesQueLoCompraron.push(cliente._id);
      cuenta.cliente = cliente._id;
      bancoSeleccionado.totalGastado += nuevaCompra.precio;
      cliente.comprasIndividualesRealizadas.push(nuevaCompra._id);
      bancoSeleccionado.comprasRealizadas.push(nuevaCompra._id);
      compras.push(nuevaCompra);
    }

    await Promise.all([
      ...compras.map((compra) => compra.save()),
      cliente.save(),
      bancoSeleccionado.save(),
      ...Array.from(serviciosActualizados.values()).map((servicio) =>
        servicio.save()
      ),
      ...ordenes.map((cuenta) => cuenta.save()),
    ]);

    return res.status(200).json({
      message: "Venta realizada con éxito",
      ok: true,
      compras,
    });
  } catch (error) {
    console.error("Error en crearNuevaVentaController:", error);
    return res.status(500).json({
      message: `Error en el servidor: ${error.message}`,
      ok: false,
    });
  }
};

//verificar tema de peticiones recurrentes con el session
const crearNuevaVentaConComboController = async (req, res) => {
  const { id_cliente, servicio, banco, generarVenta, precioManual } = req.body;
  const session = await mongoose.startSession();

  const enProceso = new Set();

  if (enProceso.has(id_cliente)) {
    return res.status(429).json({
      message: "Otra operación está en curso para este cliente.",
      ok: false,
    });
  }

  enProceso.add(id_cliente);

  try {
    // Iniciar la transacción
    session.startTransaction();

    // Validación inicial
    if (!id_cliente || !servicio || !banco) {
      throw new Error(
        "Los campos id_cliente, servicio y banco son obligatorios."
      );
    }

    // Buscar cliente, banco y servicio principal
    const [cliente, bancoSeleccionado, servicioPrincipal] = await Promise.all([
      Cliente.findById(id_cliente).session(session),
      Banco.findOne({ nombre: banco }).session(session),
      Servicio.findById(servicio).session(session),
    ]);

    if (!cliente) throw new Error("Cliente no encontrado");
    if (!bancoSeleccionado) throw new Error("Banco no encontrado");
    if (!servicioPrincipal) throw new Error("Servicio no encontrado");

    // Obtener servicios del combo
    const serviciosCombo = servicioPrincipal.servicioCombo || [];
    if (serviciosCombo.length === 0) {
      throw new Error(
        "El servicio seleccionado no tiene servicios en combo asociados."
      );
    }

    // Buscar cuentas disponibles para los servicios del combo
    const cuentas = [];
    for (const servicioID of serviciosCombo) {
      const servicio = await Servicio.findById(servicioID).session(session);
      const cuenta = await Cuenta.findOne({
        servicioID,
        cliente: null,
      }).session(session);

      if (!cuenta) {
        throw new Error(
          `No hay cuentas disponibles para el servicio: ${servicio.nombre}`
        );
      }

      cuentas.push(cuenta);
    }

    // Si no se va a generar la venta, devolvemos la previsualización
    if (!generarVenta) {
      await session.abortTransaction();
      session.endSession();
      enProceso.delete(id_cliente);

      return res.status(200).json({
        message: "Previsualización de venta",
        ok: true,
        cuentas,
      });
    }

    // Crear la compra
    const nuevaCompra = new CompraCombo({
      cliente: cliente._id,
      banco: bancoSeleccionado._id,
      precio: precioManual || servicioPrincipal.precio,
      servicio: servicioPrincipal._id,
      cuentas: cuentas.map((cuenta) => cuenta._id),
    });

    // Actualizar entidades
    cliente.totalGastado += nuevaCompra.precio;
    cliente.comprasCombosRealizadas.push(nuevaCompra._id);
    bancoSeleccionado.comprasRealizadas.push(nuevaCompra._id);
    bancoSeleccionado.totalGastado += nuevaCompra.precio;

    for (const cuenta of cuentas) {
      cuenta.cliente = cliente._id;
    }

    // Guardar todos los cambios
    await Promise.all([
      nuevaCompra.save({ session }),
      cliente.save({ session }),
      bancoSeleccionado.save({ session }),
      ...cuentas.map((cuenta) => cuenta.save({ session })),
    ]);

    // Confirmar transacción
    await session.commitTransaction();

    return res.status(200).json({
      message: "Venta realizada con éxito",
      ok: true,
      compra: nuevaCompra,
    });
  } catch (error) {
    console.error("Error en crearNuevaVentaConComboController:", error);

    // Revertir transacción en caso de error
    await session.abortTransaction();

    return res.status(500).json({
      message: `Error en el servidor: ${error.message}`,
      ok: false,
    });
  } finally {
    // Finalizar sesión y eliminar cliente del conjunto
    session.endSession();
    enProceso.delete(id_cliente);
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
