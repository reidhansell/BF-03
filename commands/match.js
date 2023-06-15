const { SlashCommandBuilder } = require('discord.js');
const { openMatch } = require('../queries/match');
const Match = require("../classes/Match");
const { v4: uuidv4 } = require('uuid');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('match')
        .setDescription('Begin matchmaking for battlefields!')
        .addBooleanOption(option =>
            option.setName('competitive')
                .setDescription('Is this a competitive match?')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('time')
                .setDescription('What time will this match occur?')
                .setRequired(true)
                .setMaxLength(50)),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        let is_competitive = interaction.options.getBoolean("competitive") ? 1 : 0;
        await interaction.guild.channels.fetch();
        let targetChannel = interaction.guild.channels.cache.find(channel => {
            return channel.name === "battlefields" && channel.parent && channel.parent.name === (is_competitive === 1 ? "Competitive" : "Casual");
        });

        const timestamp = interaction.options.getString("time");
        const discordTimestampRegex = /<t:\d+:[tTdDfFR]>/

        if (!discordTimestampRegex.test(timestamp)) {
            await interaction.editReply({ content: 'Please enter a valid Discord timestamp.' });
            return;
        }

        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (interaction.options.getBoolean("competitive") && !member.roles.cache.some(role => role.name === "Captain")) {
            await interaction.editReply({ content: "Only captains may create competitive matches." });
            return;
        }

        let message = await targetChannel.send("Generating match...");
        try {
            let match = new Match({
                "match_id": null,
                "url": message.url,
                "message_id": message.id,
                "channel_id": message.channel.id,
                "guild_id": message.guild.id,
                "initiator_discord_id": interaction.user.id,
                "time": interaction.options.getString("time").match(/<t:(\d+):[a-zA-Z]>?/)[1],
                "rebel_queue_button_id": uuidv4(),
                "imperial_queue_button_id": uuidv4(),
                "dequeue_button_id": uuidv4(),
                "is_competitive": is_competitive
            });
            openMatch(match);
            await message.edit({ content: match.toString(), components: [match.toButtons()] });
            await interaction.editReply({ content: "Match creation successful: " + message.url });
        } catch (error) {
            console.error(error);
            await message.delete();
            await interaction.editReply({ content: "There was an error during match creation." });
        }
    },

};
