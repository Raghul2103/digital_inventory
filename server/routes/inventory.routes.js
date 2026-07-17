const express = require('express');
const router = express.Router();
const { getInventory } = require('../controllers/inventory.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.get('/', authorize('view_products'), getInventory);

module.exports = router;
