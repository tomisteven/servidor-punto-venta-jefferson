const Cliente = require("../../models/Cliente");
const Servicio = require("../../models/Servicio");
const Banco = require("../../models/Banco");
const Cuenta = require("../../models/Cuenta");
const {
  verComprasClienteService,
} = require("../../services/GET/verComprasCliente");

const getClientes = async (req, res) => {
  const { id } = req.params;

  try {
    let cliente;

    if (id) {
      // Buscar cliente y sus compras en paralelo
      const [clienteData, clienteCompras] = await Promise.all([
        Cliente.findById(id).lean(),
        verComprasClienteService(id),
      ]);

      if (!clienteData) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }

      if (clienteCompras) {
        // Enriquecer las compras con sus relaciones
        const comprasEnriquecidas = await Promise.all(
          clienteCompras.comprasRealizadas.map(async (compra) => {
            const [servicio, banco, cuenta] = await Promise.all([
              Servicio.findById(compra.servicio)
                .select("nombre descripcion -_id")
                .lean(),
              Banco.findById(compra.banco).select("nombre -_id").lean(),
              Cuenta.findById(compra.cuenta).select("email clave -_id").lean(),
            ]);

            return {
              ...compra,
              servicio,
              banco,
              cuenta,
            };
          })
        );

        cliente = {
          ...clienteData,
          comprasRealizadas: comprasEnriquecidas,
        };
      } else {
        cliente = clienteData;
      }
    } else {
      // Obtener todos los clientes sin procesar compras
      cliente = await Cliente.find().lean();
    }

    res.status(200).json(cliente);
  } catch (error) {
    console.error("Error en getClientes:", error);
    res
      .status(500)
      .json({ message: "Error en el servidor. Intente nuevamente más tarde." });
  }
};

const getVentasClienteController = async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar al cliente por ID
    const cliente = await Cliente.findById(id)
      .populate({
        path: "comprasIndividualesRealizadas",
        populate: [
          { path: "servicio", select: "nombre -_id" },
          { path: "cuenta", select: "email clave -_id" },
        ],
      })
      .populate({
        path: "comprasCombosRealizadas",
        populate: [
          { path: "servicio", select: "nombre -_id" },
          { path: "cuentas", model: "Cuenta", select: "email clave -_id" },
        ],
      })
      .lean();

    if (!cliente) {
      return res.status(404).json({
        message: "Cliente no encontrado.",
        ok: false,
      });
    }

    // Formatear compras individuales
    const comprasIndividuales = cliente.comprasIndividualesRealizadas.map(
      (compra) => ({
        _id: compra._id,
        servicio: compra.servicio?.nombre || "Servicio desconocido",
        cuentas: compra.cuenta
          ? [{ email: compra.cuenta.email, clave: compra.cuenta.clave }]
          : [],
      })
    );

    // Formatear compras combo
    const comprasCombos = cliente.comprasCombosRealizadas.map(
      (compraCombo) => ({
        _id: compraCombo._id,
        servicio: compraCombo.servicio?.nombre || "Servicio desconocido",
        cuentas: compraCombo.cuentas.map((cuenta) => ({
          email: cuenta.email,
          clave: cuenta.clave,
        })),
      })
    );

    return res.status(200).json({
      message: "Compras del cliente obtenidas exitosamente.",
      cliente: {
        nombreCompleto: cliente.nombreCompleto,
        totalGastado: cliente.totalGastado,
        telefono: cliente.telefono,
        comentarios: cliente.comentarios,
        id: cliente._id,
      },
      compras: {
        individuales: comprasIndividuales,
        combos: comprasCombos,
      },
      ok: true,
    });
  } catch (error) {
    console.error("Error en getComprasClienteController:", error);
    return res.status(500).json({
      message:
        "Error en el servidor. No se pudieron obtener las compras del cliente.",
      ok: false,
    });
  }
};

module.exports = { getClientes, getVentasClienteController };
