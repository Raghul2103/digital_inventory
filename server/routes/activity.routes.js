const express = require('express');
const router = express.Router();
const { getActivityLogs } = require('../controllers/activity.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.get('/', authorize('view_logs'), getActivityLogs);

module.exports = router;
