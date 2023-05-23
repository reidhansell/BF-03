const { SlashCommandBuilder } = require('discord.js');
const { openMatch } = require('../databaseManager');
const Match = require("../objects/Match");
const { v4: uuidv4 } = require('uuid');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('match')
        .setDescription('Begin matchmaking for battlefields!')
        .addStringOption(option =>
            option.setName('time')
                .setDescription('What time will this match occur? (Default: now)')
                .setRequired(false)
                .setMaxLength(50))
        .addStringOption(option =>
            option.setName('location')
                .setDescription('Which battlefield will this match be in? (Default: random)')
                .setRequired(false)
                .setMaxLength(50)),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        let message = await interaction.guild.channels.cache.find(channel => channel.name === "battlefields").send("Generating match...");
        let url = message.url;
        let message_id = message.id;
        let channel_id = message.channel.id;
        let guild_id = message.guild.id;
        let faction = "";
        if (interaction.member.roles.cache.some(role => role.name === "Rebel" && role.guild.id === interaction.guild.id) && !interaction.member.roles.cache.some(role => role.name === "Imperial" && role.guild.id === interaction.guild.id)) {
            faction = "Rebel";
        }
        else if (interaction.member.roles.cache.some(role => role.name === "Imperial" && role.guild.id === interaction.guild.id) && !interaction.member.roles.cache.some(role => role.name === "Rebel" && role.guild.id === interaction.guild.id)) {
            faction = "Imperial";
        }
        let player_ids = Array(16).fill("");
        //let player_ids = ["111", "111", "111", "111", "111", "111", "111", "111", "", "", "", "", "", "", "", ""]
        //let player_ids = ["", "", "", "", "", "", "", "", "111", "111", "111", "111", "111", "111", "111", "111"]
        //let player_ids = ["111", "111", "111", "111", "111", "111", "111", "111", "111", "111", "111", "111", "111", "111", "111", "111"]
        //let player_ids = ["111", "111", "111", "111", "", "", "", "", "111", "111", "111", "111", "", "", "", ""]
        if (faction === "Rebel") {
            player_ids[0] = interaction.user.id;
        } else if (faction === "Imperial") {
            player_ids[8] = interaction.user.id;
        }
        let locations = ["Massassi Isle, Yavin IV", "Jungle Warfare, Yavin IV", "Bunker Assault, Endor", "Data Runner, Endor"];
        let time = Math.floor(new Date().getTime() / 1000);
        let location = locations[Math.floor(Math.random() * 4)];
        let match = new Match({
            "url": url,
            "message_id": message_id,
            "channel_id": channel_id,
            "guild_id": guild_id,
            "initiator_id": interaction.user.id,
            "player_ids": player_ids,
            "location": (interaction.options.getString("location") ? interaction.options.getString("location") : location),
            "time": (interaction.options.getString("time") ? interaction.options.getString("time") : time),
            "rebel_queue_id": uuidv4(),
            "imperial_queue_id": uuidv4(),
            "dequeue_id": uuidv4(),
            "start_match_id": uuidv4(),
            "started": false,
            "custom_time": (interaction.options.getString("time") ? true : false),
        });


        await message.edit({ content: match.toString(), components: [match.toButtons()] });
        await message.crosspost();
        await interaction.editReply({ content: "Match creation successful: " + message.url });

        openMatch(match);

    },

};
