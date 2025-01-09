const Cliente = require("../../models/Cliente");

const getClienteID = async (id) => {
  try {
    const cliente = await Cliente.findById(id);
    return cliente;
  } catch (error) {
    console.error("Error en getClienteID:", error);
    return res.status(500).json({
      message: "Error al obtener el cliente.",
      ok: false,
    });
  }
};

module.exports = getClienteID;
