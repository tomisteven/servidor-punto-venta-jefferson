const Servicio = require("../../models/Servicio");

const getServicioID = async (id) => {
  try {
    const servicio = await Servicio.findById(id);
    return servicio;
  } catch (error) {
    console.error("Error en getServicioID:", error);
    return res.status(500).json({
      message: "Error al obtener el servicio.",
      ok: false,
    });
  }
};

module.exports = getServicioID;
