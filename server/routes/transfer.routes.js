const express = require('express');
const router = express.Router();
const {
  createTransfer,
  getTransfers
} = require('../controllers/transfer.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.post('/', authorize('manage_transfers'), createTransfer);
router.get('/', authorize('view_transfers'), getTransfers);

module.exports = router;
