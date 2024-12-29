const Cuenta = require("../../models/Cuenta");

const eliminarCuentaController = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).json({
        message: "El campo id es obligatorio.",
        ok: false,
      });
    }

    const cuentaExistente = await Cuenta.findById(id);

    if (!cuentaExistente) {
      return res.status(404).json({
        message: "No existe una cuenta con ese ID.",
        ok: false,
      });
    }

    await Cuenta.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Cuenta eliminada con éxito.",
      ok: true,
    });
  } catch (error) {
    console.error("Error en eliminarCuentaController:", error);
    return res.status(500).json({
      message: "Error en el servidor. No se pudo eliminar la cuenta.",
      ok: false,
    });
  }
};

module.exports = { eliminarCuentaController };
