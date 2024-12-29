const Router = require("express");
const { asureAuth } = require("../middlewares/authenticated");

const router = Router();

const {
  getComprasController,
  getComprasPorDiaController,
  getComprasPorServicioController,
  getCompraController,
} = require("../controllers/GET/compras.controller.js");

const {
  eliminarCompraController,
} = require("../controllers/DELETE/compra.controller.js");

router.get("/", asureAuth, getComprasController);

router.get("/day", asureAuth, getComprasPorDiaController);

router.get("/servicio/:servicio", asureAuth, getComprasPorServicioController);

router.get("/:id", asureAuth, getCompraController);

router.delete("/:id", asureAuth, eliminarCompraController);

module.exports = router;
