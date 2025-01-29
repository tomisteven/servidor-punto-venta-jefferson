const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CompraSchema = new Schema({
  servicio: {
    type: Schema.Types.ObjectId,
    ref: "Servicio",
  },
  cliente: {
    type: Schema.Types.ObjectId,
    ref: "Cliente",
  },
  cuenta: {
    type: Schema.Types.ObjectId,
    ref: "Cuenta",
  },
  banco: {
    type: Schema.Types.ObjectId,
    ref: "Banco",
  },
  fecha: {
    type: Date,
    default: Date.now,
  },
  fechaCaducacion: {
    type: Date,
    default: Date.now,
  },
  precio: Number,
  comentarios: [
    {
      comentario: String,
    },
  ],
});

module.exports = mongoose.model("Compra", CompraSchema);
