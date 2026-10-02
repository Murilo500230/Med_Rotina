const express = require("express");

const { login, perfil, register } = require("../controllers/authController");
const autenticar = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", autenticar, perfil);

module.exports = router;
