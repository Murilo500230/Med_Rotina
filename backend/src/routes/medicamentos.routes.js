const express = require('express');
const autenticar = require('../middlewares/autenticarMedicamentos');
const controller = require('../controllers/medicamentos.controller');

const router = express.Router();
router.use(autenticar);
router.post('/', controller.criar);
router.get('/', controller.listar);
router.get('/:id', controller.buscar);
router.put('/:id', controller.atualizar);
router.delete('/:id', controller.excluir);
module.exports = router;
