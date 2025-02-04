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

const agregarComentarioACompra = async (req, res) => {
  const { id } = req.params;
  const { comentario } = req.body;

  try {
    const compra = await Compra.findById(id);
    if (!comentario) {
      return res.status(400).json({
        message: "El campo comentario es obligatorio.",
        ok: false,
      });
    }
    if (!compra) {
      return res.status(404).json({
        message: "Compra no encontrada.",
        ok: false,
      });
    }

    compra.comentarios.push({ comentario });
    await compra.save();

    return res.status(200).json({
      message: "Comentario agregado con éxito.",
      ok: true,
      compra,
    });
  } catch (error) {
    console.error("Error en agregarComentarioACompra:", error);
    return res.status(500).json({
      message: `Error en el servidor: ${error.message}`,
      ok: false,
    });
  }
};

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
    const {
      id_cliente,
      servicios,
      banco,
      generarVenta,
      precioManual,
      comentario,
    } = req.body;

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
        fechaCaducidad: new Date(
          new Date().setMonth(new Date().getMonth() + 1)
        ),
        fechaInicio: new Date(),
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
      const now = new Date();
      const fechaCaducidad = now.setMonth(now.getMonth() + 1); // Agrega un mes exacto

      const nuevaCompra = new Compra({
        cliente: cliente._id,
        cuenta: cuenta._id,
        banco: bancoSeleccionado._id,
        precio: precioManual ? precioManual : servicio.precio,
        servicio: servicio._id,
        comentario: comentario,
        fechaCaducacion: fechaCaducidad,
      });

      cliente.comentarios.push({ comentario });
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
  const {
    id_cliente,
    servicio,
    banco,
    generarVenta,
    precioManual,
    comentario,
  } = req.body;

  const enProceso = new Set();

  if (enProceso.has(id_cliente)) {
    return res.status(429).json({
      message: "Otra operación está en curso para este cliente.",
      ok: false,
    });
  }

  enProceso.add(id_cliente);

  try {
    // Validación inicial
    if (!id_cliente || !servicio || !banco) {
      throw new Error(
        "Los campos id_cliente, servicio y banco son obligatorios."
      );
    }

    // Buscar cliente, banco y servicio principal
    const [cliente, bancoSeleccionado, servicioPrincipal] = await Promise.all([
      Cliente.findById(id_cliente),
      Banco.findOne({ nombre: banco }),
      Servicio.findById(servicio),
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
      const servicio = await Servicio.findById(servicioID);
      const cuenta = await Cuenta.findOne({
        servicioID,
        cliente: null,
      });

      if (!cuenta) {
        throw new Error(
          `No hay cuentas disponibles para el servicio: ${servicio.nombre}`
        );
      }

      cuentas.push(cuenta);
    }

    // Si no se va a generar la venta, devolvemos la previsualización
    if (!generarVenta) {
      enProceso.delete(id_cliente);
      return res.status(200).json({
        message: "Previsualización de venta",
        ok: true,
        cuentas,
        fechaCaducidad: new Date(
          new Date().setMonth(new Date().getMonth() + 1)
        ),
        fechaInicio: new Date(),
      });
    }

    const now = new Date();
    const fechaCaducidad = now.setMonth(now.getMonth() + 1); // Agrega un mes exacto

    // Crear la compra
    const nuevaCompra = new CompraCombo({
      cliente: cliente._id,
      banco: bancoSeleccionado._id,
      precio: precioManual || servicioPrincipal.precio,
      servicio: servicioPrincipal._id,
      cuentas: cuentas.map((cuenta) => cuenta._id),
      comentarios: [{ comentario }],
      fechaCaducacion: fechaCaducidad,
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
      nuevaCompra.save(),
      cliente.save(),
      bancoSeleccionado.save(),
      ...cuentas.map((cuenta) => cuenta.save()),
    ]);

    return res.status(200).json({
      message: "Venta realizada con éxito",
      ok: true,
      compra: nuevaCompra,
    });
  } catch (error) {
    console.error("Error en crearNuevaVentaConComboController:", error);
    return res.status(500).json({
      message: `Error en el servidor: ${error.message}`,
      ok: false,
    });
  } finally {
    // Eliminar cliente del conjunto
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

const agregarComentarioCliente = async (req, res) => {
  const { id } = req.params;
  const { comentario } = req.body;

  try {
    const cliente = await Cliente.findById(id);
    if (!comentario) {
      return res.status(400).json({
        message: "El campo comentario es obligatorio.",
        ok: false,
      });
    }
    if (!cliente) {
      return res.status(404).json({
        message: "Cliente no encontrado.",
        ok: false,
      });
    }

    cliente.comentarios.push({ comentario });
    await cliente.save();

    return res.status(200).json({
      message: "Comentario agregado con éxito.",
      ok: true,
      cliente,
    });
  } catch (error) {
    console.error("Error en agregarComentarioCliente:", error);
    return res.status(500).json({
      message: `Error en el servidor: ${error.message}`,
      ok: false,
    });
  }
};

const crearNuevaVentaConComboController2 = async (req, res) => {
  const {
    id_cliente,
    servicio,
    banco,
    generarVenta,
    precioManual,
    comentario,
  } = req.body;

  const enProceso = new Set();

  if (enProceso.has(id_cliente)) {
    return res.status(429).json({
      message: "Otra operación está en curso para este cliente.",
      ok: false,
    });
  }

  enProceso.add(id_cliente);

  try {
    // Validación inicial
    if (!id_cliente || !servicio || !banco) {
      throw new Error(
        "Los campos id_cliente, servicio y banco son obligatorios."
      );
    }

    // Buscar cliente, banco y servicio principal en paralelo
    const [cliente, bancoSeleccionado, servicioPrincipal] = await Promise.all([
      Cliente.findById(id_cliente),
      Banco.findOne({ nombre: banco }),
      Servicio.findById(servicio),
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

    // Buscar una cuenta disponible por cada servicio del combo
    const cuentas = [];
    for (const servicioID of serviciosCombo) {
      const servicio = await Servicio.findById(servicioID);
      const cuenta = await Cuenta.findOne({
        servicioID,
        cliente: null,
      });

      if (!cuenta) {
        throw new Error(
          `No hay cuentas disponibles para el servicio: ${servicio.nombre}`
        );
      }

      cuentas.push(cuenta);
    }

    // Si no se va a generar la venta, devolvemos la previsualización
    if (!generarVenta) {
      enProceso.delete(id_cliente);
      return res.status(200).json({
        message: "Previsualización de venta",
        ok: true,
        cuentas,
      });
    }

    const now = new Date();
    const fechaCaducidad = new Date(now.setMonth(now.getMonth() + 1)); // Agrega un mes exacto

    // Crear la compra
    const nuevaCompra = new CompraCombo({
      cliente: cliente._id,
      banco: bancoSeleccionado._id,
      precio: precioManual || servicioPrincipal.precio,
      servicio: servicioPrincipal._id,
      cuentas: cuentas.map((cuenta) => cuenta._id),
      comentarios: [{ comentario }],
      fechaCaducacion: fechaCaducidad,
    });

    // Actualizar entidades
    cliente.totalGastado += nuevaCompra.precio;
    cliente.comprasCombosRealizadas.push(nuevaCompra._id);
    bancoSeleccionado.comprasRealizadas.push(nuevaCompra._id);
    bancoSeleccionado.totalGastado += nuevaCompra.precio;

    cuentas.forEach((cuenta) => {
      cuenta.cliente = cliente._id;
    });

    // Guardar todos los cambios en una transacción
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await nuevaCompra.save({ session });
      await cliente.save({ session });
      await bancoSeleccionado.save({ session });
      await Promise.all(cuentas.map((cuenta) => cuenta.save({ session })));
      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        message: "Venta realizada con éxito",
        ok: true,
        compra: nuevaCompra,
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Error en crearNuevaVentaConComboController:", error);
    return res.status(500).json({
      message: `Error en el servidor: ${error.message}`,
      ok: false,
    });
  } finally {
    // Eliminar cliente del conjunto
    enProceso.delete(id_cliente);
  }
};

module.exports = {
  crearNuevoClienteController,
  crearNuevaVentaController,
  crearClientesMasivos,
  crearNuevaVentaConComboController,
  agregarComentarioCliente,
  agregarComentarioACompra,
  crearNuevaVentaConComboController2,
};
