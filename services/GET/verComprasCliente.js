const Cliente = require("../../models/Cliente");

const verComprasClienteService = async (id) => {
  return await Cliente.findById(id).select("comprasRealizadas -_id").lean();
};

module.exports = { verComprasClienteService };
