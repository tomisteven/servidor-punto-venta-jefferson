const mongoose = require("mongoose");
const Partido = require("../../models/Partido");

/**
 * Cancela un partido si no tiene jugadores y el usuario es el propietario.
 * @param {String} id_partido - ID del partido a cancelar.
 * @param {String} user_id - ID del usuario que solicita la cancelación.
 * @returns {Object} - Mensaje de éxito o error.
 */
const cancelarPartidoSinJugadoresService = async (id_partido, user_id) => {
  const session = await mongoose.startSession(); // Iniciar una sesión para la transacción
  session.startTransaction();

  try {
    // Buscar el partido por ID
    const partido = await Partido.findById(id_partido).session(session);
    if (!partido) {
      throw new Error("Partido no encontrado");
    }

    // Verificar si el usuario es el propietario del partido
    const esPropietario = partido.jugadores.some((j) =>
      j.jugadorId.equals(user_id)
    );
    if (!esPropietario) {
      throw new Error("No sos el propietario del partido para eliminarlo");
    }

    // Verificar si el partido tiene jugadores
    if (partido.jugadores.length > 1) {
      throw new Error(
        "No se puede cancelar el partido ya que hay jugadores disponibles para jugar"
      );
    }

    // Eliminar el partido
    await Partido.deleteOne({ _id: id_partido }, { session });

    // Confirmar la transacción
    await session.commitTransaction();
    session.endSession();

    return { ok: true, message: "Partido cancelado correctamente" };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

module.exports = { cancelarPartidoSinJugadoresService };
