const Router = require("express");
const { asureAuth } = require("../middlewares/authenticated");
const {
  getModelosCompletos,
  getServiciosConId,
  clientesConId,
  getBancosConId,
  getInventarioCompletoConServicio,
  checkStatusApi
} = require("../controllers/GET/api.controller.js");
const router = Router();

router.get("/", asureAuth, getModelosCompletos);
router.get("/servicios", asureAuth, getServiciosConId);
router.get("/clientes", asureAuth, clientesConId);
router.get("/bancos", asureAuth, getBancosConId);
router.get("/inventario", asureAuth, getInventarioCompletoConServicio);
router.get("/status/api", asureAuth, checkStatusApi)

module.exports = router;
