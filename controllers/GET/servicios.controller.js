const Servicios = require("../../models/Servicio");
const Compras = require("../../models/Compra");
const CompraCombo = require("../../models/CompraCombo");
const Cuentas = require("../../models/Cuenta");

const getServiciosWithStock = async (req, res) => {
  const servicios = await Servicios.find()
    .select(
      "nombre precio combo fechaCreacion clientesQueLoCompraron nCuentas _id"
    )
    .lean();


  const serviciosConStock = servicios.map(async (servicio) => {
    const cuentas = await Cuentas.find({
      servicioID: servicio._id,
      cliente: null,
    }).lean();
    let stock = cuentas.length;
    return {
      nombre: servicio.nombre,
      precio: servicio.precio,
      combo: servicio.combo,
      stock,
      comprados: servicio.clientesQueLoCompraron.length,
    };
  });

  const serviciosConStock$ = await Promise.all(serviciosConStock);
  res.status(200).json({
    serviciosConStock$,
    ok: true,
  });
};

const getComprasPorServicioPorSemana = async (req, res) => {
  try {
    const { servicio } = req.params;

    // Obtener compras individuales del servicio
    const compras = await Compras.find({ servicio })
      .populate({
        path: "cliente",
        select: "nombreCompleto -_id",
      })
      .populate({
        path: "cuenta",
        select: "email clave -_id",
      })
      .populate({
        path: "banco",
        select: "nombre -_id",
      })
      .populate({
        path: "servicio",
        select: "nombre",
      })
      .lean()
      .sort({ fecha: -1 });

    // Obtener compras de combos que tengan al menos una cuenta con ese servicioID
    const comprasCombos = await CompraCombo.find()
      .populate({
        path: "cliente",
        select: "nombreCompleto -_id",
      })
      .populate({
        path: "cuentas",
        match: { servicioID: servicio }, // Filtra solo las cuentas que contienen ese servicio
        select: "email clave servicioID -_id",
      })
      .populate({
        path: "banco",
        select: "nombre -_id",
      })
      .populate({
        path: "servicio",
        select: "nombre",
      })

      .lean()
      .sort({ fecha: -1 });

    // Filtrar combos que efectivamente tienen cuentas con ese servicio
    const comprasCombosFiltradas = comprasCombos.filter(
      (combo) => combo.cuentas.length > 0
    );

    // Función para obtener la fecha de inicio de la semana (lunes)
    const getStartOfWeek = (date) => {
      const d = new Date(date);
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - d.getUTCDay() + 1); // Lunes de la misma semana
      return d.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    };

    // Agrupar compras por semana
    const comprasPorSemana = {};

    // Función para agregar una compra a la estructura de semanas
    const agregarCompraASemana = (compra, semanaClave, esCombo = false) => {
      if (!comprasPorSemana[semanaClave]) {
        comprasPorSemana[semanaClave] = {
          semana: `Semana del ${new Date(semanaClave).toLocaleDateString(
            "es-ES"
          )} al ${new Date(
            new Date(semanaClave).getTime() + 6 * 24 * 60 * 60 * 1000
          ).toLocaleDateString("es-ES")}`,
          compras: [],
          totalSemana: 0,
          cantidadCompras: 0,
        };
      }

      comprasPorSemana[semanaClave].compras.push({
        ...compra,
        tipo: esCombo ? "combo" : "individual",
      });
      comprasPorSemana[semanaClave].totalSemana += compra.precio;
      comprasPorSemana[semanaClave].cantidadCompras += 1;
    };

    // Procesar compras individuales
    compras.forEach((compra) => {
      const semanaClave = getStartOfWeek(compra.fecha);
      agregarCompraASemana(compra, semanaClave, false);
    });

    // Procesar compras de combos
    comprasCombosFiltradas.forEach((compraCombo) => {
      const semanaClave = getStartOfWeek(compraCombo.fecha);
      agregarCompraASemana(compraCombo, semanaClave, true);
    });

    // Convertir el objeto a un array y ordenar de la semana más reciente a la más antigua
    const resultadoFinal = Object.values(comprasPorSemana).sort(
      (a, b) => new Date(b.semana) - new Date(a.semana)
    );

    return res.status(200).json({
      message: "Compras (individuales y combos) agrupadas por semana.",
      comprasPorSemana: resultadoFinal,
      ok: true,
    });
  } catch (error) {
    console.error("Error en getComprasPorServicioPorSemana:", error);
    return res.status(500).json({
      message: "Error en el servidor. No se pudieron obtener las compras.",
      ok: false,
    });
  }
};

const getServicios = async (req, res) => {
  const servicios = await Servicios.find().select("nombre precio _id").lean();

  if (!servicios) {
    return res.status(404).json({
      message: "No se encontraron servicios.",
      ok: false,
    });
  }

  return res.status(200).json({
    servicios,
    ok: true,
  });
};

const getServiciosParticulares = async (req, res) => {
  const servicios = await Servicios.find({ combo: false })
    .select("nombre precio _id")
    .lean();

  if (!servicios) {
    return res.status(404).json({
      message: "No se encontraron servicios particulares.",
      ok: false,
    });
  }

  return res.status(200).json({
    servicios,
    ok: true,
  });
};

const getServiciosCombos = async (req, res) => {
  const servicios = await Servicios.find({ combo: true })
    .select("nombre precio _id")
    .lean();

  if (!servicios) {
    return res.status(404).json({
      message: "No se encontraron servicios combos.",
      ok: false,
    });
  }

  return res.status(200).json({
    servicios,
    ok: true,
  });
};

module.exports = {
  getServicios,
  getServiciosParticulares,
  getServiciosCombos,
  getComprasPorServicioPorSemana,
  getServiciosWithStock,
};
