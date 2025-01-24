const object = require("@hapi/joi/lib/types/object");
const Servicio = require("../../models/Servicio");

const actualizarServicioController = async (req, res) => {
  const { id } = req.params;
  const { nombre, precio } = req.body;
  const servicio = await Servicio.findById(id);

  console.log(servicio);

  if (!servicio) {
    return res.status(404).json({
      message: "El servicio no existe.",
      ok: false,
    });
  }

  try {
    Object.keys(req.body).forEach((key) => {
      servicio[key] = req.body[key];
    });

    // Guardar el servicio
    await servicio.save();

    return res.status(200).json({
      message: "Servicio actualizado con éxito.",
      servicio,
      ok: true,
    });
  } catch (error) {
    console.error("Error en actualizarServicioController:", error);
    return res.status(500).json({
      message: "Error en el servidor. No se pudo actualizar el servicio.",
      ok: false,
    });
  }
};

module.exports = { actualizarServicioController };
