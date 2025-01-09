const Cliente = require("../../models/Cliente");
const mongoose = require("mongoose");

const deleteAllClientes = async (req, res) => {
  try {
    await Cliente.deleteMany();
    return res.status(200).json({
      message: "Todos los clientes han sido eliminados.",
      ok: true,
    });
  } catch (error) {
    console.error("Error en deleteAllClientes:", error);
    return res.status(500).json({
      message: "Error al eliminar todos los clientes.",
      ok: false,
    });
  }
};

const eliminarClienteController = async (req, res) => {
  const { id } = req.params;

  // Iniciar sesión para la transacción
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Buscar y eliminar el cliente
    const cliente = await Cliente.findByIdAndDelete(id, { session });

    if (!cliente) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        message: "Cliente no encontrado.",
        ok: false,
      });
    }

    // Si hay datos relacionados, puedes eliminarlos aquí
    // Ejemplo: Eliminar compras relacionadas con el cliente
    //await Compra.deleteMany({ cliente: id }, { session });

    // Confirmar la transacción
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Cliente eliminado junto con datos relacionados.",
      ok: true,
    });
  } catch (error) {
    console.error("Error en eliminarClienteController:", error);

    // Revertir cambios en caso de error
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      message:
        "Error al eliminar el cliente. Por favor, intente nuevamente más tarde.",
      ok: false,
    });
  }
};

module.exports = { eliminarClienteController, deleteAllClientes };
