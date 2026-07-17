const { z } = require('zod');

const warehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required'),
  location: z.string().min(1, 'Location is required'),
  capacity: z.preprocess((val) => Number(val), z.number().min(1, 'Capacity must be at least 1 unit').default(10000)),
  status: z.enum(['Active', 'Inactive']).default('Active')
});

const binSchema = z.object({
  name: z.string().min(1, 'Bin name is required'),
  warehouse: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID'),
  capacity: z.preprocess((val) => Number(val), z.number().min(1, 'Capacity must be at least 1 unit').default(1000)),
  status: z.enum(['Active', 'Inactive']).default('Active')
});

module.exports = {
  warehouseSchema,
  binSchema
};
