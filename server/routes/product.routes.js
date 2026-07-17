const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductByBarcode,
  importCSV,
  exportCSV
} = require('../controllers/product.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');

router.use(protect);

router.post('/', authorize('manage_products'), upload.single('image'), createProduct);
router.get('/', authorize('view_products'), getProducts);
router.get('/export', authorize('manage_products'), exportCSV);
router.post('/import', authorize('manage_products'), upload.single('file'), importCSV);
router.get('/barcode/:barcode', authorize('view_products'), getProductByBarcode);
router.get('/:id', authorize('view_products'), getProductById);
router.put('/:id', authorize('manage_products'), upload.single('image'), updateProduct);
router.delete('/:id', authorize('manage_products'), deleteProduct);

module.exports = router;
