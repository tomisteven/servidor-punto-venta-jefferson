const Router = require("express");
const { asureAuth } = require("../middlewares/authenticated");

const {
  crearNuevoServicioController,
} = require("../controllers/POST/servicios.controller.js");

const {actualizarServicioController} = require("../controllers/PATCH/servicios.controller.js");

const { getServicios, getServiciosParticulares,  getServiciosCombos } = require("../controllers/GET/servicios.controller.js");

const router = Router();

router.patch("/:id", asureAuth, actualizarServicioController);
router.post("/nuevo", asureAuth, crearNuevoServicioController);
router.get("/particulares", asureAuth, getServiciosParticulares);
router.get("/", asureAuth, getServicios)
router.get("/combos", asureAuth, getServiciosCombos);

module.exports = router;
