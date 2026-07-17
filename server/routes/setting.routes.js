const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/setting.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');

router.use(protect);

router.get('/', getSettings);
router.put('/', authorize('manage_settings'), upload.single('logo'), updateSettings);

module.exports = router;
