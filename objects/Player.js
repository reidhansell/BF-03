class Player {
    constructor(playerObj) {
        this.name = playerObj.name;
        this.faction = playerObj.faction;
        this.kills = playerObj.kills || 0;
        this.assists = playerObj.assists || 0;
        this.deaths = playerObj.deaths || 0;
        this.damage = playerObj.damage || 0;
        this.healing = playerObj.healing || 0;
        this.captures = playerObj.captures || 0;
    }
}
module.exports = Player;