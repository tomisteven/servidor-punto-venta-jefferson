const updateModel = async (model, id, body) => {
  try {
    const update = await model.findByIdAndUpdate(
      id,
      { $set: body }, // Actualiza solo los campos que se pasan en el cuerpo de la solicitud
      { new: true, runValidators: true } // new: true para devolver el club actualizado, runValidators para validar los cambios
    );

    // Verificar si se encontró y actualizó el documento
    if (!update) {
      throw new Error("Modelo no encontrado");
    }

    return { update };
  } catch (error) {
    console.log(error);
  }
};

module.exports = { updateModel };
