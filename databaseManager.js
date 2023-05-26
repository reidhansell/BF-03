const db = require('better-sqlite3')('battlefield.db');
const Match = require("./objects/Match");

const createMatchTable = db.prepare("CREATE TABLE IF NOT EXISTS match (url TEXT, rebel_queue_id TEXT, imperial_queue_id TEXT, dequeue_id TEXT, start_match_id TEXT, match_object JSON)");
createMatchTable.run();

const createExportTable = db.prepare("CREATE TABLE IF NOT EXISTS export (id INTEGER PRIMARY KEY, date TEXT, data JSON)");
createExportTable.run();

function openMatch(match) {
    const openMatch = db.prepare("INSERT INTO match VALUES (?, ?, ?, ?, ?, ?)");
    openMatch.run(match.url, match.rebel_queue_id, match.imperial_queue_id, match.dequeue_id, match.start_match_id, JSON.stringify(match));
}

function updateMatch(match) {
    const updateMatch = db.prepare("UPDATE match SET match_object=? WHERE url =?");
    updateMatch.run(JSON.stringify(match), match.url);
}

function updateURL(match, oldURL) {
    const updateMatch = db.prepare("UPDATE match SET match_object=?, rebel_queue_id=?, imperial_queue_id=?, dequeue_id=?, start_match_id=?, url=? WHERE url =?");
    updateMatch.run(JSON.stringify(match), match.rebel_queue_id, imperial_queue_id, match.dequeue_id, match.start_match_id, match.url, oldURL);
}

function getMatchByButton(button_id) {
    const getMatch = db.prepare("SELECT match_object FROM match WHERE rebel_queue_id=? OR imperial_queue_id=? OR dequeue_id=? OR start_match_id=?");
    let match = new Match(JSON.parse(getMatch.get(button_id, button_id, button_id, button_id).match_object));
    return match;
}

function addExport(exportObj) {
    const addExport = db.prepare("INSERT INTO export (date, data) VALUES (?, ?)");
    const currentDate = new Date().toISOString().slice(0,10); // get current date in YYYY-MM-DD format
    addExport.run(currentDate, JSON.stringify(exportObj));
}

function getExportsByDate(date) {
    const getExports = db.prepare("SELECT data FROM export WHERE date = ?");
    const rows = getExports.all(date);
    return rows.map(row => JSON.parse(row.data)); // convert data back into objects
}

function getExportsByWeek(startDate) {
    // calculate end date, which is seven days after the start date
    let endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    // convert dates to YYYY-MM-DD format
    startDate = startDate.toISOString().slice(0,10);
    endDate = endDate.toISOString().slice(0,10);

    const getExports = db.prepare("SELECT data FROM export WHERE date BETWEEN ? AND ?");
    const rows = getExports.all(startDate, endDate);
    return rows.map(row => JSON.parse(row.data)); // convert data back into objects
}

module.exports = { openMatch, updateMatch, getMatchByButton, updateURL, addExport, getExportsByDate, getExportsByWeek }

