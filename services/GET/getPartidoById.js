const Partido = require("../../models/Partido");

const getPartidoById = async (id) => {
  return await Partido.findById(id);
};

module.exports = { getPartidoById };
