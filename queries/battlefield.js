const { db } = require("../tools/databaseInitializer.js")

function addBattlefield(battlefieldObj) {
    try {
        db.transaction(() => {
            const addBattlefield = db.prepare("INSERT INTO battlefield (time, competitive) VALUES (?, ?)");
            addBattlefield.run(Date.now(), battlefieldObj.competitive ? 1 : 0);

            const battlefield_id = db.prepare("SELECT last_insert_rowid() AS id").get().id;

            const addBattlefieldPlayer = db.prepare(`INSERT INTO battlefield_player (
                player_name, 
                faction, 
                kills, 
                healing, 
                damage, 
                captures, 
                assists, 
                battlefield_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

            for (const player of battlefieldObj.players) {
                addBattlefieldPlayer.run(
                    player.name,
                    player.faction,
                    player.kills,
                    player.healing,
                    player.damage,
                    player.captures,
                    player.assists,
                    battlefield_id);
            }
        })();

        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

function getBattlefieldPlayersByWeek(startDate, competitive) {
    let endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    startDate = startDate.getTime();
    endDate = endDate.getTime();

    const getBattlefieldPlayers = db.prepare(`
        SELECT battlefield_player.player_name, battlefield_player.faction, battlefield_player.kills, battlefield_player.healing, battlefield_player.damage, battlefield_player.captures, battlefield_player.assists
        FROM battlefield 
        JOIN battlefield_player 
        ON battlefield.battlefield_id = battlefield_player.battlefield_id 
        WHERE battlefield.time BETWEEN ? AND ? AND battlefield.competitive = ?
    `);

    const rows = getBattlefieldPlayers.all(startDate, endDate, competitive ? 1 : 0);
    return rows;
}

module.exports = {
    addBattlefield,
    getBattlefieldPlayersByWeek,
}