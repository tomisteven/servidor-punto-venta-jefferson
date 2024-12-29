const Partido = require("../../models/Partido");
const Jugador = require("../../models/Jugador");
const mongoose = require("mongoose");

/**
 * Cancela la postulación de un jugador a un partido.
 * @param {String} id_partido - ID del partido.
 * @param {String} user_id - ID del jugador.
 * @returns {Object} - Mensaje de éxito.
 * @throws {Error} - Si ocurre algún problema en la operación.
 */
const cancelarPostulacionAPartidoService = async (id_partido, user_id) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Buscar partido y jugador en paralelo
    const [partido, jugador] = await Promise.all([
      Partido.findById(id_partido).session(session),
      Jugador.findById(user_id).session(session),
    ]);

    if (!partido || !jugador) {
      throw new Error("No se encontró el partido o el jugador.");
    }

    // Validar si el jugador está inscrito en el partido
    const jugadorEnPartido = partido.jugadores.find((j) =>
      j.jugadorId.equals(user_id)
    );
    if (!jugadorEnPartido) {
      throw new Error("El jugador no está inscrito en este partido.");
    }

    // Actualizar el estado del partido y remover al jugador
    partido.jugadores = partido.jugadores.filter(
      (j) => !j.jugadorId.equals(user_id)
    );
    if (partido.jugadores.length < 4) {
      partido.estado = "pendiente";
    }

    // Actualizar los partidos activos del jugador
    jugador.partidosActivos = jugador.partidosActivos.filter(
      (p) => !p.equals(id_partido)
    );

    // Guardar los cambios en paralelo
    await Promise.all([partido.save({ session }), jugador.save({ session })]);

    // Confirmar la transacción
    await session.commitTransaction();
    session.endSession();

    return { ok: true, message: "Te bajaste correctamente del partido." };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

module.exports = { cancelarPostulacionAPartidoService };
