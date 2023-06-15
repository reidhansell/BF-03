const { db } = require("../tools/databaseInitializer.js")
const MatchPlayer = require("../classes/MatchPlayer.js")

function openMatch(match) {
    const openMatch = db.prepare(`INSERT INTO match (
        guild_id, 
        channel_id, 
        message_id, 
        url, 
        initiator_discord_id, 
        time, 
        rebel_queue_button_id, 
        imperial_queue_button_id, 
        dequeue_button_id, 
        is_competitive) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    openMatch.run(
        match.guild_id,
        match.channel_id,
        match.message_id,
        match.url,
        match.initiator_discord_id,
        match.time,
        match.rebel_queue_button_id,
        match.imperial_queue_button_id,
        match.dequeue_button_id,
        match.is_competitive
    );

    const newMatchId = db.lastInsertRowid;

    return newMatchId;
}

function addPlayerToMatch(playerDiscordId, matchId, faction) {
    console.log(playerDiscordId);
    console.log(matchId);
    console.log(faction);
    try {
        const addPlayerToMatch = db.prepare('INSERT OR IGNORE INTO match_player (player_discord_id, match_id, faction) VALUES (?, ?, ?)');
        addPlayerToMatch.run(playerDiscordId, matchId, faction);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

function removePlayerFromMatch(playerDiscordId, matchId) {
    try {
        const removePlayerFromMatch = db.prepare('DELETE FROM match_player WHERE player_discord_id = ? AND match_id = ?');
        removePlayerFromMatch.run(playerDiscordId, matchId);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

function getPlayersByMatch(matchId) {
    try {
        const getPlayers = db.prepare('SELECT * FROM match_player WHERE match_id = ?');
        let players = getPlayers.all(matchId);
        return players.map(player => new MatchPlayer(player.player_discord_id, player.faction));
    } catch (err) {
        console.error(err);
        return null;
    }
}

function getMatchByButton(button_id) {
    const getMatch = db.prepare("SELECT * FROM match WHERE rebel_queue_button_id=? OR imperial_queue_button_id=? OR dequeue_button_id=?");
    let match = getMatch.get(button_id, button_id, button_id);
    return match;
}

function getExpiredMatches() {
    const getPastMatches = db.prepare(`
        SELECT * FROM match 
        WHERE (strftime('%s', 'now') - time) > 3600 AND is_removed = 0
    `);
    let matches = getPastMatches.all();
    return matches;
}

function setRemovedStatus(matchId) {
    try {
        const setRemoved = db.prepare('UPDATE match SET is_removed = 1 WHERE match_id = ?');
        setRemoved.run(matchId);
    } catch (err) {
        console.error("Failed to set is_removed status:", err);
    }
}

module.exports = {
    openMatch,
    getMatchByButton,
    addPlayerToMatch,
    removePlayerFromMatch,
    getPlayersByMatch,
    getExpiredMatches,
    setRemovedStatus
}