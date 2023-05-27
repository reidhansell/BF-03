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

            // Fetch all channels from Discord directly, bypassing the cache
            let channels = await interaction.guild.channels.fetch();

            // Find the exports-weekly channel
            let weeklySummaryChannel = await channels.find(channel => channel.name === 'exports-weekly');
            if (!weeklySummaryChannel) {
                interaction.editReply({ content: "There is no exports-weekly channel." });
                return;
            }

            // Generate the weekly summary as an image
            weeklyExport.generateWeeklySummary().then(imagePath => {
                // Send the image to the channel
                weeklySummaryChannel.send({ content: `Weekly Summary`, files: [{ attachment: imagePath, name: 'summary.png' }] });
            }).catch(console.error);

            interaction.editReply('Weekly export summary has been sent.');
        } catch (error) {
            console.error('Failed to generate weekly export summary:', error);
            interaction.editReply('An error occurred while generating the weekly export summary.');
        }
    },
};
