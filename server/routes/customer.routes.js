const express = require('express');
const router = express.Router();
const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customer.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.post('/', authorize('manage_customers'), createCustomer);
router.get('/', authorize('view_customers'), getCustomers);
router.get('/:id', authorize('view_customers'), getCustomerById);
router.put('/:id', authorize('manage_customers'), updateCustomer);
router.delete('/:id', authorize('manage_customers'), deleteCustomer);

module.exports = router;
