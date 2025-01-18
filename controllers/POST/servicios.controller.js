const Servicio = require("../../models/Servicio");

const crearNuevoServicioController = async (req, res) => {
  const { nombre, precio, combo, servicioCombo } = req.body;

  try {
    const serviciosExistentes = await Servicio.find({ nombre });

    if (serviciosExistentes.length > 0) {
      return res.status(400).json({
        message: "Ya existe un servicio con ese nombre.",
        ok: false,
      });
    }

    // Validar campos obligatorios
    if (!nombre || !precio) {
      return res.status(400).json({
        message: "los campos (nombre, precio) son obligatorios.",
        ok: false,
      });
    }
    // Crear el servicio
    const nuevoServicio = new Servicio({
      nombre,
      precio,
      combo,
      servicioCombo,
    });

    // Guardar el servicio

    await nuevoServicio.save();

    return res.status(201).json({
      message: "Servicio creado con éxito.",
      servicio: nuevoServicio,
      ok: true,
    });
  } catch (error) {
    console.error("Error en crearNuevoServicioController:", error);
    return res.status(500).json({
      message: "Error en el servidor. No se pudo crear el servicio.",
      ok: false,
    });
  }
};

module.exports = { crearNuevoServicioController };
