const Cuenta = require("../../models/Cuenta");
const Servicio = require("../../models/Servicio");
const {
  crearNuevaCuentaService,
} = require("../../services/POST/Cuenta/crearNuevaCuentaService");

const crearCuentaController = async (req, res) => {
  const { email, clave, servicioID, cantidad } = req.body;

  try {
    // Validar campos obligatorios
    if (!email || !clave || !servicioID) {
      return res.status(400).json({
        message: "Todos los campos (email, clave, precio) son obligatorios.",
        ok: false,
      });
    }

    // Validar que el servicio proporcionado exista: CAMBIAMOS POR SERVICIO ID EL SERVICIO.findOne({nombre: servicio})
    const servicioExiste = await Servicio.findById(servicioID);
    if (!servicioExiste) {
      return res.status(404).json({
        message: "El servicio proporcionaDo no existe.",
        ok: false,
      });
    }
    const servicio = servicioExiste.nombre || "Servicio no especificado";
    // Crear la cuenta utilizando el servicio
    if (cantidad) {
      for (let i = 0; i < cantidad; i++) {
        await crearNuevaCuentaService(email, clave, servicio, servicioID);
      }
    } else {
      await crearNuevaCuentaService(email, clave, servicio, servicioID);
    }

    res.status(200).json({
      ok: true,
      message: "Cuentas creadas con exito",
    });
  } catch (error) {
    console.error("Error en crearCuentaController:", error);
    return res.status(500).json({
      message: "Error en el servidor. No se pudo crear la cuenta.",
      ok: false,
    });
  }
};

module.exports = { crearCuentaController };
