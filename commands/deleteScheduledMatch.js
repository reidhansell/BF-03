const { SlashCommandBuilder } = require('discord.js');
const { deleteScheduledMatch } = require("../queries/schedule.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete_scheduled_match')
        .setDescription('Delete a scheduled battlefield match!')
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('The ID of the match to delete')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.roles.cache.some(role => role.name === 'Admin')) {
            await interaction.editReply({ content: 'Only admins may delete scheduled matches.' });
            return;
        }

        const matchId = interaction.options.getInteger('id');

        deleteScheduledMatch(matchId);

        await interaction.editReply({ content: `Match with ID ${matchId} deleted from schedule!` });
    },
};