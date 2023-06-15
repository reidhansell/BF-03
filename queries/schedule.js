const { db } = require("../tools/databaseInitializer.js")

function addScheduledMatch(isCompetitive, scheduleTime, initiatorDiscordId, guild_id) {
    const addScheduledMatch = db.prepare("INSERT INTO match_schedule (competitive, schedule_time, initiator_discord_id, guild_id) VALUES (?, ?, ?, ?)");
    addScheduledMatch.run(isCompetitive, scheduleTime, initiatorDiscordId, guild_id);
}

function getScheduledMatches() {
    const getScheduledMatches = db.prepare("SELECT * FROM match_schedule");
    return getScheduledMatches.all().map(row => ({
        schedule_id: row.schedule_id,
        competitive: row.competitive,
        schedule_time: row.schedule_time,
        initiator_discord_id: row.initiator_discord_id,
        guild_id: row.guild_id
    }));
}

function updateMatchSchedule(match) {
    match.schedule_time = (Number(match.schedule_time) + Math.floor(7 * 24 * 60 * 60)).toString();
    const updateMatchSchedule = db.prepare("UPDATE match_schedule SET schedule_time = ? WHERE schedule_id = ?");
    updateMatchSchedule.run(match.schedule_time, match.schedule_id);
    return match;
}


function deleteScheduledMatch(id) {
    const deleteScheduledMatch = db.prepare("DELETE FROM match_schedule WHERE schedule_id = ?");
    deleteScheduledMatch.run(id);
}

module.exports = {
    addScheduledMatch,
    getScheduledMatches,
    updateMatchSchedule,
    deleteScheduledMatch
}