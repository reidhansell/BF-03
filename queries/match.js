const { db } = require("../tools/databaseInitializer.js")
const Match = require("../classes/Match");

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
        const getPlayers = db.prepare('SELECT player_discord_id FROM match_player WHERE match_id = ?');
        let players = getPlayers.all(matchId);
        return players.map(player => player.player_discord_id);
    } catch (err) {
        console.error(err);
        return null;
    }
}

function getMatchByButton(button_id) {
    const getMatch = db.prepare("SELECT * FROM match WHERE rebel_queue_button_id=? OR imperial_queue_button_id=? OR dequeue_button_id=?");
    let match = getMatch.get(button_id, button_id, button_id);
    return new Match(match);
}

module.exports = {
    openMatch,
    getMatchByButton,
    addPlayerToMatch,
    removePlayerFromMatch,
    getPlayersByMatch
}