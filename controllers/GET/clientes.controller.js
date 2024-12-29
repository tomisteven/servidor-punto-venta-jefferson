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
    // Obtener las compras del cliente utilizando el servicio
    const cliente = await verComprasClienteService(id);

    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    // Acceder a las compras realizadas por el cliente
    const comprasCliente = cliente.comprasRealizadas;

    // Transformar las compras con la información de servicios, banco y cuenta
    const comprasEnriquecidas = await Promise.all(
      comprasCliente.map(async (compra) => {
        const servicio = await Servicio.findById(compra.servicio).select(
          "nombre descripcion -_id"
        );
        const banco = await Banco.findById(compra.banco).select("nombre -_id");
        const cuenta = await Cuenta.findById(compra.cuenta).select(
          "email clave -_id"
        );

        return {
          ...compra,
          servicio,
          banco,
          cuenta,
        };
      })
    );

    res.status(200).json(comprasEnriquecidas);
  } catch (error) {
    console.error("Error en getVentasClienteController:", error);
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

module.exports = { getClientes, getVentasClienteController };
