const Partido = require("../../models/Partido");

const getPartidoByFilter = async (id, filtro = {}, strings) => {
  return await Partido.find(id, filtro, strings).lean();
};

module.exports = { getPartidoByFilter };
