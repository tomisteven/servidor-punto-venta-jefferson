const Cliente = require("../../../models/Cliente");

const crearNuevoCliente = async (clienteData) => {
  try {
    const clienteExiste = await Cliente.find().or([
      { nombreCompleto: clienteData.nombreCompleto },
    ]);

    if (clienteExiste.length > 0) {
      throw new Error("El cliente ya existe");
    }

    const nuevoCliente = new Cliente(clienteData);
    await nuevoCliente.save();
    return nuevoCliente;
  } catch (error) {
    throw new Error("Error al crear el cliente: " + error.message);
  }
};

module.exports = { crearNuevoCliente };
