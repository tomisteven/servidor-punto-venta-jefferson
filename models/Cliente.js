const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ClienteSchema = new Schema({
  nombreCompleto: String,
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
  telefono: String,
  comprasIndividualesRealizadas: [
    {
      type: Schema.Types.ObjectId,
      ref: "Compra",
    },
  ],
  comprasCombosRealizadas: [
    {
      type: Schema.Types.ObjectId,
      ref: "CompraCombo",
    },
  ],
  totalGastado: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Cliente", ClienteSchema);
