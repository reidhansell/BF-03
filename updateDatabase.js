const db = require('better-sqlite3')('battlefield.db');

// Add new "ranked" column with default value as 0
let stmt = db.prepare("ALTER TABLE match ADD COLUMN ranked INTEGER DEFAULT 0");
stmt.run();

console.log("Database updated successfully");