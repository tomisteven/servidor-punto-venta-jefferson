const Banco = require("../../models/Banco");

const getBancoID = async (id) => {
  try {
    const banco = await Banco.findById(id);
    return banco;
  } catch (error) {
    console.error("Error en getBancoID:", error);
    return res.status(500).json({
      message: "Error al obtener el banco.",
      ok: false,
    });
  }
};

module.exports = getBancoID;
