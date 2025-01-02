const Router = require("express");
const { asureAuth } = require("../middlewares/authenticated");

const {
  crearNuevoServicioController,
} = require("../controllers/POST/servicios.controller.js");

const { getServicios } = require("../controllers/GET/servicios.controller.js");

const router = Router();

router.post("/nuevo", asureAuth, crearNuevoServicioController);

router.get("/", asureAuth, getServicios);
module.exports = router;
