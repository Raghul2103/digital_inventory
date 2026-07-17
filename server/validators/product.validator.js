const { z } = require('zod');

const productSchema = z.object({
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  barcode: z.string().min(3, 'Barcode must be at least 3 characters'),
  name: z.string().min(1, 'Product name is required'),
  brand: z.string().min(1, 'Brand is required'),
  category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
  costPrice: z.preprocess((val) => Number(val), z.number().min(0, 'Cost price cannot be negative')),
  sellingPrice: z.preprocess((val) => Number(val), z.number().min(0, 'Selling price cannot be negative')),
  gst: z.preprocess((val) => Number(val), z.number().min(0, 'GST percentage cannot be negative').default(18)),
  reorderLevel: z.preprocess((val) => Number(val), z.number().min(0, 'Reorder level cannot be negative').default(10)),
  warehouse: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID').optional().nullable(),
  bin: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid bin ID').optional().nullable(),
  status: z.enum(['Active', 'Inactive', 'Draft']).default('Active')
});

module.exports = {
  productSchema
};
