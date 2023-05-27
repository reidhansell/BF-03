const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');


class Export {
    constructor(players, date) {
        if (players.length < 8 || players.length > 16) {
            throw new Error('Player list must contain between 8 and 16 players.');
        }
        this.players = players;
        this.date = date;
    }

    centerAlign(value, width) {
        const valueLength = value.length;
        const totalPadding = width - valueLength;
        const leftPadding = Math.floor(totalPadding / 2);
        const rightPadding = Math.ceil(totalPadding / 2);
        return ' '.repeat(leftPadding) + value + ' '.repeat(rightPadding);
    }

    async summary() {
        // Prepare data for the table
        let data = this.players.map(player => `
            <tr style="color: ${player.faction === 'Rebel' ? 'red' : '#1772b4'}">
                <td>${player.name}</td>
                <td>${player.faction}</td>
                <td>${player.kills}</td>
                <td>${player.assists}</td>
                <td>${player.deaths}</td>
                <td>${player.damage}</td>
                <td>${player.healing}</td>
                <td>${player.captures}</td>
            </tr>
        `).join('');

        // Prepare HTML
        let html = `
            <html>
                <head>
                    <style>
                        @font-face {
                            font-family: 'SW'; /*You can use whatever name that you want*/
                            src: url('./Starjhol.ttf');
                        }
    
                        table { 
                            margin-top: 5px;
                            padding-top: 5px;
                            border-collapse: collapse; 
                            width: 100%; 
                            font-family: sans-serif;
                            font-weight: bold;
                        }
                        td, th { 
                            border: 1px solid black; 
                            padding: 8px; 
                            text-align: center; 
                        }
                        tr:nth-child(even) { 
                            background-color: #f2f2f2; 
                        }
                        body {
                            background-color: black;
                            background-image: radial-gradient(ellipse at center, rgba(255,255,255,0.3) 0%, rgba(0,0,0,1) 100%);
                            color: white;
                        }
                        .banner, .banner h1 {
                            text-align: center;
                            font-size: 32px;
                            font-family: 'SW', sans-serif;
                            margin-bottom: 0px;
                            padding-bottom: 0px;
                            text-shadow: 0 4px 4px rgba(0, 0, 0, 0.5);
                        }
                        #player-table th, #player-table td {
                            border: 1px solid #FFF;
                        }
                        #player-table tr:nth-child(even) {
                            background-color: rgba(0, 0, 0, 0.5);
                        }
                    </style>
                </head>
                <body>
                    <div class="banner">
                        <h1>battlefield report</h1>
                    </div>
                    <table id="player-table">
                        <tr>
                            <th>Player</th>
                            <th>Faction</th>
                            <th>Kills</th>
                            <th>Assists</th>
                            <th>Deaths</th>
                            <th>Damage</th>
                            <th>Healing</th>
                            <th>Captures</th>
                        </tr>
                        ${data}
                    </table>
                </body>
            </html>
        `;

        // Write HTML to a file
        fs.writeFileSync('table.html', html);

        // Launch Puppeteer, go to the page
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('file://' + path.resolve('table.html'));

        // Get the table height
        const tableHeight = await page.evaluate(() => document.querySelector('#player-table').clientHeight);
        const bannerHeight = 60; // Set the banner height (adjust as needed)
        const viewportHeight = tableHeight + bannerHeight;

        // Set the viewport height to include the banner
        await page.setViewport({ width: 800, height: viewportHeight });

        // Take a screenshot of the entire page
        const tableElement = await page.$('#player-table');
        const tableBoundingBox = await tableElement.boundingBox();
        const screenshotOptions = {
            path: 'table.png',
            clip: {
                x: tableBoundingBox.x,
                y: tableBoundingBox.y - bannerHeight,
                width: tableBoundingBox.width,
                height: tableBoundingBox.height + bannerHeight
            }
        };
        await page.screenshot(screenshotOptions);

        await browser.close();

        return path.resolve('table.png');
    }

}

module.exports = Export;