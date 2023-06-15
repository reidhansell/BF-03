const { db } = require("../tools/databaseInitializer.js")

function addScheduledMatch(match_type, schedule_time) {
    const addScheduledMatch = db.prepare("INSERT INTO schedule (match_type, schedule_time) VALUES (?, ?)");
    addScheduledMatch.run(match_type, schedule_time);
}

function getScheduledMatches() {
    const getScheduledMatches = db.prepare("SELECT * FROM schedule");
    return getScheduledMatches.all().map(row => ({
        id: row.id,
        match_type: row.match_type,
        schedule_time: new Date(row.schedule_time),
    }));
}

function updateMatchSchedule(id) {
    const schedule_time = new Date();
    schedule_time.setDate(schedule_time.getDate() + 7);
    const updateMatchSchedule = db.prepare("UPDATE schedule SET schedule_time = ? WHERE id = ?");
    updateMatchSchedule.run(schedule_time.toISOString(), id);
}

function deleteScheduledMatch(id) {
    const deleteScheduledMatch = db.prepare("DELETE FROM schedule WHERE id = ?");
    deleteScheduledMatch.run(id);
}

module.exports = {
    addScheduledMatch,
    getScheduledMatches,
    updateMatchSchedule,
    deleteScheduledMatch
}