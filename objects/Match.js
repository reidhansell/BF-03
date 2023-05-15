const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
class Match {
    // 0-7 = Rebel, 8-15 = Imperial
    url = "";
    channel_id = "";
    guild_id = "";
    message_id = "";
    initiator_id = "";
    player_ids = [];
    time = "";
    location = "";
    rebel_queue_id = "";
    imperial_queue_id = "";
    dequeue_id = "";
    start_match_id = "";
    started = false;
    custom_time = false;

    constructor(match) {
        this.url = match.url;
        this.channel_id = match.channel_id;
        this.guild_id = match.guild_id;
        this.message_id = match.message_id;
        this.initiator_id = match.initiator_id;
        this.player_ids = match.player_ids;
        this.time = match.time;
        this.location = match.location;
        this.rebel_queue_id = match.rebel_queue_id;
        this.imperial_queue_id = match.imperial_queue_id;
        this.dequeue_id = match.dequeue_id;
        this.start_match_id = match.start_match_id;
        this.started = match.started;
        this.custom_time = match.custom_time;
    }

    setTime(time) {
        this.time = time;
    }

    setLocation(location) {
        this.location = location;
    }

    changeMessageLocations(url, channel_id, guild_id, message_id) {
        this.url = url;
        this.channel_id = channel_id;
        this.guild_id = guild_id;
        this.message_id = message_id;
    }

    getStatus() {
        if (this.started) {
            return "STARTED"
        }
        let imps = 0;
        let rebs = 0;
        for (let i = 0; i < 16; i++) {
            if ((i < 8) && (this.player_ids[i] != "")) {
                rebs++;
            }
            if ((i >= 8) && (this.player_ids[i] != "")) {
                imps++;
            }
        }
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

    queuePlayer(player_id, faction) {
        for (let i = 0; i < 16; i++) {
            if (this.player_ids[i] === player_id) {
                return "Already in queue.";
            }
        }
        for (let i = 0; i < 16; i++) {
            if ((faction === "Rebel") && (this.player_ids[i] === "") && (i < 8)) {
                this.player_ids[i] = player_id;
                return "Added to queue.";
            }
            if ((faction === "Imperial") && (this.player_ids[i] === "") && (i >= 8)) {
                this.player_ids[i] = player_id;
                return "Added to queue.";
            }
        }
        return "Queue full.";
    }

    dequeuePlayer(player_id) {
        let found = -1;
        for (let i = 0; i < 16; i++) {
            if (found != -1) {
                if (found != -1 && i === 8) {
                    // Don't move the Imperial queue
                    break;
                }
                this.player_ids[i - 1] = this.player_ids[i];
                this.player_ids[i] = "";
            }
            if (this.player_ids[i] === player_id) {
                found = i;
                this.player_ids[i] = "";
            }
        }
        if (found != -1) {
            return "Player removed from queue."
        }
        return "Player not in queue.";
    }

    start() {
        this.started = true;
    }

    isEmpty() {
        for (let i = 0; i < 16; i++) {
            if (this.player_ids[i] != "") {
                return false;
            }
        }
        return true;
    }

    toString() {
        const contractContent = "**BATTLEFIELD MATCHMAKING**\n"
            + "Status: " + this.getStatus() + "\n"
            + (this.custom_time ? ("Time: " + this.time) : ("Time: <t:" + this.time + ":T>")) + "\n"
            + "Location: " + this.location + "\n"
            + "-------------------\n"
            + "Rebels    ---    Imperials:\n"
            + (this.player_ids[0] === "" ? "EMPTY" : ("<@" + this.player_ids[0] + ">")) + " --- " + (this.player_ids[8] === "" ? "EMPTY\n" : ("<@" + this.player_ids[8] + ">\n"))
            + (this.player_ids[1] === "" ? "EMPTY" : ("<@" + this.player_ids[1] + ">")) + " --- " + (this.player_ids[9] === "" ? "EMPTY\n" : ("<@" + this.player_ids[9] + ">\n"))
            + (this.player_ids[2] === "" ? "EMPTY" : ("<@" + this.player_ids[2] + ">")) + " --- " + (this.player_ids[10] === "" ? "EMPTY\n" : ("<@" + this.player_ids[10] + ">\n"))
            + (this.player_ids[3] === "" ? "EMPTY" : ("<@" + this.player_ids[3] + ">")) + " --- " + (this.player_ids[11] === "" ? "EMPTY\n" : ("<@" + this.player_ids[11] + ">\n"))
            + (this.player_ids[4] === "" ? "EMPTY" : ("<@" + this.player_ids[4] + ">")) + " --- " + (this.player_ids[12] === "" ? "EMPTY\n" : ("<@" + this.player_ids[12] + ">\n"))
            + (this.player_ids[5] === "" ? "EMPTY" : ("<@" + this.player_ids[5] + ">")) + " --- " + (this.player_ids[13] === "" ? "EMPTY\n" : ("<@" + this.player_ids[13] + ">\n"))
            + (this.player_ids[6] === "" ? "EMPTY" : ("<@" + this.player_ids[6] + ">")) + " --- " + (this.player_ids[14] === "" ? "EMPTY\n" : ("<@" + this.player_ids[14] + ">\n"))
            + (this.player_ids[7] === "" ? "EMPTY" : ("<@" + this.player_ids[7] + ">")) + " --- " + (this.player_ids[15] === "" ? "EMPTY\n" : ("<@" + this.player_ids[15] + ">\n"))
        return contractContent;
    }

    toButtons() {
        if (this.getStatus() === "READY") {
            return new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(this.rebel_queue_id)
                        .setLabel("Queue Rebel")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(this.imperial_queue_id)
                        .setLabel("Queue Imperial")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(this.dequeue_id)
                        .setLabel('Dequeue')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(this.start_match_id)
                        .setLabel('Start Match')
                        .setStyle(ButtonStyle.Primary),
                );
        }
        else {
            return new ActionRowBuilder()
                .addComponents([
                    new ButtonBuilder()
                        .setCustomId(this.rebel_queue_id)
                        .setLabel("Queue Rebel")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(this.imperial_queue_id)
                        .setLabel("Queue Imperial")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(this.dequeue_id)
                        .setLabel('Dequeue')
                        .setStyle(ButtonStyle.Danger)
                ]);
        }
    }
}

module.exports = Match;