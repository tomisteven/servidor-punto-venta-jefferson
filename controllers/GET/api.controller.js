const Compras = require("../../models/Compra");
const Cuenta = require("../../models/Cuenta");
const Servicio = require("../../models/Servicio");
const Cliente = require("../../models/Cliente");
const Banco = require("../../models/Banco");
const { get } = require("mongoose/lib/schematype");
const mongoose = require("mongoose");


const getModelosCompletos = async (req, res) => {
  try {
    const [compras, servicios, cuentas, clientes, bancos] = await Promise.all([
      Compras.find()
        .populate("cliente")
        .populate("cuenta")
        .populate("banco")
        .lean()
        .limit(15),
      Servicio.find().populate("clientesQueLoCompraron").lean().limit(15),
      Cuenta.find().lean().limit(15), // Evitar exponer claves
      Cliente.find().lean().limit(15),
      Banco.find().lean().limit(15),
    ]);

    return res.status(200).json({
      message: "Datos encontrados.",
      data: {
        servicios,
        compras,
        cuentas,
        clientes,
        bancos,
      },
    });
  } catch (error) {
    console.error("Error en getModelosCompletos:", error);
    res.status(500).json({
      message:
        "Error al obtener los datos. Por favor, intente nuevamente más tarde.",
    });
  }
};

const getServiciosConId = async (req, res) => {
  try {
    let servicios = await Servicio.find()
      .select("nombre nCuentas precio")
      .lean();

    servicios = servicios.map((servicio) => {
      return {
        id: servicio._id,
        nombre: servicio.nombre,
      };
    });

    return res.status(200).json({
      message: "Servicios encontrados.",
      servicios,
    });
  } catch (error) {
    console.error("Error en getServiciosConId:", error);
    res.status(500).json({
      message:
        "Error al obtener los servicios. Por favor, intente nuevamente más tarde.",
    });
  }
};

const clientesConId = async (req, res) => {
  try {
    let clientes = await Cliente.find()
      .select("nombreCompleto telefono")
      .lean();

    clientes = clientes.map((cliente) => {
      return {
        id: cliente._id,
        nombre: cliente.nombreCompleto + " - " + cliente.telefono,
      };
    });

    return res.status(200).json({
      message: "Clientes encontrados.",
      clientes,
    });
  } catch (error) {
    console.error("Error en getClientesConId:", error);
    res.status(500).json({
      message:
        "Error al obtener los clientes. Por favor, intente nuevamente más tarde.",
    });
  }
};

const getBancosConId = async (req, res) => {
  try {
    let bancos = await Banco.find().select("nombre").lean();

    bancos = bancos.map((banco) => {
      return {
        id: banco._id,
        nombre: banco.nombre,
      };
    });

    return res.status(200).json({
      message: "Bancos encontrados.",
      bancos,
    });
  } catch (error) {
    console.error("Error en getBancosConId:", error);
    res.status(500).json({
      message:
        "Error al obtener los bancos. Por favor, intente nuevamente más tarde.",
    });
  }
};

const getInventarioCompletoConServicio = async (req, res) => {
  try {
    let cuentas = await Cuenta.find()
      .select("email servicio precio nCuenta")
      .lean();

    if (!cuentas) {
      return res.status(404).json({
        message: "No se encontraron cuentas.",
        ok: false,
      });
    }

    cuentas = cuentas.map((cuenta) => {
      return {
        _id: cuenta._id,
        contenido:
          cuenta.servicio +
          " - " +
          cuenta.nCuenta +
          "º " +
          cuenta.email +
          " - $" +
          cuenta.precio,
      };
    });

    return res.status(200).json({
      message: "Inventario encontrado.",
      cuentas,
      ok: true,
    });
  } catch (error) {
    console.error("Error en getInventarioConServicio:", error);
    res.status(500).json({
      message:
        "Error al obtener el inventario. Por favor, intente nuevamente más tarde.",
      ok: false,
    });
  }
};

const checkStatusApi = async (req,res) => {
  try {
    // Estado de la conexión
    const connectionState = mongoose.connection.readyState;

    // Mapear los estados de Mongoose
    const stateMapping = {
      0: "Desconectado",
      1: "Conectado",
      2: "Conectando",
      3: "Desconectando",
    };
    console.log("Estado de la conexión:", connectionState);

    // Verificar estado
    if (connectionState === 1) {
      return res.status(200).json({
        success: true,
        message: "La base de datos está funcionando correctamente.",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: `Error al verificar la base de datos: ${stateMapping[connectionState]}`,
      });
    }
  } catch (error) {
    console.error("Error en checkStatusApi:", error);
    res.status(500).json({
      success: false,
      message:
        "Error al verificar la base de datos. Por favor, intente nuevamente más tarde.",
    });
  }
};

module.exports = {
  getModelosCompletos,
  getServiciosConId,
  clientesConId,
  getBancosConId,
  getInventarioCompletoConServicio,
  checkStatusApi,
};
