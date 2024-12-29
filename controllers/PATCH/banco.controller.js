const Banco = require("../../models/Banco");
const mongoose = require("mongoose");

const actualizarBancoController = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    // Validar el ID proporcionado
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "El ID proporcionado no es válido.",
        ok: false,
      });
    }

    // Validar que el body no esté vacío
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No se proporcionaron datos para actualizar.",
        ok: false,
      });
    }

    // Definir los campos permitidos para la actualización
    const camposPermitidos = [
      "nombre",
      "fechaCreacion",
      "totalGastado",
      "comprasRealizadas",
    ];
    const camposActualizados = Object.keys(updates);

    // Validar que solo se actualicen campos permitidos
    const camposInvalidos = camposActualizados.filter(
      (campo) => !camposPermitidos.includes(campo)
    );
    if (camposInvalidos.length > 0) {
      return res.status(400).json({
        message: `Los siguientes campos no son válidos para la actualización: ${camposInvalidos.join(
          ", "
        )}`,
        ok: false,
      });
    }

    // Actualizar el banco
    const banco = await Banco.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true } // Ejecutar validaciones de mongoose al actualizar
    );

    if (!banco) {
      return res.status(404).json({
        message: "Banco no encontrado.",
        ok: false,
      });
    }

    return res.status(200).json({
      banco,
      ok: true,
    });
  } catch (error) {
    console.error("Error en actualizarBancoController:", error);

    return res.status(500).json({
      message: "Error en el servidor. No se pudo actualizar el banco.",
      ok: false,
    });
  }
};

module.exports = { actualizarBancoController };
