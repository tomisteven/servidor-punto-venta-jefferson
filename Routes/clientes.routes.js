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
} = require("../controllers/POST/cliente.controller.js");

const {eliminarClienteController} = require("../controllers/DELETE/cliente.controller.js");

router.get("/", asureAuth, getClientes);
router.get("/:id", asureAuth, getClientes);
router.get("/ventas/:id", asureAuth, getVentasClienteController);
//router.get("/ver/compras/:id", asureAuth, verComprasClienteController);

router.post("/nuevo", asureAuth, crearNuevoClienteController);
router.post("/crear/venta", asureAuth, crearNuevaVentaController);


router.delete("/:id", asureAuth, eliminarClienteController);
//router.patch("/:id", asureAuth, actualizarClienteController);






module.exports = router;
