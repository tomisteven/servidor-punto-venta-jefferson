const Club = require("../../models/Club");
const User = require("../../models/Jugador");
const { createBug } = require("../POST/bug.controller");

const actualizarJugador = async (req, res) => {
  try {
    const { user_id } = req.user;
    if (!user_id) {
      return res.status(400).json({
        message: "user_id es requerido",
        ok: false,
      });
    }

    const jugador = await User.findOne({ _id: user_id });
    console.log(jugador);

    Object.keys(req.body).forEach((key) => {
      jugador[key] = req.body[key];
    });

    await jugador.save();

    return res.status(200).json({
      message: "Jugador actualizado correctamente",
      ok: true,
    });
  } catch (error) {
    await createBug(error, "jugador:actualizarJugador");
    return res.status(500).json({ message: "Error del servidor", ok: false });
  }
};

module.exports = { actualizarJugador };
