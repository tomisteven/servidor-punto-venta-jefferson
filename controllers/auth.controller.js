const bcrypt = require("bcrypt-nodejs");
const Jugador = require("../models/Jugador");
const Club = require("../models/Club");
const {
  createRefreshToken,
  createToken,
  decodedToken,
} = require("../utils/jwt");
const { createBug } = require("./POST/bug.controller");

const register = async (req, res) => {
  const { email, password, repeatPassword, nombre } = req.body;

  if (!password || !repeatPassword) {
    return res
      .status(400)
      .send({ message: "Las contraseñas son obligatorias" });
  }

  if (password !== repeatPassword) {
    return res.status(400).send({ message: "Las contraseñas no coinciden" });
  }

  try {
    const user = new Jugador();
    user.email = email.toLowerCase();
    user.role = "JUGADOR";
    user.nombre = nombre;

    // Hashing the password
    const hash = bcrypt.hashSync(password, null, null);
    user.password = hash;

    // Saving the user
    const userStored = await user.save();

    if (!userStored) {
      return res.status(404).send({ message: "Error al crear el usuario" });
    }

    return res.status(200).send({ user: userStored });
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate email error, for example
      await createBug(err, "auth:register");
      return res.status(400).send({ message: "El usuario ya existe" });
    }
    return res.status(500).send({ message: "Error del servidor", error: err });
  }
};

const registerClub = async (req, res) => {
  try {
    const { nombreClub, email, password, repeatPassword } = req.body;

    const clubesExistentes = await Club.find({
      email: email.toLowerCase(),
    });

    if (clubesExistentes.length > 0) {
      return res.status(400).send({ message: "El club ya existe" });
    }

    if (!password || !repeatPassword) {
      return res
        .status(400)
        .send({ message: "Las contraseñas son obligatorias" });
    }

    if (password !== repeatPassword) {
      return res.status(400).send({ message: "Las contraseñas no coinciden" });
    }

    const club = new Club();
    club.nombreClub = nombreClub;
    club.username = nombreClub.slice(0, 3) + Math.floor(Math.random() * 1000);
    club.email = email.toLowerCase();
    club.rol = "CLUB";

    // Hashing the password
    const hash = bcrypt.hashSync(password, null, null);
    club.password = hash;

    // Saving the user
    const clubStored = await club.save();

    if (!clubStored) {
      return res.status(404).send({ message: "Error al crear el club" });
    }

    return res.status(200).send(clubStored);
  } catch (error) {
    await createBug(error, "auth:resiterClub");
    return res.status(500).json({ message: "error en el servidor", ok: false });
  }
};

const loginClub = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) res.status(404).send({ message: "El email es obligatorio" });
    if (!password)
      res.status(404).send({ message: "La contraseña es obligatoria" });
    Club.findOne({ email: email.toLowerCase() }, (err, userStored) => {
      if (err) res.status(500).send({ message: "Error del servidor" });
      if (!userStored)
        res.status(404).send({ message: "Usuario no encontrado" });
      else {
        bcrypt.compare(password, userStored.password, (bycriptErr, check) => {
          if (bycriptErr)
            res.status(500).send({ message: "Error del servidor" });
          if (!check)
            res.status(404).send({ message: "La contraseña es incorrecta" });
          else
            res.status(200).send({
              accessToken: createToken(userStored),
              refreshToken: createRefreshToken(userStored),
              //agregue los tokens para que no me de error cuando me creo un usuario nuevo desde un admin
            });
        });
      }
    });
  } catch (error) {
    await createBug(error, "auth:loginClub");
    return res.status(500).json({ message: "error en el servidor", ok: false });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) res.status(404).send({ message: "El email es obligatorio" });
    if (!password)
      res.status(404).send({ message: "La contraseña es obligatoria" });
    Jugador.findOne({ email: email.toLowerCase() }, (err, userStored) => {
      if (err) res.status(500).send({ message: "Error del servidor" });
      if (!userStored)
        res.status(404).send({ message: "Usuario no encontrado" });
      else {
        bcrypt.compare(password, userStored.password, (bycriptErr, check) => {
          if (bycriptErr)
            res.status(500).send({ message: "Error del servidor" });
          if (!check)
            res.status(404).send({ message: "La contraseña es incorrecta" });
          else
            res.status(200).send({
              accessToken: createToken(userStored),
              refreshToken: createRefreshToken(userStored),
              //agregue los tokens para que no me de error cuando me creo un usuario nuevo desde un admin
            });
        });
      }
    });
  } catch (error) {
    await createBug(error, "auth:login");
    return res.status(500).json({ message: "error en el servidor", ok: false });
  }
};

const refreshToken = (req, res) => {
  const { token } = req.body;
  if (!token) res.status(404).send({ message: "El token requerido" });
  const { user_id } = decodedToken(token);
  if (!user_id) res.status(404).send({ message: "El token es invalido" });
  else {
    User.findOne({ _id: user_id }, (err, userStored) => {
      if (err) res.status(500).send({ message: "Error del servidor" });
      if (!userStored)
        res.status(404).send({ message: "Usuario no encontrado" });
      else {
        res.status(200).send({
          accessToken: createToken(userStored),
          //refreshToken: createRefreshToken(userStored)
        });
      }
    });
  }
};

//exportamos
module.exports = {
  register,
  login,
  loginClub,
  refreshToken,
  registerClub,
};
