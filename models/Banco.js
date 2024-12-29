const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BancoSchema = new Schema({
  nombre: String,
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
  comprasRealizadas: [
    {
      compras: {
        type: Schema.Types.ObjectId,
        ref: "Compra",
      },
    },
  ],
  totalGastado: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Banco", BancoSchema);
