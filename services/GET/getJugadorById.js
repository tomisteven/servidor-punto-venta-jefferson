const Jugador = require("../../models/Jugador");

const getJugadorById = async (id, session) => {
  console.log("Peticion desde Services");

  return await Jugador.findById(id).session(session);
};

module.exports = { getJugadorById };
