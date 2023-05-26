class Export {
    constructor(players, date) {
        if (players.length < 8 || players.length > 16) {
            throw new Error('Player list must contain between 8 and 16 players.');
        }
        this.players = players;
        this.date = date;
    }

    summary() {
        let summaryStr = `\`\`\`+--------------+-----------+----+----+----+--------+---------+-----+\n|    Player    |  Faction  | Ki | As | De | Damage | Healing | Cap |\n+--------------+-----------+----+----+----+--------+---------+-----+\n`

        for (const player of this.players) {
            summaryStr += `| ${(player.name + "                        ").substring(0, 12)} | ${(player.faction + "         ").substring(0, 9)} | ${(player.kills + "     ").substring(0, 2)} | ${(player.assists + "      ").substring(0, 2)} | ${(player.deaths + "     ").substring(0, 2)} | ${(player.damage + "          ").substring(0, 6)} | ${(player.healing + "      ").substring(0, 7)} | ${(player.captures + "     ").substring(0, 3)} |\n+--------------+-----------+----+----+----+--------+---------+-----+\n`;
        }

        return summaryStr + "```";
    }
}

module.exports = Export;