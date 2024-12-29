const Jugador = require("../../models/Jugador");

const filterJugadoresBy = async (obj, returns) => {
  console.log("Peticion desde Services");

  const jugadores = await Jugador.find(obj, returns).lean();
  return jugadores;
};

module.exports = { filterJugadoresBy };
