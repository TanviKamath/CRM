const db = require('../app/lib/db');

async function check() {
    try {
        const columns = await db('diamonds').columnInfo();
        console.log(JSON.stringify(columns, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
