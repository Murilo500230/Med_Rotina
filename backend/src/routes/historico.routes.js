const express = require("express");
const autenticar = require("../middlewares/autenticarMedicamentos");
const controller = require("../controllers/historico.controller");

const router = express.Router();

router.use(autenticar);

router.get("/", controller.listar);

module.exports = router;
