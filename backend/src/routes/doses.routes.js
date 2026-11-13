const express = require("express");
const autenticar = require("../middlewares/autenticarMedicamentos");
const controller = require("../controllers/doses.controller");

const router = express.Router();

router.use(autenticar);

router.post("/gerar", controller.gerar);
router.get("/hoje", controller.listarHoje);
router.patch("/:id/tomar", controller.tomar);

module.exports = router;
