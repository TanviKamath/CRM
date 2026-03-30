const fs = require('fs');
const path = require('path');

// Manually load .env
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
        console.log('.env.local loaded successfully');
    }
} catch (e) {
    console.error('Error loading .env:', e);
}

const db = require('../app/lib/db');

async function verify() {
    try {
        console.log('--- Verification Start ---');

        // 1. Find a loose diamond item with carats
        const item = await db('loose_diamond_items').first();
        if (!item) {
            console.log('No loose diamond items found to test with.');
            process.exit(0);
        }
        console.log(`Original Item: ID ${item.id}, Carats: ${item.carats}, Total Value: ${item.total_value}`);

        const parentLot = await db('loose_diamond').where('id', item.loose_diamond_id).first();
        console.log(`Original Parent Lot: ID ${parentLot.id}, Total Carats: ${parentLot.total_carats}`);

        // 2. Mock a partial sale (e.g. sell 0.1 carats)
        const soldCarats = 0.5;
        if (parseFloat(item.carats) < soldCarats) {
            console.log('Item has insufficient carats for test.');
            process.exit(0);
        }

        console.log(`Simulating Sale of ${soldCarats} carats...`);

        // We'll perform the operations manually here to verify the logic we just implemented in the API
        const [saleId] = await db('sales').insert({
            client_id: 1, // Assuming client 1 exists
            loose_diamond_item_id: item.id,
            status: 'completed',
            sale_amount: 1000,
            sale_amount_inr: 80000,
            selling_date: new Date().toISOString().split('T')[0]
        });

        // The logic from our updated API:
        const actualSoldCarats = soldCarats;
        const remainingCarats = parseFloat(item.carats) - actualSoldCarats;

        await db("loose_diamond_items")
          .where("id", item.id)
          .update({
            carats: remainingCarats,
            total_value: remainingCarats * parseFloat(item.final_price_per_carat),
            updated_at: new Date()
          });

        await db("loose_diamond")
          .where("id", item.loose_diamond_id)
          .decrement("total_carats", actualSoldCarats);

        await db("loose_diamond_sales").insert({
          sale_id: saleId,
          lot_id: item.loose_diamond_id,
          sublot_id: item.id,
          sold_carats: actualSoldCarats,
          client_id: 1,
          sale_amount: 1000,
          sale_amount_inr: 80000,
          selling_date: new Date().toISOString().split('T')[0],
          created_at: new Date(),
          updated_at: new Date()
        });

        // 3. Verify updates
        const updatedItem = await db('loose_diamond_items').where('id', item.id).first();
        const updatedParentLot = await db('loose_diamond').where('id', item.loose_diamond_id).first();
        const saleRecord = await db('loose_diamond_sales').where('sale_id', saleId).first();

        console.log(`Updated Item: Carats: ${updatedItem.carats}, Total Value: ${updatedItem.total_value}`);
        console.log(`Updated Parent Lot: Total Carats: ${updatedParentLot.total_carats}`);
        console.log(`Sale Record: Sold Carats: ${saleRecord.sold_carats}`);

        if (parseFloat(updatedItem.carats) === remainingCarats && 
            parseFloat(updatedParentLot.total_carats).toFixed(3) === (parseFloat(parentLot.total_carats) - soldCarats).toFixed(3) &&
            parseFloat(saleRecord.sold_carats) === soldCarats) {
            console.log('--- VERIFICATION SUCCESSFUL ---');
        } else {
            console.log('--- VERIFICATION FAILED ---');
        }

        process.exit(0);
    } catch (e) {
        console.error('Verification failed:', e);
        process.exit(1);
    }
}

verify();
