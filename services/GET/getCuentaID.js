const Cuenta = require("../../models/Cuenta");

const getCuentaID = async (id) => {
  try {
    const cuenta = await Cuenta.findById(id);
    return cuenta;
  } catch (error) {
    console.error("Error en getCuentaID:", error);
    return res.status(500).json({
      message: "Error al obtener la cuenta.",
      ok: false,
    });
  }
};

module.exports = getCuentaID;
