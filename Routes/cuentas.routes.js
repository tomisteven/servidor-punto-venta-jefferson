const Router = require("express");
const { asureAuth } = require("../middlewares/authenticated");
const {
  getCuentasController,
  cuentasEnStockController,
} = require("../controllers/GET/cuenta.controller");
const {
  crearCuentaController,
} = require("../controllers/POST/cuentas.controller");

const {
  eliminarCuentaController,
} = require("../controllers/DELETE/cuentas.controller.js");

const {
  actualizarCuentaController,
} = require("../controllers/PATCH/cuentas.controller.js");

const router = Router();

router.get("/", asureAuth, getCuentasController);
router.get("/stock", asureAuth, cuentasEnStockController);

router.post("/nueva", asureAuth, crearCuentaController);

router.delete("/:id", asureAuth, eliminarCuentaController);

router.patch("/:id", asureAuth, actualizarCuentaController);

module.exports = router;
