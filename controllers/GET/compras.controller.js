const Compra = require("../../models/Compra");

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

    return res.status(200).json({
      message: "Compras encontradas.",
      compras,
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

const getComprasPorDiaController = async (req, res) => {
  try {
    // Optimización: Selección precisa de campos en el pipeline
    const compras = await Compra.aggregate([
      // Agrupa las compras por día
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
            { $project: { _id: 0, nombreCompleto: 1,

             } }, // Solo selecciona el nombre
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
      // Lookup para cuenta con proyección
      {
        $lookup: {
          from: "cuentas",
          localField: "compras.cuenta",
          foreignField: "_id",
          pipeline: [
            { $project: { _id: 0, nombre: 1 } }, // Solo selecciona el nombre
          ],
          as: "compras.cuenta",
        },
      },
      {
        $unwind: { path: "$compras.cuenta", preserveNullAndEmptyArrays: true }, // Manejo de datos nulos
      },
      // Proyección final: Reduce el tamaño de los datos
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
          "compras.cuenta": "$compras.cuenta.nombre",
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

    // Manejo detallado de errores
    return res.status(500).json({
      message:
        "Error al obtener las compras por día. Intente nuevamente más tarde.",
      ok: false,
    });
  }
};

const getComprasPorFechaController = async (req, res) => {
  try {
    const { fecha } = req.params; // Obtén la fecha de los parámetros de la ruta
    const startDate = new Date(fecha); // Convierte la fecha a un objeto Date
    const endDate = new Date(startDate); // Crea un nuevo objeto Date
    endDate.setDate(startDate.getDate() + 1); // Suma un día a la fecha para el rango

    const compras = await Compra.aggregate([
      {
        // Filtra las compras por fecha
        $match: {
          fecha: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $lookup: {
          from: "clientes",
          localField: "cliente",
          foreignField: "_id",
          pipeline: [
            { $project: { _id: 0, nombreCompleto: 1 } },
          ],
          as: "cliente",
        },
      },
      {
        $unwind: { path: "$cliente", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "servicios",
          localField: "servicio",
          foreignField: "_id",
          pipeline: [
            { $project: { _id: 0, nombre: 1 } },
          ],
          as: "servicio",
        },
      },
      {
        $unwind: {
          path: "$servicio",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "bancos",
          localField: "banco",
          foreignField: "_id",
          pipeline: [
            { $project: { _id: 0, nombre: 1 } },
          ],
          as: "banco",
        },
      },
      {
        $unwind: { path: "$banco", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "cuentas",
          localField: "cuenta",
          foreignField: "_id",
          pipeline: [
            { $project: { _id: 0, nombre: 1 } },
          ],
          as: "cuenta",
        },
      },
      {
        $unwind: { path: "$cuenta", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 1,
          precio: 1,
          fecha: 1,
          "cliente.nombreCompleto": 1,
          "servicio.nombre": 1,
          "banco.nombre": 1,
          "cuenta.nombre": 1,
        },
      },
      {
        $sort: { fecha: 1 }, // Ordena por fecha
      },
    ]);

    if (compras.length === 0) {
      return res.status(404).json({
        message: "No se encontraron compras para la fecha especificada.",
        ok: false,
      });
    }

    return res.status(200).json({
      message: "Compras encontradas para la fecha especificada.",
      compras,
      ok: true,
    });
  } catch (error) {
    console.error("Error en getComprasPorFechaController:", error);

    return res.status(500).json({
      message: "Error al obtener las compras por fecha. Intente nuevamente más tarde.",
      ok: false,
    });
  }
};






















const getComprasPorServicioController = async (req, res) => {
  const { servicio } = req.params;

  const servicioBuscado = servicio.toLowerCase(); // Convertir a minúsculas
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

  if (!compras) {
    return res.status(404).json({
      message: "No se encontraron compras.",
      ok: false,
    });
  }

  const comprasFiltradas = compras.filter(
    (compra) => compra.servicio.nombre.toLowerCase() === servicioBuscado
  );

  return res.status(200).json({
    message: "Compras encontradas.",
    compras: comprasFiltradas,
    ok: true,
  });
};

const getCompraController = async (req, res) => {
  const { id } = req.params;

  try {
    const compras = await Compra.findById(id)
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
};
