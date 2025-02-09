const Router = require("express");
const { asureAuth } = require("../middlewares/authenticated");

const router = Router();

const {
  getClientes,
  getVentasClienteController,
  verVentasClienteController,
} = require("../controllers/GET/clientes.controller.js");
const {
  crearNuevoClienteController,
  crearNuevaVentaController,
  crearNuevaVentaConComboController,
  crearClientesMasivos,
  agregarComentarioCliente,
  crearNuevaVentaConComboController2,
} = require("../controllers/POST/cliente.controller.js");

const {
  eliminarClienteController,
  deleteAllClientes,
} = require("../controllers/DELETE/cliente.controller.js");

router.get("/", asureAuth, getClientes);
router.get("/:id", asureAuth, getClientes);
router.get("/ventas/:id", asureAuth, getVentasClienteController);
//router.get("/ver/compras/:id", asureAuth, verComprasClienteController);

router.post("/nuevo", asureAuth, crearNuevoClienteController);
router.post("/nuevo/comentario/:id", asureAuth, agregarComentarioCliente);
router.post("/nuevo/masivo", asureAuth, crearClientesMasivos);
router.post("/crear/venta", asureAuth, crearNuevaVentaController);
router.post("/crear/combo/venta", asureAuth, crearNuevaVentaConComboController);
router.post("/crear/combo/venta/dos", asureAuth, crearNuevaVentaConComboController2);

router.delete("/:id", asureAuth, eliminarClienteController);
router.delete("/eliminar/all", asureAuth, deleteAllClientes);
//router.patch("/:id", asureAuth, actualizarClienteController);

module.exports = router;
