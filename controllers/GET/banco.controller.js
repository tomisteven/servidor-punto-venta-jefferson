const Banco = require("../../models/Banco");
const Compra = require("../../models/Compra");

const getBancos = async (req, res) => {
  try {
    // Buscar todos los bancos y poblar sus compras realizadas
    const bancos = await Banco.find().lean();

    // Poblar las compras realizadas de cada banco
    if (bancos && bancos.length > 0) {
      await Promise.all(
        bancos.map(async (banco) => {
          if (banco.comprasRealizadas.length > 0) {
            banco.comprasRealizadas = await Promise.all(
              banco.comprasRealizadas.map(async (item) => {
                const compra = await Compra.findById(item).lean();
                return compra || item; // Retorna el documento completo o el objeto original
              })
            );
          }
        })
      );
    }

    // Si no hay bancos, devolver una respuesta apropiada
    if (!bancos || bancos.length === 0) {
      return res.status(404).json({
        message: "No se encontraron bancos.",
        ok: false,
      });
    }

    return res.status(200).json({
      bancos,
      ok: true,
    });
  } catch (error) {
    console.error("Error en getBancos:", error);

    return res.status(500).json({
      message: "Error en el servidor. No se pudo obtener los bancos.",
      ok: false,
    });
  }
};

const getBanco = async (req, res) => {
  const { id } = req.params;

  try {
    const banco = await Banco.findById(id).lean();

    if (banco && banco.comprasRealizadas.length > 0) {
      banco.comprasRealizadas = await Promise.all(
        banco.comprasRealizadas.map(async (item) => {
          const compra = await Compra.findById(item).lean();
          return compra || item; // Retorna el documento completo o el objeto original
        })
      );
    }

    if (!banco) {
      return res.status(404).json({
        message: "Banco no encontrado.",
        ok: false,
      });
    }

    res.status(200).json({ banco, ok: true });
  } catch (error) {
    console.error("Error en getBanco:", error);
    return res.status(500).json({
      message: "Error en el servidor. No se pudo obtener el banco.",
      ok: false,
    });
  }
};

module.exports = { getBancos, getBanco };
