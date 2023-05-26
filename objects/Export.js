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

    summary() {
        const header = "+--------------+-----------+----+----+----+--------+---------+-----+";
        const divider = "+--------------+-----------+----+----+----+--------+---------+-----+";
        let summaryStr = `\`\`\`${header}\n|    Player    |  Faction  | Ki | As | De | Damage | Healing | Cap |\n${divider}\n`;

        for (const player of this.players) {
            const formattedName = player.name.substring(0, 12).padEnd(12, ' ');
            const formattedFaction = player.faction.substring(0, 9).padEnd(9, ' ');

            const formattedKills = this.centerAlign(player.kills.toString(), 2);
            const formattedAssists = this.centerAlign(player.assists.toString(), 2);
            const formattedDeaths = this.centerAlign(player.deaths.toString(), 2);
            const formattedDamage = this.centerAlign(player.damage.toString(), 6);
            const formattedHealing = this.centerAlign(player.healing.toString(), 7);
            const formattedCaptures = this.centerAlign(player.captures.toString(), 3);

            summaryStr += `| ${formattedName} | ${formattedFaction} | ${formattedKills} | ${formattedAssists} | ${formattedDeaths} | ${formattedDamage} | ${formattedHealing} | ${formattedCaptures} |\n`;
        }

        return summaryStr + `${divider}\`\`\``;
    }

}

module.exports = Export;