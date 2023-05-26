const { SlashCommandBuilder } = require('discord.js');
const WeeklyExport = require('../objects/WeeklyExport');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('exportweekly')
        .setDescription('Generate and send the weekly export summary'),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        // Create an instance of WeeklyExport with the summary channel ID
        const weeklyExport = new WeeklyExport();

        try {
            // Generate and send the weekly export summary
            let summaryStr = weeklyExport.generateWeeklySummary();

            // Fetch all channels from Discord directly, bypassing the cache
            let channels = await interaction.guild.channels.fetch();

            // Find the exports-weekly channel
            let weeklySummaryChannel = await channels.find(channel => channel.name === 'exports-weekly');
            if (!weeklySummaryChannel) {
                interaction.editReply({ content: "There is no exports-weekly channel." });
                return;
            }

            // Send the summary message to the designated channel
            weeklySummaryChannel.send(summaryStr);

            interaction.editReply('Weekly export summary has been sent.');
        } catch (error) {
            console.error('Failed to generate weekly export summary:', error);
            interaction.editReply('An error occurred while generating the weekly export summary.');
        }
    },
};
