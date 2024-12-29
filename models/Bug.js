const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BugSchema = new Schema({
  error: String,
  fecha: { type: Date, default: Date.now },
  funcion: String,
  estado: {
    type: String,
    enum: ['Pendiente', 'Corregido', 'Rechazado'], // Valores permitidos
    required: true, // Obligatorio
    default: 'Pendiente', // Valor por defecto
  },

});

module.exports = mongoose.model("Bug", BugSchema);
