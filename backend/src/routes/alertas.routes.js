const express = require("express");
const autenticar = require("../middlewares/autenticarMedicamentos");
const controller = require("../controllers/alertas.controller");

const router = express.Router();

router.use(autenticar);

router.post("/verificar", controller.verificar);
router.get("/", controller.listarHistorico);

module.exports = router;
