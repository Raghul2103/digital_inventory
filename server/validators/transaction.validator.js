const { z } = require('zod');

const purchaseItemSchema = z.object({
  product: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  quantity: z.preprocess((val) => Number(val), z.number().min(1, 'Quantity must be at least 1')),
  costPrice: z.preprocess((val) => Number(val), z.number().min(0, 'Cost price cannot be negative')),
  gst: z.preprocess((val) => Number(val), z.number().min(0, 'GST cannot be negative').default(18))
});

const purchaseSchema = z.object({
  supplier: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid supplier ID'),
  items: z.array(purchaseItemSchema).min(1, 'Purchase must have at least 1 item'),
  notes: z.string().optional().default(''),
  paymentStatus: z.enum(['Paid', 'Unpaid', 'Partial']).default('Paid')
});

const saleItemSchema = z.object({
  product: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  quantity: z.preprocess((val) => Number(val), z.number().min(1, 'Quantity must be at least 1')),
  sellingPrice: z.preprocess((val) => Number(val), z.number().min(0, 'Selling price cannot be negative')),
  gst: z.preprocess((val) => Number(val), z.number().min(0, 'GST cannot be negative').default(18))
});

const saleSchema = z.object({
  customer: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid customer ID'),
  items: z.array(saleItemSchema).min(1, 'Sale must have at least 1 item'),
  notes: z.string().optional().default(''),
  paymentStatus: z.enum(['Paid', 'Unpaid', 'Partial']).default('Paid')
});

const transferSchema = z.object({
  product: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  sourceWarehouse: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID'),
  sourceBin: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid bin ID'),
  destWarehouse: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID'),
  destBin: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid bin ID'),
  quantity: z.preprocess((val) => Number(val), z.number().min(1, 'Quantity must be at least 1')),
  notes: z.string().optional().default('')
});

module.exports = {
  purchaseSchema,
  saleSchema,
  transferSchema
};
