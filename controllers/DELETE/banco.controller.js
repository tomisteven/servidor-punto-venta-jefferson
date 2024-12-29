const Banco = require("../../models/Banco");
const mongoose = require("mongoose");

//elimino el banco NO elimino la COMPRA
const eliminarBancoController = async (req, res) => {
  const { id } = req.params;

  // Iniciar una sesión para transacciones
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Buscar el banco antes de eliminarlo
    const banco = await Banco.findById(id).session(session);
    if (!banco) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        message: "Banco no encontrado.",
        ok: false,
      });
    }

    /*  // Eliminar datos relacionados (compras, clientes, etc.)
    if (banco.comprasRealizadas && banco.comprasRealizadas.length > 0) {
      await Promise.all(
        banco.comprasRealizadas.map(async (compraId) => {
          await Compra.findByIdAndDelete(compraId, { session });
        })
      );
    } */

    // Eliminar el banco
    await Banco.findByIdAndDelete(id, { session });

    // Confirmar la transacción
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message:
        "Banco eliminado correctamente junto con sus datos relacionados.",
      ok: true,
    });
  } catch (error) {
    console.error("Error en eliminarBancoController:", error);

    // Revertir cambios en caso de error
    await session.abortTransaction();
    session.endSession();

    // Manejo de errores específicos
    if (error.name === "CastError" && error.kind === "ObjectId") {
      return res.status(400).json({
        message: "El ID proporcionado no es válido.",
        ok: false,
      });
    }

    return res.status(500).json({
      message:
        "Error al eliminar el banco. Por favor, intente nuevamente más tarde.",
      ok: false,
    });
  }
};

module.exports = { eliminarBancoController };
