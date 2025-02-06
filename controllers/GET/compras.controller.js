const Compra = require("../../models/Compra");
const CompraCombo = require("../../models/CompraCombo");
const getBancoID = require("../../services/GET/getBancoID");
const getClienteID = require("../../services/GET/getClienteID");
const getCuentaID = require("../../services/GET/getCuentaID");
const getServicioID = require("../../services/GET/getServicioID");

const getComprasController = async (req, res) => {
  try {
    // Obtener compras individuales
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
      .sort({ fecha: -1 }) // Ordenar por fecha descendente (más recientes primero)
      .limit(50);

    // Obtener compras combo
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
      .lean()
      .sort({ fecha: -1 }); // También ordenar por fecha descendente

    // Formatear compras individuales
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
      comentario: compra.comentario || "Sin comentarios",
      fechaCaducacion: compra.fechaCaducacion,
    }));

    // Formatear compras combo
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
      comentarios: compraCombo.comentario || "Sin comentarios",
      fechaCaducacion: compraCombo.fechaCaducacion,
    }));

    // Fusionar ambas listas y ordenar nuevamente por fecha descendente
    const comprasTotales = [...comprasFormateadas, ...comprasComboFormateadas].sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha)
    );

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

const getComprasPorMes = async (req, res) => {
  try {
    // Obtener todas las compras individuales
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
      .sort({ fecha: -1 }); // Ordenar por fecha descendente

    // Obtener todas las compras combo
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
      .lean()
      .sort({ fecha: -1 });

    // Formatear compras individuales
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
      comentario: compra.comentario || "Sin comentarios",
      fechaCaducacion: compra.fechaCaducacion,
    }));

    // Formatear compras combo
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
      comentarios: compraCombo.comentario || "Sin comentarios",
      fechaCaducacion: compraCombo.fechaCaducacion,
    }));

    // Fusionar todas las compras y ordenarlas por fecha descendente
    const comprasTotales = [...comprasFormateadas, ...comprasComboFormateadas].sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha)
    );

    // Agrupar compras por mes
    const comprasPorMes = {};

    comprasTotales.forEach((compra) => {
      const fechaCompra = new Date(compra.fecha);
      const mesClave = `${fechaCompra.getFullYear()}-${String(
        fechaCompra.getMonth() + 1
      ).padStart(2, "0")}`; // Ejemplo: "2025-01"

      if (!comprasPorMes[mesClave]) {
        comprasPorMes[mesClave] = {
          mes: `Mes: ${fechaCompra.toLocaleString("es-ES", {
            month: "long",
            year: "numeric",
          })}`, // Ejemplo: "enero de 2025"
          compras: [],
          totalDelMes: 0,
          cantidadDeCompras: 0,
        };
      }

      comprasPorMes[mesClave].compras.push(compra);
      comprasPorMes[mesClave].totalDelMes += compra.precio;
      comprasPorMes[mesClave].cantidadDeCompras += 1;
    });

    // Convertir el objeto a un array y ordenar de mes más reciente a más antiguo
    const resultadoFinal = Object.values(comprasPorMes).sort(
      (a, b) =>
        new Date(b.compras[0].fecha).getTime() - new Date(a.compras[0].fecha).getTime()
    );

    return res.status(200).json({
      message: "Compras agrupadas por mes.",
      compras: resultadoFinal,
      ok: true,
    });
  } catch (error) {
    console.error("Error en getComprasPorMes:", error);
    return res.status(500).json({
      message: "Error en el servidor. No se pudieron obtener las compras por mes.",
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
          "compras.comentario": "$compras.comentario",
          "compras.fechaCaducacion": "$compras.fechaCaducacion",

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

const getComprasPorSemanaController = async (req, res) => {
  try {
    const compras = await Compra.aggregate([
      // Unir las compras de ambas colecciones
      {
        $unionWith: {
          coll: "compracombos",
          pipeline: [{ $addFields: { tipo: "combo" } }],
        },
      },
      {
        $addFields: {
          tipo: { $ifNull: ["$tipo", "simple"] },
        },
      },
      // Calcular la semana ISO y la fecha de inicio de la semana (lunes)
      {
        $addFields: {
          year: { $year: "$fecha" },
          week: { $isoWeek: "$fecha" },
          startDate: {
            $dateFromParts: {
              isoWeekYear: { $year: "$fecha" },
              isoWeek: { $isoWeek: "$fecha" },
              isoDayOfWeek: 1, // Lunes de la semana
            },
          },
        },
      },
      // Calcular la fecha de fin de la semana (domingo)
      {
        $addFields: {
          endDate: {
            $dateAdd: {
              startDate: "$startDate",
              unit: "day",
              amount: 6, // Sumar 6 días al lunes para obtener el domingo
            },
          },
        },
      },
      // Agrupar todas las compras por semana
      {
        $group: {
          _id: {
            startDate: "$startDate",
            endDate: "$endDate",
          },
          compras: { $push: "$$ROOT" },
          totalDeLaSemana: { $sum: "$precio" },
          CantidadDeCompras: { $sum: 1 },
        },
      },
      // Proyectar en el formato requerido
      {
        $project: {
          _id: 0,
          semana: {
            $concat: [
              "del ",
              { $dateToString: { format: "%d/%m/%Y", date: "$_id.startDate" } },
              " al ",
              { $dateToString: { format: "%d/%m/%Y", date: "$_id.endDate" } },
            ],
          },
          compras: {
            $map: {
              input: "$compras",
              as: "compra",
              in: {
                _id: "$$compra._id",
                precio: "$$compra.precio",
                servicio: "$$compra.servicio",
                fecha: "$$compra.fecha",
                comentario: "$$compra.comentario",
                fechaCaducacion: "$$compra.fechaCaducacion",
                tipo: "$$compra.tipo",
              },
            },
          },
          totalDeLaSemana: 1,
          CantidadDeCompras: 1,
        },
      },
      // Ordenar por la fecha de inicio de la semana
      {
        $sort: { "_id.startDate": 1 },
      },
    ]);

    return res.status(200).json({
      message: "Compras agrupadas por semana encontradas.",
      compras,
      ok: true,
    });
  } catch (error) {
    console.error("Error en getComprasPorSemanaController:", error);

    return res.status(500).json({
      message:
        "Error al obtener las compras por semana. Intente nuevamente más tarde.",
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
      comentario: compra.comentario || "Sin comentarios",
      fechaCaducacion: compra.fechaCaducacion,
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
      comentario: compraCombo.comentario || "Sin comentarios",
      fechaCaducacion: compraCombo.fechaCaducacion,
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
      comentario: compra.comentario || "Sin comentarios",
      fechaCaducacion: compra.fechaCaducacion,
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
      comentario: compraCombo.comentario || "Sin comentarios",
      fechaCaducacion: compraCombo.fechaCaducacion,
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
        comentario: compraCombo.comentario || "Sin comentarios",
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
      comentario: compra.comentario || "Sin comentarios",
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

  getComprasPorSemanaController,
  getComprasPorMes,
};
