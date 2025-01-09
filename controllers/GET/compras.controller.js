const Compra = require("../../models/Compra");
const CompraCombo = require("../../models/CompraCombo");
const getBancoID = require("../../services/GET/getBancoID");
const getClienteID = require("../../services/GET/getClienteID");
const getCuentaID = require("../../services/GET/getCuentaID");
const getServicioID = require("../../services/GET/getServicioID");

const getComprasController = async (req, res) => {
  try {
    const compras = await Compra.find()
      .populate({
        path: "cliente",
        select: "nombreCompleto -_id",
      })
      .populate({
        path: "servicio",
        select: "nombre -_id",
      })
      .populate({
        path: "cuenta",
        select: "email clave -_id",
      })
      .populate({
        path: "banco",
        select: "nombre -_id",
      })
      .lean()
      .sort({ _id: -1 })
      .limit(50);

    const comprasCombo = await CompraCombo.find()
      .populate({
        path: "cliente",
        select: "nombreCompleto -_id",
      })
      .populate({
        path: "servicio",
        select: "nombre -_id",
      })
      .populate({
        path: "cuentas", // Poblamos el arreglo de cuentas
        model: "Cuenta",
        select: "email clave -_id",
      })
      .populate({
        path: "banco",
        select: "nombre -_id",
      })
      .lean();

    // Formatear resultados de "Compra"
    const comprasFormateadas = compras.map((compra) => ({
      _id: compra._id,
      precio: compra.precio,
      fecha: compra.fecha,
      cliente: compra.cliente?.nombreCompleto || "Cliente desconocido",
      cuentas: compra.cuenta
        ? [{ email: compra.cuenta.email, clave: compra.cuenta.clave }]
        : [],
      banco: compra.banco?.nombre || "Banco desconocido",
      servicio: compra.servicio?.nombre || "Servicio desconocido",
    }));

    // Formatear resultados de "CompraCombo"
    const comprasComboFormateadas = comprasCombo.map((compraCombo) => ({
      _id: compraCombo._id,
      precio: compraCombo.precio,
      fecha: compraCombo.fecha,
      cliente: compraCombo.cliente?.nombreCompleto || "Cliente desconocido",
      cuentas: compraCombo.cuentas.map((cuenta) => ({
        email: cuenta.email,
        clave: cuenta.clave,
      })),
      banco: compraCombo.banco?.nombre || "Banco desconocido",
      servicio: compraCombo.servicio?.nombre || "Servicio desconocido",
    }));

    // Fusionar y ordenar los resultados
    const comprasTotales = [
      ...comprasFormateadas,
      ...comprasComboFormateadas,
    ].sort((a, b) => b._id - a._id);

    return res.status(200).json({
      message: "Compras encontradas.",
      compras: comprasTotales,
      ok: true,
    });
  } catch (error) {
    console.error("Error en getComprasController:", error);
    return res.status(500).json({
      message: "Error en el servidor. No se pudieron obtener las compras.",
      ok: false,
    });
  }
};

const getCompraComboController = async (req, res) => {
  const { id } = req.params;
  const compras = await CompraCombo.findById(id)
    .populate({
      path: "cliente",
      select: "nombreCompleto -_id",
    })
    .populate({
      path: "servicio",
      select: "nombre -_id",
    })
    .populate({
      path: "cuentas", // Poblamos el arreglo de cuentas
      model: "Cuenta", // Especificamos que los IDs en el arreglo son del modelo "Cuenta"
      select: "email clave _id", // Solo obtenemos el campo "nombre"
    })
    .populate({
      path: "banco",
      select: "nombre -_id",
    })
    .lean();

  if (!compras) {
    return res.status(404).json({
      message: "Compra no encontrada.",
      ok: false,
    });
  }

  return res.status(200).json({
    message: "Compra encontrada.",
    compras,
    ok: true,
  });
};

const getComprasPorDiaController = async (req, res) => {
  try {
    const compras = await Compra.aggregate([
      // Unir las compras de ambas colecciones
      {
        $unionWith: {
          coll: "compracombos", // Nombre de la colección CompraCombo
          pipeline: [
            {
              $addFields: {
                tipo: "combo", // Etiqueta para identificar compras de combos
              },
            },
          ],
        },
      },
      {
        $addFields: {
          tipo: { $ifNull: ["$tipo", "simple"] }, // Etiqueta para identificar compras normales
        },
      },
      // Agrupar por fecha
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$fecha" } },
          compras: { $push: "$$ROOT" },
          totalAcumulado: { $sum: "$precio" },
        },
      },
      {
        $unwind: "$compras", // Descompone las compras para realizar los lookups
      },
      // Lookup para cliente con proyección
      {
        $lookup: {
          from: "clientes",
          localField: "compras.cliente",
          foreignField: "_id",
          pipeline: [
            { $project: { _id: 0, nombreCompleto: 1 } }, // Solo selecciona el nombre
          ],
          as: "compras.cliente",
        },
      },
      {
        $unwind: { path: "$compras.cliente", preserveNullAndEmptyArrays: true }, // Manejo de datos nulos
      },
      // Lookup para servicio con proyección
      {
        $lookup: {
          from: "servicios",
          localField: "compras.servicio",
          foreignField: "_id",
          pipeline: [
            { $project: { _id: 0, nombre: 1 } }, // Solo selecciona el nombre
          ],
          as: "compras.servicio",
        },
      },
      {
        $unwind: {
          path: "$compras.servicio",
          preserveNullAndEmptyArrays: true,
        }, // Manejo de datos nulos
      },
      // Lookup para banco con proyección
      {
        $lookup: {
          from: "bancos",
          localField: "compras.banco",
          foreignField: "_id",
          pipeline: [
            { $project: { _id: 0, nombre: 1 } }, // Solo selecciona el nombre
          ],
          as: "compras.banco",
        },
      },
      {
        $unwind: { path: "$compras.banco", preserveNullAndEmptyArrays: true }, // Manejo de datos nulos
      },
      // Lookup para cuentas en combos
      {
        $lookup: {
          from: "cuentas",
          localField: "compras.cuentas",
          foreignField: "_id",
          pipeline: [{ $project: { _id: 1 } }],
          as: "compras.cuentas",
        },
      },
      // Proyección final
      {
        $project: {
          _id: 1,
          totalAcumulado: 1,
          "compras._id": 1,
          "compras.precio": 1,
          "compras.fecha": 1,
          "compras.cliente": "$compras.cliente.nombreCompleto",
          "compras.servicio": "$compras.servicio.nombre",
          "compras.banco": "$compras.banco.nombre",
          "compras.cuentas": "$compras.cuentas._id",
          "compras.tipo": 1, // Indica si es compra simple o combo
        },
      },
      // Reagrupación para estructurar los datos
      {
        $group: {
          _id: "$_id",
          compras: { $push: "$compras" },
          totalAcumulado: { $first: "$totalAcumulado" },
        },
      },
      // Ordenar por fecha
      {
        $sort: { _id: 1 },
      },
    ]).limit(15);

    return res.status(200).json({
      message: "Compras encontradas.",
      compras,
      ok: true,
    });
  } catch (error) {
    console.error("Error en getComprasPorDiaController:", error);

    return res.status(500).json({
      message:
        "Error al obtener las compras por día. Intente nuevamente más tarde.",
      ok: false,
    });
  }
};

const getComprasPorFechaController = async (req, res) => {
  try {
    const { fecha } = req.params;
    const startDate = new Date(fecha);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);

    // Consultar Compras y ComprasCombo en paralelo con populate
    const [compras, comprasCombo] = await Promise.all([
      Compra.find({
        fecha: { $gte: startDate, $lt: endDate },
      })
        .populate("cliente", "nombreCompleto")
        .populate("cuenta", "email clave")
        .populate("banco", "nombre")
        .populate("servicio", "nombre")
        .lean(),
      CompraCombo.find({
        fecha: { $gte: startDate, $lt: endDate },
      })
        .populate("cliente", "nombreCompleto")
        .populate("cuentas", "email clave")
        .populate("banco", "nombre")
        .populate("servicio", "nombre")
        .lean(),
    ]);

    if (compras.length === 0 && comprasCombo.length === 0) {
      return res.status(404).json({
        message: "No se encontraron compras para la fecha especificada.",
        ok: false,
      });
    }

    // Formatear los datos de Compras
    const compraArray = compras.map((compra) => ({
      _id: compra._id,
      precio: compra.precio,
      fecha: compra.fecha,
      cliente: compra.cliente?.nombreCompleto || "Cliente desconocido",
      cuentas: [
        {
          email: compra.cuenta?.email || "N/A",
          clave: compra.cuenta?.clave || "N/A",
        },
      ],
      banco: compra.banco?.nombre || "Banco desconocido",
      servicio: compra.servicio?.nombre || "Servicio desconocido",
      tipo: "Compra", // Indicar el tipo de compra
    }));

    // Formatear los datos de ComprasCombo
    const compraComboArray = comprasCombo.map((compraCombo) => ({
      _id: compraCombo._id,
      precio: compraCombo.precio,
      fecha: compraCombo.fecha,
      cliente: compraCombo.cliente?.nombreCompleto || "Cliente desconocido",
      cuentas: compraCombo.cuentas.map((cuenta) => ({
        email: cuenta.email || "N/A",
        clave: cuenta.clave || "N/A",
      })),
      banco: compraCombo.banco?.nombre || "Banco desconocido",
      servicio: compraCombo.servicio?.nombre || "Servicio desconocido",
      tipo: "CompraCombo", // Indicar el tipo de compra
    }));

    // Fusionar ambas listas
    const comprasTotales = [...compraArray, ...compraComboArray];

    return res.status(200).json({
      message: "Compras encontradas para la fecha especificada.",
      compras: comprasTotales,
      ok: true,
    });
  } catch (error) {
    console.error("Error en getComprasPorFechaController:", error);

    return res.status(500).json({
      message:
        "Error al obtener las compras por fecha. Intente nuevamente más tarde.",
      ok: false,
    });
  }
};

const getComprasPorServicioController = async (req, res) => {
  try {
    const { servicio } = req.params;
    const servicioBuscado = servicio.toLowerCase(); // Convertir a minúsculas para el filtro

    // Obtener las compras del modelo Compra
    const compras = await Compra.find()
      .populate({
        path: "cliente",
        select: "nombreCompleto -_id",
      })
      .populate({
        path: "servicio",
        select: "nombre -_id",
      })
      .populate({
        path: "cuenta",
        select: "email clave -_id",
      })
      .populate({
        path: "banco",
        select: "nombre -_id",
      })
      .lean();

    // Obtener las compras del modelo CompraCombo
    const comprasCombo = await CompraCombo.find()
      .populate({
        path: "cliente",
        select: "nombreCompleto -_id",
      })
      .populate({
        path: "servicio",
        select: "nombre -_id",
      })
      .populate({
        path: "cuentas",
        model: "Cuenta",
        select: "email clave -_id",
      })
      .populate({
        path: "banco",
        select: "nombre -_id",
      })
      .lean();

    // Formatear resultados de Compra
    const comprasFormateadas = compras.map((compra) => ({
      _id: compra._id,
      precio: compra.precio,
      fecha: compra.fecha,
      cliente: compra.cliente?.nombreCompleto || "Cliente desconocido",
      cuentas: compra.cuenta
        ? [{ email: compra.cuenta.email, clave: compra.cuenta.clave }]
        : [],
      banco: compra.banco?.nombre || "Banco desconocido",
      servicio: compra.servicio?.nombre || "Servicio desconocido",
    }));

    // Formatear resultados de CompraCombo
    const comprasComboFormateadas = comprasCombo.map((compraCombo) => ({
      _id: compraCombo._id,
      precio: compraCombo.precio,
      fecha: compraCombo.fecha,
      cliente: compraCombo.cliente?.nombreCompleto || "Cliente desconocido",
      cuentas: compraCombo.cuentas.map((cuenta) => ({
        email: cuenta.email,
        clave: cuenta.clave,
      })),
      banco: compraCombo.banco?.nombre || "Banco desconocido",
      servicio: compraCombo.servicio?.nombre || "Servicio desconocido",
    }));

    // Fusionar las compras y filtrar por servicio
    const comprasTotales = [
      ...comprasFormateadas,
      ...comprasComboFormateadas,
    ].filter((compra) => compra.servicio.toLowerCase() === servicioBuscado);

    if (comprasTotales.length === 0) {
      return res.status(404).json({
        message: "No se encontraron compras para el servicio especificado.",
        ok: false,
      });
    }

    return res.status(200).json({
      message: "Compras encontradas.",
      compras: comprasTotales,
      ok: true,
    });
  } catch (error) {
    console.error("Error en getComprasPorServicioController:", error);
    return res.status(500).json({
      message: "Error en el servidor. No se pudieron obtener las compras.",
      ok: false,
    });
  }
};

const getCompraController = async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar en Compra
    const compra = await Compra.findById(id)
      .populate({
        path: "cliente",
        select: "nombreCompleto -_id",
      })
      .populate({
        path: "servicio",
        select: "nombre -_id",
      })
      .populate({
        path: "cuenta",
        select: "email clave -_id",
      })
      .populate({
        path: "banco",
        select: "nombre -_id",
      })
      .lean();

    // Si no se encuentra en Compra, buscar en CompraCombo
    if (!compra) {
      const compraCombo = await CompraCombo.findById(id)
        .populate({
          path: "cliente",
          select: "nombreCompleto -_id",
        })
        .populate({
          path: "servicio",
          select: "nombre -_id",
        })
        .populate({
          path: "cuentas",
          model: "Cuenta",
          select: "email clave -_id",
        })
        .populate({
          path: "banco",
          select: "nombre -_id",
        })
        .lean();

      if (!compraCombo) {
        return res.status(404).json({
          message: "Compra no encontrada.",
          ok: false,
        });
      }

      // Formatear resultado de CompraCombo
      const compraComboFormateada = {
        _id: compraCombo._id,
        precio: compraCombo.precio,
        fecha: compraCombo.fecha,
        cliente: compraCombo.cliente?.nombreCompleto || "Cliente desconocido",
        cuentas: compraCombo.cuentas.map((cuenta) => ({
          email: cuenta.email,
          clave: cuenta.clave,
        })),
        banco: compraCombo.banco?.nombre || "Banco desconocido",
        servicio: compraCombo.servicio?.nombre || "Servicio desconocido",
      };

      return res.status(200).json({
        message: "Compra encontrada.",
        compra: compraComboFormateada,
        ok: true,
      });
    }

    // Formatear resultado de Compra
    const compraFormateada = {
      _id: compra._id,
      precio: compra.precio,
      fecha: compra.fecha,
      cliente: compra.cliente?.nombreCompleto || "Cliente desconocido",
      cuentas: compra.cuenta
        ? [{ email: compra.cuenta.email, clave: compra.cuenta.clave }]
        : [],
      banco: compra.banco?.nombre || "Banco desconocido",
      servicio: compra.servicio?.nombre || "Servicio desconocido",
    };

    return res.status(200).json({
      message: "Compra encontrada.",
      compra: compraFormateada,
      ok: true,
    });
  } catch (error) {
    console.error("Error en getCompraController:", error);
    return res.status(500).json({
      message: "Error en el servidor. No se pudo obtener la compra.",
      ok: false,
    });
  }
};

module.exports = {
  getComprasController,
  getComprasPorDiaController,
  getComprasPorServicioController,
  getCompraController,
  getComprasPorFechaController,
  getCompraComboController,
};
