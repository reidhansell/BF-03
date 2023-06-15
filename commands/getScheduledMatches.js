const { SlashCommandBuilder } = require('discord.js');
const { getScheduledMatches } = require("../queries/schedule.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('get_scheduled_matches')
        .setDescription('Get all scheduled battlefield matches!'),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.roles.cache.some(role => role.name === 'Admin')) {
            await interaction.editReply({ content: 'Only admins may get scheduled matches.' });
            return;
        }

        await interaction.guild.members.fetch(interaction.user.id)
            .then(member => {
                if (!member.roles.cache.some(role => role.name === 'Admin')) {
                    interaction.editReply({ content: 'Only admins may view scheduled matches.' });
                    return;
                }
            })
            .catch(console.error);

        const matches = getScheduledMatches();

        const response = matches.length > 0 ? matches.map(match => `Match ID: ${match.schedule_id}\nTime: <t:${match.schedule_time}:f>\nCompetitive: ${match.competitive ? 'Yes' : 'No'}\nguild_id: ${match.guild_id}`).join('\n') : 'No scheduled matches.';

        await interaction.editReply({ content: response });
    },
};