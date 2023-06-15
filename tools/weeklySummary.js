const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { getBattlefieldPlayersByWeek } = require('../queries/battlefield');


function createTable(title, rebelPlayers, imperialPlayers, stat) {
    let rows = [];
    for (let i = 0; i < Math.max(rebelPlayers.length, imperialPlayers.length); i++) {
        const rebelPlayer = rebelPlayers[i] || {};
        const imperialPlayer = imperialPlayers[i] || {};

        let rebelStat = rebelPlayer[stat] ? (stat === 'heroism' ? parseFloat(rebelPlayer[stat]).toFixed(1) : rebelPlayer[stat]) : '';
        let imperialStat = imperialPlayer[stat] ? (stat === 'heroism' ? parseFloat(imperialPlayer[stat]).toFixed(1) : imperialPlayer[stat]) : '';

        rows.push(`
                <tr>
                    <td class="rebel-text">${rebelStat ? (rebelPlayer.player_name.split(" ")[0] || '') : ''}</td>
                    <td class="rebel-text">${rebelStat}</td>
                    <td class="imperial-text">${imperialStat ? (imperialPlayer.player_name.split(" ")[0] || '') : ''}</td>
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

function getTopPlayersByStat(players, faction, stat, limit) {

    players = players.filter((player) => player.faction === faction);

    let playerMap = new Map();
    players.forEach(player => {
        if (playerMap.has(player.player_name)) {
            let existingPlayer = playerMap.get(player.player_name);
            existingPlayer[stat] += player[stat];
        } else {
            playerMap.set(player.player_name, JSON.parse(JSON.stringify(player)));
        }
    });

    players = Array.from(playerMap.values());

    players.sort((a, b) => b[stat] - a[stat]);

    return players.slice(0, limit);
}

function getTopPlayersByHeroism(players, faction, limit) {
    players = players.filter((player) => player.faction === faction);

    let playerMap = new Map();
    players.forEach(player => {
        if (playerMap.has(player.player_name)) {
            let existingPlayer = playerMap.get(player.player_name);
            existingPlayer.kills += player.kills;
            existingPlayer.captures += player.captures;
            existingPlayer.assists += player.assists;
            existingPlayer.damage += player.damage;
            existingPlayer.healing += player.healing;
        } else {
            playerMap.set(player.player_name, JSON.parse(JSON.stringify(player)));
        }
    });

    players = Array.from(playerMap.values());

    players = players.map((player) => ({
        ...player,
        heroism: player.kills + (player.captures * 2) + (player.assists / 3) + (player.damage / 50000) + (player.healing / 50000)
    }));

    players.sort((a, b) => b.heroism - a.heroism);

    return players.slice(0, limit);
}

async function generateWeeklySummary(competitive) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const players = getBattlefieldPlayersByWeek(startDate, competitive);
    const topHeroismRebel = getTopPlayersByHeroism(players, "Rebel", 10);
    const topDamageRebel = getTopPlayersByStat(players, "Rebel", 'damage', 5);
    const topHealingRebel = getTopPlayersByStat(players, "Rebel", 'healing', 5);
    const topKillsRebel = getTopPlayersByStat(players, "Rebel", 'kills', 5);
    const topCapturesRebel = getTopPlayersByStat(players, "Rebel", 'captures', 5);

    const topHeroismImperial = getTopPlayersByHeroism(players, "Imperial", 10);
    const topDamageImperial = getTopPlayersByStat(players, "Imperial", 'damage', 5);
    const topHealingImperial = getTopPlayersByStat(players, "Imperial", 'healing', 5);
    const topKillsImperial = getTopPlayersByStat(players, "Imperial", 'kills', 5);
    const topCapturesImperial = getTopPlayersByStat(players, "Imperial", 'captures', 5);

    let data = `
            <div class="table-row">
                <div class="table-cell-heroism" style="margin-right: 25px;">${createTable('Top Heroism', topHeroismRebel, topHeroismImperial, 'heroism')}</div>
                <div class="table-cell-stats">
                    <div class="table-row" style="margin-bottom: 25px;">
                        <div class="table-cell" style="margin-right: 25px;">${createTable('Top Damage', topDamageRebel, topDamageImperial, 'damage')}</div>
                        <div class="table-cell">${createTable('Top Kills', topKillsRebel, topKillsImperial, 'kills')}</div>
                    </div>
                    <div class="table-row">
                        <div class="table-cell" style="margin-right: 25px;">${createTable('Top Healing', topHealingRebel, topHealingImperial, 'healing')}</div>
                        <div class="table-cell">${createTable('Top Captures', topCapturesRebel, topCapturesImperial, 'captures')}</div>
                    </div>
                </div>
            </div>
        `;

    let html = `
            <html>
                <head>
                    <style>
                        @font-face {
                            font-family: 'SW'; 
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
                        <h1>restoration ${competitive ? "competitive" : "casual"} battlefields weekly summary</h1>
                    </div>
                    ${data}
                </body>
            </html>
        `;

    fs.writeFileSync('table.html', html);

    const browser = await puppeteer.launch({ defaultViewport: { width: 1400, height: 600 }, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('file://' + path.resolve('table.html'));

    await page.screenshot({ path: 'table.png', fullPage: true });

    await browser.close();

    return path.resolve('table.png');
}

module.exports = {
    generateWeeklySummary,
};