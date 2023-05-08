const db = require('better-sqlite3')('battlefield.db');
const Match = require("./objects/Match");

const createMatchTable = db.prepare("CREATE TABLE IF NOT EXISTS match (url TEXT, queue_id TEXT, dequeue_id TEXT, start_match_id TEXT, match_object JSON)");
createMatchTable.run();

function openMatch(match) {
    const openMatch = db.prepare("INSERT INTO match VALUES (?, ?, ?, ?, ?)");
    openMatch.run(match.url, match.queue_id, match.dequeue_id, match.start_match_id, JSON.stringify(match));
}

function updateMatch(match) {
    const updateMatch = db.prepare("UPDATE match SET match_object=? WHERE url =?");
    updateMatch.run(JSON.stringify(match), match.url);
}

function updateURL(match, oldURL) {
    const updateMatch = db.prepare("UPDATE match SET match_object=?, queue_id=?, dequeue_id=?, start_match_id=?, url=? WHERE url =?");
    updateMatch.run(JSON.stringify(match), match.queue_id, match.dequeue_id, match.start_match_id, match.url, oldURL);
}

function getMatchByButton(button_id) {
    const getMatch = db.prepare("SELECT match_object FROM match WHERE queue_id=? OR dequeue_id=? OR start_match_id=?");
    let match = new Match(JSON.parse(getMatch.get(button_id, button_id, button_id).match_object));
    return match;
}

module.exports = { openMatch, updateMatch, getMatchByButton, updateURL }

