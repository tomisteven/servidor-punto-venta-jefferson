const Router = require("express");
const { asureAuth } = require("../middlewares/authenticated");

const { crearNuevoServicioController } = require("../controllers/POST/servicios.controller.js");


const router = Router();

/* router.get("/", asureAuth, getServicios);
router.get("/:id", asureAuth, getServicios); */
router.post("/nuevo", asureAuth, crearNuevoServicioController);

module.exports = router;
