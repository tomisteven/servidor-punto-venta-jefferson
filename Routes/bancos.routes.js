const Router = require("express");
const { asureAuth } = require("../middlewares/authenticated");
const {
  crearNuevoBancoController,
} = require("../controllers/POST/banco.controller");
const { getBancos, getBanco } = require("../controllers/GET/banco.controller");

const {
  actualizarBancoController,
} = require("../controllers/PATCH/banco.controller.js");
const {
  eliminarBancoController,
} = require("../controllers/DELETE/banco.controller.js");
const router = Router();

router.get("/", asureAuth, getBancos);
router.get("/:id", asureAuth, getBanco);

router.post("/nuevo", asureAuth, crearNuevoBancoController);

router.patch("/:id", asureAuth, actualizarBancoController);
router.delete("/:id", asureAuth, eliminarBancoController);

module.exports = router;
