// Replace this:
// const db = require('better-sqlite3')('battlefields.db');

// With the following wrapper:

const sqlite3 = require('sqlite3');
const deasync = require('deasync');

class SQLiteWrapper {
    constructor(dbFile) {
        this.lastInsertRowid = 0;

        this.db = new sqlite3.Database(dbFile, (err) => {
            if (err) {
                console.error('Error opening database:', err);
            }
        });
    }

    prepare(sql) {
        const self = this;

        return {
            run(...params) {
                let done = false;
                let error = null;

                self.db.run(sql, params, function (err) {
                    if (err) {
                        error = err;
                    } else {
                        self.lastInsertRowid = this.lastID;
                    }
                    done = true;
                });

                deasync.loopWhile(() => !done);

                if (error) {
                    throw error;
                }
            },

            get(...params) {
                let done = false;
                let error = null;
                let row = undefined;

                self.db.get(sql, params, function (err, result) {
                    if (err) {
                        error = err;
                    } else {
                        row = result;
                    }
                    done = true;
                });

                deasync.loopWhile(() => !done);

                if (error) {
                    throw error;
                }

                return row;
            },

            all(...params) {
                let done = false;
                let error = null;
                let rows = [];

                self.db.all(sql, params, function (err, result) {
                    if (err) {
                        error = err;
                    } else {
                        rows = result;
                    }
                    done = true;
                });

                deasync.loopWhile(() => !done);

                if (error) {
                    throw error;
                }

                return rows;
            }
        };
    }

    transaction(fn) {
        const self = this;
        return function (...args) {
            self.prepare('BEGIN').run();
            try {
                const result = fn(...args);
                self.prepare('COMMIT').run();
                return result;
            } catch (err) {
                self.prepare('ROLLBACK').run();
                throw err;
            }
        };
    }
}

const db = new SQLiteWrapper('battlefields.db');

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
        is_removed BOOLEAN DEFAULT FALSE
    );`);
    createMatchTable.run();

    const createMatchPlayerTable = db.prepare(`CREATE TABLE IF NOT EXISTS match_player (
        player_discord_id TEXT,
        match_id INTEGER,
        faction TEXT CHECK(faction IN ('Imperial', 'Rebel')),
        UNIQUE(player_discord_id, match_id),
        FOREIGN KEY(match_id) REFERENCES match(match_id)
    );`);
    createMatchPlayerTable.run();

    const createBattlefieldTable = db.prepare(`CREATE TABLE IF NOT EXISTS battlefield (
        battlefield_id INTEGER PRIMARY KEY AUTOINCREMENT,
        time INTEGER,
        location TEXT DEFAULT NULL
    );`);
    createBattlefieldTable.run();

    const createBattlefieldPlayerTable = db.prepare(`CREATE TABLE IF NOT EXISTS battlefield_player (
        player_name TEXT,
        faction TEXT CHECK(faction IN ('Imperial', 'Rebel', 'Red', 'Blue')),
        kills INTEGER,
        healing INTEGER,
        damage INTEGER,
        captures INTEGER,
        assists INTEGER,
        battlefield_id INTEGER,
        FOREIGN KEY(battlefield_id) REFERENCES battlefield(battlefield_id),
        PRIMARY KEY(player_name, battlefield_id)
    );`);
    createBattlefieldPlayerTable.run();

    console.log("Database initialized");
}

module.exports = { initDB, db };
