const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UsuarioSchema = new Schema({
  nombre: String,
  apellido: String,
  email: String,
  password: String,
  rol : string
});

module.exports = mongoose.model("Usuario", UsuarioSchema);
