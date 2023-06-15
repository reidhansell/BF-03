const { db } = require("../tools/databaseInitializer.js")

let stmt = db.prepare("ALTER TABLE export ADD COLUMN competitive INTEGER DEFAULT 0");
stmt.run();

stmt = db.prepare("CREATE TABLE IF NOT EXISTS schedule (id INTEGER PRIMARY KEY, match_type TEXT, schedule_time TEXT)");
stmt.run();

console.log("Database updated successfully");
