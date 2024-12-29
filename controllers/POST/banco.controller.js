const Banco = require("../../models/Banco");

const crearNuevoBancoController = async (req, res) => {
  const { nombre } = req.body;

  try {
    if (!nombre) {
      return res.status(400).json({
        message: "El campo nombre es obligatorio.",
        ok: false,
      });
    }

    const bancoExistente = await Banco.findOne({ nombre });

    if (bancoExistente) {
      return res.status(400).json({
        message: "Ya existe un banco con ese nombre.",
        ok: false,
      });
    }

    const nuevoBanco = new Banco({
      nombre,
    });

    await nuevoBanco.save();

    return res.status(201).json({
      message: "Banco creado con éxito.",
      banco: nuevoBanco,
      ok: true,
    });
  } catch (error) {
    console.error("Error en crearNuevoBancoController:", error);
    return res.status(500).json({
      message: "Error en el servidor. No se pudo crear el banco.",
      ok: false,
    });
  }
};

module.exports = { crearNuevoBancoController };
