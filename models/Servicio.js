const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ServicioSchema = new Schema({
  nombre: String,
  precio: Number,
  nCuentas: Number,
  combo: {
    type: Boolean,
    default: false,
  },
  servicioCombo: [
    {
      type: Schema.Types.ObjectId,
      ref: "Servicio",
    },
  ],
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
  clientesQueLoCompraron: [
    {
      type: Schema.Types.ObjectId,
      ref: "Cliente",
    },
  ],
  totalVendido: Number,
  totalCompras: Number,
});

module.exports = mongoose.model("Servicio", ServicioSchema);
