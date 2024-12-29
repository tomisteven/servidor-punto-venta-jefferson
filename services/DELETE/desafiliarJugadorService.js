const Jugador = require("../../models/Jugador");

const Club = require("../../models/Club");
const mongoose = require("mongoose");

/**
 * Desafilia un jugador de un club.
 * @param {String} user_id - ID del jugador.
 * @param {String} id_club - ID del club.
 * @returns {Object} - Mensaje de éxito.
 * @throws {Error} - Si ocurre algún problema en la operación.
 */
const desafiliarJugadorService = async (user_id, id_club) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Buscar jugador y club en paralelo
    const [jugador, club] = await Promise.all([
      Jugador.findById(user_id).session(session),
      Club.findById(id_club).session(session),
    ]);

    if (!jugador || !club) {
      throw new Error("Jugador o club no encontrado");
    }

    // Filtrar afiliaciones
    jugador.clubesAfiliados = jugador.clubesAfiliados.filter(
      (ca) => !ca.clubId.equals(id_club)
    );
    club.jugadoresAfiliados = club.jugadoresAfiliados.filter(
      (ju) => !ju.jugadorId.equals(user_id)
    );

    // Guardar cambios en paralelo
    await Promise.all([jugador.save({ session }), club.save({ session })]);

    // Confirmar la transacción
    await session.commitTransaction();
    session.endSession();

    return { ok: true, message: "Club desafiliado del jugador" };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

module.exports = { desafiliarJugadorService };
