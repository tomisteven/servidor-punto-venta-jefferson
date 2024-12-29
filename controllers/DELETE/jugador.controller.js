const Jugador = require("../../models/Jugador");
const Partido = require("../../models/Partido");
const Club = require("../../models/Club");
const { router } = require("../../app");
const { createBug } = require("../POST/bug.controller");
const mongoose = require("mongoose");
const {
  cancelarPartidoSinJugadoresService,
} = require("../../services/DELETE/cancelarPartidoSinJugadores");
const {
  desafiliarJugadorService,
} = require("../../services/DELETE/desafiliarJugadorService");

const cancelarPartidoSinJugadores = async (req, res) => {
  const { id_partido } = req.params;
  const { user_id } = req.user;

  try {
    // Llamar al servicio para cancelar el partido
    const result = await cancelarPartidoSinJugadoresService(
      id_partido,
      user_id
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error en cancelarPartidoSinJugadoresController:", error);
    await createBug(error, "jugador:cancelarPartidoSinJugadores");
    return res.status(500).json({
      message: error.message || "Error en el servidor al cancelar el partido",
      ok: false,
    });
  }
};

const desafiliarJugador = async (req, res) => {
  const { id_club } = req.params;
  const { user_id } = req.user;

  try {
    const result = await desafiliarJugadorService(user_id, id_club);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error en desafiliarJugadorController:", error);
    //await createBug(error, "jugador:desafiliarJugador");
    return res.status(500).json({
      message: error.message || "Error en el servidor",
      ok: false,
    });
  }
};

const cancelarPostulacionAPartido = async (req, res) => {
  const { id_partido } = req.params;
  const { user_id } = req.user;

  try {
    const result = await cancelarPartidoSinJugadoresService(
      id_partido,
      user_id
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error en cancelarPostulacionAPartidoController:", error);
    await createBug(error, "jugador:cancelarPostulacionPartido");
    return res.status(500).json({
      message: error.message || "Error en el servidor",
      ok: false,
    });
  }
};

module.exports = {
  desafiliarJugador,
  cancelarPostulacionAPartido,
  cancelarPartidoSinJugadores,
};



