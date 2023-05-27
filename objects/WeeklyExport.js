const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { getTopPlayersByHeroism, getTopPlayersByStat, getExportsByWeek } = require('../databaseManager');

class WeeklyExport {

    createTable(title, rebelPlayers, imperialPlayers, stat) {
        let rows = [];
        for (let i = 0; i < Math.max(rebelPlayers.length, imperialPlayers.length); i++) {
            const rebelPlayer = rebelPlayers[i] || {};
            const imperialPlayer = imperialPlayers[i] || {};

            let rebelStat = rebelPlayer[stat] ? (stat === 'heroism' ? parseFloat(rebelPlayer[stat]).toFixed(1) : rebelPlayer[stat]) : '';
            let imperialStat = imperialPlayer[stat] ? (stat === 'heroism' ? parseFloat(imperialPlayer[stat]).toFixed(1) : imperialPlayer[stat]) : '';

            rows.push(`
                <tr>
                    <td class="rebel-text">${rebelStat ? (rebelPlayer.name.split(" ")[0] || '') : ''}</td>
                    <td class="rebel-text">${rebelStat}</td>
                    <td class="imperial-text">${imperialStat ? (imperialPlayer.name.split(" ")[0] || '') : ''}</td>
                    <td class="imperial-text">${imperialStat}</td>
                </tr>
            `);
        }
        rows = rows.join('');

        return `
            <table id="player-table">
                <tr><th colspan="4">${title}</th></tr>
                <tr><th colspan="2">Rebel</th><th colspan="2">Imperial</th></tr>
                <tr><th>Player</th><th>${stat}</th><th>Player</th><th>${stat}</th></tr>
                ${rows}
            </table>
        `;
    }

    async generateWeeklySummary() {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7); // Start from 7 days ago

        const exports = getExportsByWeek(startDate);

        const topHeroismRebel = getTopPlayersByHeroism(exports, "Rebel", 10);
        const topDamageRebel = getTopPlayersByStat(exports, "Rebel", 'damage', 5);
        const topHealingRebel = getTopPlayersByStat(exports, "Rebel", 'healing', 5);
        const topKillsRebel = getTopPlayersByStat(exports, "Rebel", 'kills', 5);
        const topCapturesRebel = getTopPlayersByStat(exports, "Rebel", 'captures', 5);

        const topHeroismImperial = getTopPlayersByHeroism(exports, "Imperial", 10);
        const topDamageImperial = getTopPlayersByStat(exports, "Imperial", 'damage', 5);
        const topHealingImperial = getTopPlayersByStat(exports, "Imperial", 'healing', 5);
        const topKillsImperial = getTopPlayersByStat(exports, "Imperial", 'kills', 5);
        const topCapturesImperial = getTopPlayersByStat(exports, "Imperial", 'captures', 5);

        // Prepare data for the tables
        let data = `
            <div class="table-row">
                <div class="table-cell-heroism" style="margin-right: 25px;">${this.createTable('Top Heroism', topHeroismRebel, topHeroismImperial, 'heroism')}</div>
                <div class="table-cell-stats">
                    <div class="table-row" style="margin-bottom: 25px;">
                        <div class="table-cell" style="margin-right: 25px;">${this.createTable('Top Damage', topDamageRebel, topDamageImperial, 'damage')}</div>
                        <div class="table-cell">${this.createTable('Top Kills', topKillsRebel, topKillsImperial, 'kills')}</div>
                    </div>
                    <div class="table-row">
                        <div class="table-cell" style="margin-right: 25px;">${this.createTable('Top Healing', topHealingRebel, topHealingImperial, 'healing')}</div>
                        <div class="table-cell">${this.createTable('Top Captures', topCapturesRebel, topCapturesImperial, 'captures')}</div>
                    </div>
                </div>
            </div>
        `;

        // Prepare HTML
        let html = `
            <html>
                <head>
                    <style>
                        @font-face {
                            font-family: 'SW'; /*You can use whatever name that you want*/
                            src: url('./Starjhol.ttf');
                        }

                        .banner{
                            font-family: 'SW', sans-serif;
                        }

                        .table-row {
                            display: flex;
                            width: 100%;
                        }
                        
                        table {
                            font-weight: bold;
                        }

                        .table-cell {
                            width: 500px;
                        }

                        .table-cell-heroism {
                            width: 30%;
                        }

                        .table-cell-stats {
                            width: 70%;
                        }

                        #player-table {
                            width: 100%;
                            border-collapse: collapse;
                        }

                        #player-table th, #player-table td {
                            border: 1px solid #ddd;
                            padding: 8px;
                        }

                        .rebel-text {
                            color: red;
                        }

                        .imperial-text {
                            color: #1772b4;
                        }

                        body {
                            background-color: black;
                            background-image: radial-gradient(ellipse at center, rgba(200,200,200,0.3) 0%, rgba(0,0,0,1) 100%);
                            color: white;
                            font-family: sans-serif;
                        }
                    </style>
                </head>
                <body style="">
                    <div class="banner">
                        <h1>restoration battlefields weekly summary</h1>
                    </div>
                    ${data}
                </body>
            </html>
        `;

        // Write HTML to a file
        fs.writeFileSync('table.html', html);

        // Launch Puppeteer, go to the page
        const browser = await puppeteer.launch({ defaultViewport: { width: 1400, height: 600 }, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.goto('file://' + path.resolve('table.html'));

        // Take a screenshot of the entire page
        await page.screenshot({ path: 'table.png', fullPage: true });

        await browser.close();

        return path.resolve('table.png');
    }
}

module.exports = WeeklyExport;
