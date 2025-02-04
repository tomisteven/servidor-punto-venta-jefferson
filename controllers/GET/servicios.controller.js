const Servicios = require("../../models/Servicio");

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

module.exports = { getServicios, getServiciosParticulares, getServiciosCombos };
