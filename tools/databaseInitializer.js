const db = require('better-sqlite3')('battlefields.db');

function initDB() {
    const createMatchTable = db.prepare(`CREATE TABLE IF NOT EXISTS match (
        match_id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        channel_id TEXT,
        message_id TEXT,
        url TEXT,
        initiator_discord_id TEXT,
        time INTEGER,
        rebel_queue_button_id TEXT,
        imperial_queue_button_id TEXT,
        dequeue_button_id TEXT,
        is_competitive BOOLEAN,
        is_removed BOOLEAN DEFAULT FALSE
        );`
    );
    createMatchTable.run();

    const createMatchPlayerTable = db.prepare(`CREATE TABLE IF NOT EXISTS match_player (
            player_discord_id TEXT,
            match_id INTEGER,
            faction TEXT CHECK(faction IN ('Imperial', 'Rebel')),
            UNIQUE(player_discord_id, match_id),
            FOREIGN KEY(match_id) REFERENCES match(match_id)
        );
    `);
    createMatchPlayerTable.run();

    const createBattlefieldTable = db.prepare(`CREATE TABLE IF NOT EXISTS battlefield (
        battlefield_id INTEGER PRIMARY KEY AUTOINCREMENT,
        time INTEGER,
        location TEXT DEFAULT NULL,
        competitive INTEGER DEFAULT 0
        );`
    );
    createBattlefieldTable.run();

    const createBattlefieldPlayerTable = db.prepare(`CREATE TABLE IF NOT EXISTS battlefield_player (
        player_name TEXT,
        faction TEXT CHECK(faction IN ('Imperial', 'Rebel')),
        kills INTEGER,
        healing INTEGER,
        damage INTEGER,
        captures INTEGER,
        assists INTEGER,
        battlefield_id INTEGER,
        FOREIGN KEY(battlefield_id) REFERENCES battlefield(battlefield_id),
        PRIMARY KEY(player_name, battlefield_id)
        );`
    );
    createBattlefieldPlayerTable.run();

    const createScheduleTable = db.prepare(`CREATE TABLE IF NOT EXISTS match_schedule (
        id INTEGER PRIMARY KEY, 
        competitive INTEGER, 
        schedule_time TEXT, 
        initiator_discord_id TEXT
        );`
    );
    createScheduleTable.run();

    console.log("Database initialized");
}

module.exports = { initDB, db };
