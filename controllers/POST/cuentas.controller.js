const Cuenta = require("../../models/Cuenta");
const {
  crearNuevaCuentaService,
} = require("../../services/POST/Cuenta/crearNuevaCuentaService");

const crearCuentaController = async (req, res) => {
  const { email, clave, precio, servicio } = req.body;

  try {
    // Validar campos obligatorios
    if (!email || !clave || !precio) {
      return res.status(400).json({
        message: "Todos los campos (email, clave, precio) son obligatorios.",
        ok: false,
      });
    }

    // Crear la cuenta utilizando el servicio
    const nuevaCuenta = await crearNuevaCuentaService(
      email,
      clave,
      precio,
      servicio
    );

    return res.status(201).json({
      message: "Cuenta creada con éxito.",
      cuenta: nuevaCuenta,
      ok: true,
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
