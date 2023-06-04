const db = require('better-sqlite3')('battlefield.db');
const Match = require("./objects/Match");

const createMatchTable = db.prepare("CREATE TABLE IF NOT EXISTS match (url TEXT, rebel_queue_id TEXT, imperial_queue_id TEXT, dequeue_id TEXT, start_match_id TEXT, match_object JSON, ranked INTEGER DEFAULT 0)");
createMatchTable.run();

const createExportTable = db.prepare("CREATE TABLE IF NOT EXISTS export (id INTEGER PRIMARY KEY, date TEXT, data JSON)");
createExportTable.run();

function openMatch(match) {
    const openMatch = db.prepare("INSERT INTO match VALUES (?, ?, ?, ?, ?, ?, ?)");
    openMatch.run(match.url, match.rebel_queue_id, match.imperial_queue_id, match.dequeue_id, match.start_match_id, JSON.stringify(match), match.ranked ? 1 : 0);
}

function updateMatch(match) {
    const updateMatch = db.prepare("UPDATE match SET match_object=?, ranked=? WHERE url =?");
    updateMatch.run(JSON.stringify(match), match.ranked ? 1 : 0, match.url);
}

function updateURL(match, oldURL) {
    const updateMatch = db.prepare("UPDATE match SET match_object=?, rebel_queue_id=?, imperial_queue_id=?, dequeue_id=?, start_match_id=?, url=?, ranked=? WHERE url =?");
    updateMatch.run(JSON.stringify(match), match.rebel_queue_id, match.imperial_queue_id, match.dequeue_id, match.start_match_id, match.url, match.ranked ? 1 : 0, oldURL);
}

function getMatchByButton(button_id) {
    const getMatch = db.prepare("SELECT match_object FROM match WHERE rebel_queue_id=? OR imperial_queue_id=? OR dequeue_id=? OR start_match_id=?");
    let match = new Match(JSON.parse(getMatch.get(button_id, button_id, button_id, button_id).match_object));
    return match;
}

function addExport(exportObj) {
    const addExport = db.prepare("INSERT INTO export (date, data) VALUES (?, ?)");
    const currentDate = new Date().toISOString().slice(0, 10); // get current date in YYYY-MM-DD format
    addExport.run(currentDate, JSON.stringify(exportObj));
}

function getExportsByWeek(startDate) {
    // calculate end date, which is seven days after the start date
    let endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    // convert dates to YYYY-MM-DD format
    startDate = startDate.toISOString().slice(0, 10);
    endDate = endDate.toISOString().slice(0, 10);

    const getExports = db.prepare("SELECT data FROM export WHERE date BETWEEN ? AND ?");
    const rows = getExports.all(startDate, endDate);
    return rows.map(row => JSON.parse(row.data)); // convert data back into objects
}

function getTopPlayersByStat(exports, faction, stat, limit) {

    const filteredExports = exports.filter((exportObj) => exportObj.players.some((player) => player.faction === faction));

    let players = filteredExports.reduce((acc, exportObj) => {
        const factionPlayers = exportObj.players.filter((player) => player.faction === faction);
        return acc.concat(factionPlayers);
    }, []);

    let playerMap = new Map();
    players.forEach(player => {
        if (playerMap.has(player.name)) {
            // If player already exists in map, sum up the stat
            let existingPlayer = playerMap.get(player.name);
            existingPlayer[stat] += player[stat];
        } else {
            // Add a deep copy of player to the map
            playerMap.set(player.name, JSON.parse(JSON.stringify(player)));
        }
    });

    players = Array.from(playerMap.values());

    players.sort((a, b) => b[stat] - a[stat]);

    return players.slice(0, limit);
}

function getTopPlayersByHeroism(exports, faction, limit) {
    // Filter exports by faction
    const filteredExports = exports.filter((exportObj) => exportObj.players.some((player) => player.faction === faction));

    // Flatten the player list for the specified faction
    let players = filteredExports.reduce((acc, exportObj) => {
        const factionPlayers = exportObj.players.filter((player) => player.faction === faction);
        return acc.concat(factionPlayers);
    }, []);

    // Create a map with player names as keys, and player objects as values
    let playerMap = new Map();
    players.forEach(player => {
        if (playerMap.has(player.name)) {
            // If player already exists in map, sum up the stats
            let existingPlayer = playerMap.get(player.name);
            existingPlayer.kills += player.kills;
            existingPlayer.captures += player.captures;
            existingPlayer.assists += player.assists;
            existingPlayer.damage += player.damage;
            existingPlayer.healing += player.healing;
        } else {
            // Otherwise, add a deep copy of the player to the map
            playerMap.set(player.name, JSON.parse(JSON.stringify(player)));
        }
    });

    // Convert the map values back into an array
    players = Array.from(playerMap.values());

    // Calculate heroism for each player
    players = players.map((player) => ({
        ...player,
        heroism: player.kills + (player.captures * 2) + (player.assists / 3) + (player.damage / 50000) + (player.healing / 50000)
    }));

    // Sort players by heroism in descending order
    players.sort((a, b) => b.heroism - a.heroism);

    // Return the top players with the specified limit
    return players.slice(0, limit);
}

module.exports = { openMatch, updateMatch, getMatchByButton, updateURL, addExport, getExportsByWeek, getTopPlayersByHeroism, getTopPlayersByStat }

