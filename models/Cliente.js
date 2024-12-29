const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ClienteSchema = new Schema({
  nombreCompleto: String,
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
  telefono: String,
  comprasRealizadas: [
    {
      servicio: {
        type: Schema.Types.ObjectId,
        ref: "Servicio",
      },
      cuenta: {
        type: Schema.Types.ObjectId,
        ref: "Cuenta",
      },
      banco: {
        type: Schema.Types.ObjectId,
        ref: "Banco",
      },
    },
  ],
  totalGastado: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Cliente", ClienteSchema);
