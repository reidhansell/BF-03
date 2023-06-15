const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require("../tools/databaseInitializer.js")
const MatchPlayer = require('./MatchPlayer');

class Match {
    matchPlayers = [];

    constructor(match) {
        this.match_id = match.match_id;
        this.guild_id = match.guild_id;
        this.channel_id = match.channel_id;
        this.message_id = match.message_id;
        this.url = match.url;
        this.initiator_discord_id = match.initiator_discord_id;
        this.time = match.time;
        this.rebel_queue_button_id = match.rebel_queue_button_id;
        this.imperial_queue_button_id = match.imperial_queue_button_id;
        this.dequeue_button_id = match.dequeue_button_id;
        this.is_competitive = match.is_competitive;
        const getPlayers = db.prepare("SELECT * FROM match_player WHERE match_id = ?");
        const rows = getPlayers.all(this.match_id);
        this.matchPlayers = rows.map(row => new MatchPlayer(row.player_discord_id, row.faction));
    }


    getStatus() {
        const imps = this.matchPlayers.filter(p => p.faction === 'Imperial').length;
        const rebs = this.matchPlayers.filter(p => p.faction === 'Rebel').length;
        if ((rebs > 3) && (imps > 3)) {
            return "READY";
        }
        if (rebs > 3) {
            return "NEED IMPERIALS";
        }
        if (imps > 3) {
            return "NEED REBELS";
        }
        return "NEED REBELS AND IMPERIALS"
    }

    queuePlayer(player_discord_id, faction) {
        if (this.matchPlayers.some(p => p.player_discord_id === player_discord_id)) {
            return "Already in queue.";
        }
        if ((faction === 'Rebel' && this.matchPlayers.filter(p => p.faction === 'Rebel').length < 8)
            || (faction === 'Imperial' && this.matchPlayers.filter(p => p.faction === 'Imperial').length < 8)) {
            this.matchPlayers.push(new MatchPlayer(player_discord_id, faction));
            const addPlayer = db.prepare("INSERT INTO match_player (match_id, player_discord_id, faction) VALUES (?, ?, ?)");
            addPlayer.run(this.match_id, player_discord_id, faction);
            return "Added to queue.";
        }
        return "Queue full.";
    }

    dequeuePlayer(player_discord_id) {
        const playerIndex = this.matchPlayers.findIndex(p => p.player_discord_id === player_discord_id);
        if (playerIndex !== -1) {
            this.matchPlayers.splice(playerIndex, 1);
            const removePlayer = db.prepare("DELETE FROM match_player WHERE match_id = ? AND player_discord_id = ?");
            removePlayer.run(this.match_id, player_discord_id);
            return "Player removed from queue."
        }
        return "Player not in queue.";
    }

    isEmpty() {
        return this.matchPlayers.length === 0;
    }

    toString() {
        const rebels = this.matchPlayers.filter(player => player.faction === 'Rebel');
        const imperials = this.matchPlayers.filter(player => player.faction === 'Imperial');
        const playerLine = (player) => (player ? `<@${player.player_discord_id}>` : 'EMPTY');

        let matchContent = `**${this.is_competitive === 1 ? "COMPETITIVE" : "CASUAL"} BATTLEFIELD MATCHMAKING**\n`
            + (this.is_competitive === 1 ? "*Competitive requirements: <#1106719576508608523>*\n" : "")
            + (this.is_competitive === 1 ? `Captain: <@${this.initiator_discord_id}>\n` : "")
            + `Status: ${this.getStatus()}\n`
            + `Time: <t:${this.time}:f>\n`
            + "-------------------\n"
            + "Rebels    ---    Imperials:\n";

        for (let i = 0; i < 8; i++) {
            matchContent += `${playerLine(rebels[i])} --- ${playerLine(imperials[i])}\n`;
        }

        return matchContent;
    }

    toButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(this.rebel_queue_button_id)
                    .setLabel("Queue Rebel")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(this.imperial_queue_button_id)
                    .setLabel("Queue Imperial")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(this.dequeue_button_id)
                    .setLabel('Dequeue')
                    .setStyle(ButtonStyle.Danger)
            );
    }
}

module.exports = Match;