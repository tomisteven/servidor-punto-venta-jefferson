const Jugador = require("../models/Jugador");
const Partido = require("../models/Partido");
const Club = require("../models/Club");

const validarModelo = async (res, modelo, id) => {
  switch (modelo) {
    case Jugador:
      const jugador = await Jugador.findById(id).lean();
      if (jugador) {
        return jugador;
      } else {
        return res
          .status(500)
          .json({ message: "Jugador no encontrado", ok: false });
      }

    default:
      return "Nada";
      break;
  }
};

module.exports = {
  validarModelo,
};
