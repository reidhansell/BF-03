const { getTopPlayersByHeroism, getTopPlayersByStat, getExportsByWeek } = require('../databaseManager');

class WeeklyExport {

    generateWeeklySummary() {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7); // Start from 7 days ago

        const exports = getExportsByWeek(startDate);

        const topKillsImperial = getTopPlayersByStat(exports, 'Imperial', 'kills', 5);
        const topKillsRebel = getTopPlayersByStat(exports, 'Rebel', 'kills', 5);
        const topCapturesImperial = getTopPlayersByStat(exports, 'Imperial', 'captures', 5);
        const topCapturesRebel = getTopPlayersByStat(exports, 'Rebel', 'captures', 5);
        const topHeroismImperial = getTopPlayersByHeroism(exports, 'Imperial', 10);
        const topHeroismRebel = getTopPlayersByHeroism(exports, 'Rebel', 10);
        const topHealingImperial = getTopPlayersByStat(exports, 'Imperial', 'healing', 5);
        const topHealingRebel = getTopPlayersByStat(exports, 'Rebel', 'healing', 5);
        const topDamageImperial = getTopPlayersByStat(exports, 'Imperial', 'damage', 5);
        const topDamageRebel = getTopPlayersByStat(exports, 'Rebel', 'damage', 5);

        let summaryStr = '**WEEKLY SUMMARY FOR LAST 7 DAYS**\n\n';

        summaryStr += '**Top Kills**:\n';
        summaryStr += '*Imperial*:\n';
        topKillsImperial.forEach((player, index) => {
            summaryStr += `${index + 1}. ${player.name} - Kills: ${player.kills}\n`;
        });
        summaryStr += '\n';
        summaryStr += '*Rebel*:\n';
        topKillsRebel.forEach((player, index) => {
            summaryStr += `${index + 1}. ${player.name} - Kills: ${player.kills}\n`;
        });
        summaryStr += '\n';

        summaryStr += '**Top Captures**:\n';
        summaryStr += '*Imperial*:\n';
        topCapturesImperial.forEach((player, index) => {
            summaryStr += `${index + 1}. ${player.name} - Captures: ${player.captures}\n`;
        });
        summaryStr += '\n';
        summaryStr += '*Rebel*:\n';
        topCapturesRebel.forEach((player, index) => {
            summaryStr += `${index + 1}. ${player.name} - Captures: ${player.captures}\n`;
        });
        summaryStr += '\n';

        summaryStr += '**Top Heroism**:\n';
        summaryStr += '*Imperial*:\n';
        topHeroismImperial.forEach((player, index) => {
            summaryStr += `${index + 1}. ${player.name} - Heroism: ${player.heroism}\n`;
        });
        summaryStr += '\n';
        summaryStr += '*Rebel*:\n';
        topHeroismRebel.forEach((player, index) => {
            summaryStr += `${index + 1}. ${player.name} - Heroism: ${player.heroism}\n`;
        });

        summaryStr += '\n';

        summaryStr += '**Top Healing**:\n';
        summaryStr += '*Imperial*:\n';
        topHealingImperial.forEach((player, index) => {
            summaryStr += `${index + 1}. ${player.name} - Healing: ${player.healing}\n`;
        });
        summaryStr += '\n';
        summaryStr += '*Rebel*:\n';
        topHealingRebel.forEach((player, index) => {
            summaryStr += `${index + 1}. ${player.name} - Healing: ${player.healing}\n`;
        });
        summaryStr += '\n';

        summaryStr += '**Top Damage**:\n';
        summaryStr += '*Imperial*:\n';
        topDamageImperial.forEach((player, index) => {
            summaryStr += `${index + 1}. ${player.name} - Damage: ${player.damage}\n`;
        });
        summaryStr += '\n';
        summaryStr += '*Rebel*:\n';
        topDamageRebel.forEach((player, index) => {
            summaryStr += `${index + 1}. ${player.name} - Damage: ${player.damage}\n`;
        });

        return summaryStr;
    }
}

module.exports = WeeklyExport;
