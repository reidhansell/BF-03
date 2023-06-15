const { SlashCommandBuilder } = require('discord.js');
const { db } = require("../tools/databaseInitializer.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('schedulematch')
        .setDescription('Schedule a battlefield match!')
        .addBooleanOption(option =>
            option.setName('competitive')
                .setDescription('Is this a competitive match?')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('time')
                .setDescription('What time will this match occur? (Format: YYYY-MM-DD HH:MM:SS)')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        await interaction.guild.members.fetch(interaction.user.id)
            .then(member => {
                if (!member.roles.cache.some(role => role.name === 'Admin')) {
                    interaction.editReply({ content: 'Only admins may schedule matches.' });
                    return;
                }
            })
            .catch(console.error);

        const isCompetitive = interaction.options.getBoolean('competitive') ? 1 : 0;
        const scheduleTime = interaction.options.getString('time');
        const initiatorDiscordId = interaction.user.id;

        const insertIntoScheduleTable = db.prepare(`INSERT INTO match_schedule (competitive, schedule_time, initiator_discord_id) VALUES (?, ?, ?)`);

        insertIntoScheduleTable.run(isCompetitive, scheduleTime, initiatorDiscordId);

        await interaction.editReply({ content: 'Match scheduled!' });
    },
};