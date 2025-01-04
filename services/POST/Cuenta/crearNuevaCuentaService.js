const Cuenta = require("../../../models/Cuenta");

const crearNuevaCuentaService = async (
  email,
  clave,
  servicio,
  servicioID
) => {
  // Buscar la última cuenta con el mismo email y clave
  const ultimaCuenta = await Cuenta.findOne({ email, clave })
    .sort({ nCuenta: -1 }) // Ordenar por número de cuenta descendente
    .lean();

  // Calcular el número de cuenta
  const nuevoNumeroCuenta = ultimaCuenta ? ultimaCuenta.nCuenta + 1 : 1;

  // Crear la nueva cuenta
  const nuevaCuenta = new Cuenta({
    email,
    clave,
    nCuenta: nuevoNumeroCuenta,
    servicio,
    servicioID,
  });

  // Guardar la nueva cuenta
  await nuevaCuenta.save();

  return nuevaCuenta;
};

module.exports = { crearNuevaCuentaService };
