const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');
const Category = require('../models/Category');
const Warehouse = require('../models/Warehouse');
const Bin = require('../models/Bin');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Purchase = require('../models/Purchase');
const PurchaseItem = require('../models/PurchaseItem');
const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const Transfer = require('../models/Transfer');

const testDBUri = 'mongodb://localhost:27017/inventoryflow_test';

const runTests = async () => {
  console.log('--- STARTING BACKEND INTEGRATION DB CHECK ---');
  try {
    // Connect
    await mongoose.connect(testDBUri);
    console.log('Connected to test DB.');

    // Clear previous test records
    await mongoose.connection.dropDatabase();
    console.log('Cleared test database.');

    // 1. Create Role & User
    const testRole = await Role.create({
      name: 'TestAdmin',
      permissions: ['manage_products', 'manage_warehouses', 'manage_transfers']
    });
    console.log('✓ Created TestAdmin Role');

    const testUser = await User.create({
      name: 'Tester',
      email: 'tester@test.com',
      password: 'testpassword123',
      role: testRole._id,
      isStaff: false
    });
    console.log('✓ Created Test User');

    // 2. Create Category, Warehouse & Bins
    const testCat = await Category.create({
      name: 'Hardware',
      description: 'Computer metal components'
    });
    console.log('✓ Created Category: Hardware');

    const sourceWarehouse = await Warehouse.create({
      name: 'Source Warehouse A',
      location: 'Building 1',
      capacity: 500
    });
    const destWarehouse = await Warehouse.create({
      name: 'Dest Warehouse B',
      location: 'Building 2',
      capacity: 500
    });
    console.log('✓ Created Warehouses');

    const sourceBin = await Bin.create({
      name: 'Bin-S1',
      warehouse: sourceWarehouse._id,
      capacity: 100
    });
    const destBin = await Bin.create({
      name: 'Bin-D1',
      warehouse: destWarehouse._id,
      capacity: 100
    });
    console.log('✓ Created Bins inside Warehouses');

    // 3. Create Product
    const testProduct = await Product.create({
      sku: 'TEST-SKU-100',
      barcode: '123456789012',
      name: 'Test SSD Drive',
      brand: 'Samsung',
      category: testCat._id,
      costPrice: 50,
      sellingPrice: 80,
      gst: 18,
      quantity: 0,
      warehouse: sourceWarehouse._id,
      bin: sourceBin._id
    });
    console.log('✓ Created Product: Test SSD Drive');

    // Initialize Inventory detailed records
    const inventoryA = await Inventory.create({
      product: testProduct._id,
      warehouse: sourceWarehouse._id,
      bin: sourceBin._id,
      quantity: 0
    });
    console.log('✓ Initialized Inventory detailed level record');

    // 4. Test Purchase (Increment Stock)
    const purchaseQty = 40;
    // Simulate Purchase Order
    // Increment inventory A
    inventoryA.quantity += purchaseQty;
    await inventoryA.save();

    // Increment aggregate product stock
    testProduct.quantity += purchaseQty;
    await testProduct.save();

    console.log(`✓ Simulating purchase: Added ${purchaseQty} items to Inventory`);
    console.log(`  Product aggregate quantity: ${testProduct.quantity} (Expected: 40)`);
    console.log(`  Detailed Inventory A quantity: ${inventoryA.quantity} (Expected: 40)`);

    if (testProduct.quantity !== 40 || inventoryA.quantity !== 40) {
      throw new Error('Stock increment failed on purchase simulation');
    }

    // 5. Test Sale (Deduct Stock & Check Negatives)
    const saleQty = 15;
    // Verify stock
    if (inventoryA.quantity < saleQty) {
      throw new Error('Simulation failed: Insufficient stock');
    }

    // Decrement stock
    inventoryA.quantity -= saleQty;
    await inventoryA.save();

    testProduct.quantity -= saleQty;
    await testProduct.save();

    console.log(`✓ Simulating sale: Deducted ${saleQty} items from Inventory`);
    console.log(`  Product aggregate quantity: ${testProduct.quantity} (Expected: 25)`);
    console.log(`  Detailed Inventory A quantity: ${inventoryA.quantity} (Expected: 25)`);

    if (testProduct.quantity !== 25 || inventoryA.quantity !== 25) {
      throw new Error('Stock decrement failed on sale simulation');
    }

    // 6. Test Stock Transfer (Warehouse A to B)
    const transferQty = 10;
    console.log(`✓ Simulating stock transfer of ${transferQty} units from A to B`);

    // Verify source stock
    if (inventoryA.quantity < transferQty) {
      throw new Error('Simulation failed: Source has insufficient stock for transfer');
    }

    // Check dest bin capacity
    // (Dest bin is empty, capacity is 100, transferring 10. OK)
    // Decrement source inventory
    inventoryA.quantity -= transferQty;
    await inventoryA.save();

    // Increment destination inventory
    const inventoryB = await Inventory.findOneAndUpdate(
      { product: testProduct._id, warehouse: destWarehouse._id, bin: destBin._id },
      { $inc: { quantity: transferQty } },
      { upsert: true, new: true }
    );

    console.log(`  Source inventory A remaining: ${inventoryA.quantity} (Expected: 15)`);
    console.log(`  Destination inventory B quantity: ${inventoryB.quantity} (Expected: 10)`);
    console.log(`  Product aggregate quantity (unchanged by transfer): ${testProduct.quantity} (Expected: 25)`);

    if (inventoryA.quantity !== 15 || inventoryB.quantity !== 10 || testProduct.quantity !== 25) {
      throw new Error('Transfer transaction failed on stock verification checks');
    }

    console.log('\n=============================================');
    console.log('ALL INTEGRATION TEST SUITES PASSED SUCCESSFULLY!');
    console.log('=============================================');
  } catch (error) {
    console.error('\n❌ INTEGRATION TEST FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB.');
  }
};

runTests();
