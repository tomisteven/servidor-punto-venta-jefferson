const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CompraComboSchema = new Schema({
  servicio: {
    type: Schema.Types.ObjectId,
    ref: "Servicio",
  },
  cliente: {
    type: Schema.Types.ObjectId,
    ref: "Cliente",
  },
  cuentas: [
    {
      type: Schema.Types.ObjectId,
      ref: "Cuenta",
    },
  ],
  banco: {
    type: Schema.Types.ObjectId,
    ref: "Banco",
  },
  fecha: {
    type: Date,
    default: Date.now,
  },
  precio: Number,
});

module.exports = mongoose.model("CompraCombo", CompraComboSchema);
