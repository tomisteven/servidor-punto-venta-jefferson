const Router = require("express");
const { asureAuth } = require("../middlewares/authenticated");

const router = Router();

const {
  getComprasController,
  getComprasPorDiaController,
  getComprasPorServicioController,
  getCompraController,
  getComprasPorFechaController,
  getCompraComboController
} = require("../controllers/GET/compras.controller.js");

const {
  eliminarCompraController,
} = require("../controllers/DELETE/compra.controller.js");

router.get("/", asureAuth, getComprasController);
router.get("/combo/:id", asureAuth, getCompraComboController);

router.get("/day", asureAuth, getComprasPorDiaController);
router.get("/day/:fecha", asureAuth, getComprasPorFechaController);

router.get("/servicio/:servicio", asureAuth, getComprasPorServicioController);

router.get("/:id", asureAuth, getCompraController);

router.delete("/:id", asureAuth, eliminarCompraController);

module.exports = router;
