const { db } = require("../tools/databaseInitializer.js");

function addBattlefield(battlefieldObj) {
    try {
        db.transaction(() => {
            const addBattlefield = db.prepare("INSERT INTO battlefield (time) VALUES (?)");
            addBattlefield.run(Date.now());

            const battlefield_id = db.prepare("SELECT last_insert_rowid() AS id").get().id;

            const addBattlefieldPlayer = db.prepare(`INSERT INTO battlefield_player (
                player_name, 
                faction, 
                kills, 
                healing, 
                damage, 
                captures, 
                assists, 
                battlefield_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

            for (const player of battlefieldObj.players) {
                addBattlefieldPlayer.run(
                    player.name,
                    player.faction,
                    player.kills,
                    player.healing,
                    player.damage,
                    player.captures,
                    player.assists,
                    battlefield_id
                );
            }
        })();

        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

module.exports = {
    addBattlefield
};
