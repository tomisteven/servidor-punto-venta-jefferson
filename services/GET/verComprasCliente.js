const Cliente = require("../../models/Cliente");

const verComprasClienteService = async (id) => {
  return await Cliente.findById(id).select("comprasIndividualesRealizadas comprasComboRealizadas -_id").lean();
};

module.exports = { verComprasClienteService };
