const express = require('express');
const router = express.Router();
const { 
  createCategory, 
  getCategories, 
  getCategoryById, 
  updateCategory, 
  deleteCategory 
} = require('../controllers/category.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.post('/', authorize('manage_categories'), createCategory);
router.get('/', authorize('view_categories', 'view_products'), getCategories);
router.get('/:id', authorize('view_categories'), getCategoryById);
router.put('/:id', authorize('manage_categories'), updateCategory);
router.delete('/:id', authorize('manage_categories'), deleteCategory);

module.exports = router;
