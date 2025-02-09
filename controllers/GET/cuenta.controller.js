const Cuenta = require("../../models/Cuenta");

const getCuentasController = async (req, res) => {
  const { id } = req.params;

  try {
    let cuenta;
    id
      ? (cuenta = await Cuenta.findById(id))
      : (cuenta = await Cuenta.find().lean());
    if (!cuenta) {
      return res.status(404).json({ message: "Cuenta no encontrada" });
    }
    res.status(200).json(cuenta);
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

const cuentasEnStockController = async (req, res) => {
  try {
    let cuentasEnStock = await Cuenta.find({
      cliente: { $exists: false }, // O también puede ser { $eq: null }
    }).lean();
    if (!cuentasEnStock) {
      return res.status(404).json({ message: "Cuenta no encontrada" });
    }
    res.status(200).json(cuentasEnStock);
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

const cuentasEnStockConServicioController = async (req, res) => {
  const { servicio } = req.params;

  try {
    // Convertir la primera letra de la cadena a mayúscula
    const servicioC = servicio.charAt(0).toUpperCase() + servicio.slice(1);

    let cuentasEnStockConServicio = await Cuenta.find({
      cliente: { $exists: false }, // O también puede ser { $eq: null }
      servicio: servicioC,
    }).lean();
    if (!cuentasEnStockConServicio) {
      return res.status(404).json({ message: "Cuenta no encontrada" });
    }
    res.status(200).json(cuentasEnStockConServicio);
  } catch (error) {
    console.log("Error en cuentasEnStockConServicioController:", error);

    res.status(500).json({ message: error });
  }
};

module.exports = {
  getCuentasController,
  cuentasEnStockController,
  cuentasEnStockConServicioController,
};
