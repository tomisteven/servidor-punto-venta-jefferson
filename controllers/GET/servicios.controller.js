const Servicios = require("../../models/Servicio");

const getServicios = async (req, res) => {
  const servicios = await Servicios.find().select("nombre _id").lean()

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

module.exports = { getServicios };
