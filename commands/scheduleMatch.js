const { SlashCommandBuilder } = require('discord.js');
const { addScheduledMatch } = require("../queries/schedule.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('schedule_match')
        .setDescription('Schedule a battlefield match!')
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

        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.roles.cache.some(role => role.name === 'Admin')) {
            await interaction.editReply({ content: 'Only admins may schedule matches.' });
            return;
        }

        const timestamp = interaction.options.getString("time");
        const discordTimestampRegex = /<t:\d+:[tTdDfFR]>/

        if (!discordTimestampRegex.test(timestamp)) {
            await interaction.editReply({ content: 'Please enter a valid Discord timestamp.' });
            return;
        }

        const scheduleTimeMilliseconds = Number(interaction.options.getString("time").match(/<t:(\d+):[a-zA-Z]>?/)[1]) * 1000;

        if (scheduleTimeMilliseconds <= Date.now()) {
            await interaction.editReply({ content: 'The match time must be in the future.' });
            return;
        }
        await interaction.guild.members.fetch(interaction.user.id)
            .then(member => {
                if (!member.roles.cache.some(role => role.name === 'Admin')) {
                    interaction.editReply({ content: 'Only admins may schedule matches.' });
                    return;
                }
            })
            .catch(console.error);

        const isCompetitive = interaction.options.getBoolean('competitive') ? 1 : 0;
        const scheduleTime = interaction.options.getString("time").match(/<t:(\d+):[a-zA-Z]>?/)[1]
        const initiatorDiscordId = interaction.user.id;

        addScheduledMatch(isCompetitive, scheduleTime, initiatorDiscordId, interaction.guild.id);

        await interaction.editReply({ content: 'Match scheduled!' });
    },
};