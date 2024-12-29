const Compra = require("../../models/Compra");
const Cliente = require("../../models/Cliente");
const mongoose = require("mongoose");
const Banco = require("../../models/Banco");

const eliminarCompraController = async (req, res) => {
  const { id } = req.params;

  // Iniciar sesión para la transacción
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Buscar y eliminar la compra
    const compra = await Compra.findByIdAndDelete(id, { session }).lean();
    if (!compra) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        message: "Compra no encontrada.",
        ok: false,
      });
    }

    // Buscar el banco relacionado
    const banco = await Banco.findById(compra.banco).session(session);
    if (banco) {
      // Eliminar la compra de la lista de compras realizadas del banco
      banco.comprasRealizadas.pull(id);

      // Actualizar el total gastado, asegurando que no sea negativo
      banco.totalGastado = Math.max(0, banco.totalGastado - compra.precio);

      // Guardar los cambios en el banco
      await banco.save({ session });
    }

    // Confirmar la transacción
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Compra eliminada correctamente y el banco actualizado.",
      ok: true,
    });
  } catch (error) {
    console.error("Error en eliminarCompraController:", error);

    // Revertir cambios en caso de error
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      message:
        "Error al eliminar la compra. Por favor, intente nuevamente más tarde.",
      ok: false,
    });
  }
};

module.exports = { eliminarCompraController };
