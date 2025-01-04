const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CuentaSchema = new Schema({
  email: String,
  clave: String,
  nCuenta: Number,
  cliente: {
    type: Schema.Types.ObjectId,
    ref: "Cliente",
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
  servicio: String,
  servicioID: {
    type: Schema.Types.ObjectId,
    ref: "Servicio",
  },
  precio: Number,
});

module.exports = mongoose.model("Cuenta", CuentaSchema);
