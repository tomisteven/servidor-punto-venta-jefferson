const dotenv = require("dotenv");
dotenv.config();

//middleware que verifica si el usuário está autenticado
function asureAuth(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(403).send({ message: "No hay token de autorizacion" });
  }

  try {
    if (token !== process.env.token) {
      return res.status(401).send({ message: "Token invalido" });
    } else {
      next();
    }
  } catch (error) {
    return res.status(401).send({ message: "Token invalido" });
  }
}

module.exports = {
  asureAuth,
};
