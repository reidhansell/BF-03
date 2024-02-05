const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { removePlayerFromMatch, getPlayersByMatch, addPlayerToMatch } = require("../queries/match.js")
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
        this.matchPlayers = getPlayersByMatch(match.match_id)
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
        if ((faction === 'Rebel' && this.matchPlayers.filter(p => p.faction === 'Rebel').length < 16)
            || (faction === 'Imperial' && this.matchPlayers.filter(p => p.faction === 'Imperial').length < 16)) {
            this.matchPlayers.push(new MatchPlayer(player_discord_id, faction));
            const result = addPlayerToMatch(player_discord_id, this.match_id, faction);
            if (result) {
                return "Added to queue.";
            } else {
                return "Error adding to queue"
            }
        }
        return "Queue full.";
    }

    dequeuePlayer(player_discord_id) {
        const playerIndex = this.matchPlayers.findIndex(p => p.player_discord_id === player_discord_id);
        if (playerIndex !== -1) {
            this.matchPlayers.splice(playerIndex, 1);
            removePlayerFromMatch(player_discord_id, this.match_id);
            return "Player removed from queue."
        }
        return "Player not in queue.";
    }

    isEmpty() {
        return this.matchPlayers.length === 0;
    }

    toString() {
        console.log(this.matchPlayers);
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

        for (let i = 0; i < 16; i++) {
            matchContent += `${playerLine(rebels[i])} --- ${playerLine(imperials[i])}\n`;
            if(i === 8){
                matchContent += "-------------------\n";
            }
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