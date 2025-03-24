const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Collection, ComponentType } = require('discord.js');
const { token } = require('./config.json');
const { getMatchByButton, getExpiredMatches, setRemovedStatus } = require('./queries/match');
const { addBattlefield } = require('./queries/battlefield');
const Battlefield = require("./classes/Battlefield");
const BattlefieldPlayer = require("./classes/BattlefieldPlayer");
const cron = require('node-cron');
const { initDB } = require('./tools/databaseInitializer');
const _ = require('lodash');
const Match = require("./classes/Match");
const { channelId, exportChannelId } = require('./config.json');
const express = require('express');
const app = express();

app.use(express.json());

const BF_NAME_MAP = {
    "massassi_isle": "Massassi Isle",
    "battlefield2": "Jungle Warfare",
    "battlefield3": "Bunker Assault",
    "battlefield4": "Data Runner",
    "battlefield5": "Volcanic Turret Siege"
};

app.post('/api/battlefield', async (req, res) => {
    try {
        let data = req.body;

        if (!data || !data.battlefield || !Array.isArray(data.scores)) {
            return res.status(400).json({ error: 'Invalid battlefield data format' });
        }

        let battlefieldFriendlyName = BF_NAME_MAP[data.battlefield] || data.battlefield;

        let players = data.scores.map(s => new BattlefieldPlayer({
            name: s.player,
            faction: s.faction,
            kills: parseInt(s.kills) || 0,
            assists: parseInt(s.assists) || 0,
            deaths: parseInt(s.deaths) || 0,
            damage: parseInt(s.damage) || 0,
            healing: parseInt(s.healing) || 0,
            captures: parseInt(s.captures) || 0
        }));

        let battlefieldObj = new Battlefield(players, Math.floor(Date.now() / 1000), null);

        addBattlefield(battlefieldObj);

        battlefieldObj.summary().then(imagePath => {
            const channel = client.channels.cache.get(exportChannelId);
            if (!channel) {
                console.error('Could not find channel for battlefield summary post.');
                return;
            }

            channel.send({
                content: `New battlefield results: **${battlefieldFriendlyName}**`,
                files: [{ attachment: imagePath, name: 'table.png' }]
            });
        }).catch(console.error);

        res.status(200).json({ message: 'Battlefield data processed successfully' });

    } catch (error) {
        console.error('Error in /api/battlefield:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Battlefield server listening on port ${PORT}`);
});

initDB();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    try {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    } catch (error) {
        console.error(`Failed to load event ${file}: ${error}`);
    }
}

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.error(`The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    } catch (error) {
        console.error(`Failed to load command ${file}: ${error}`);
    }
}

client.login(token).catch(error => {
    console.error(`Failed to login: ${error}`);
});

async function startCollectors() {
    try {
        const channel = await client.channels.fetch(channelId);

        const collector = channel.createMessageComponentCollector({ componentType: ComponentType.Button });

        collector.on('collect', async (interaction) => {
            try {
                await interaction.deferReply({ ephemeral: true });
                let matchObject = new Match(getMatchByButton(interaction.customId));
                let matchMessage = await interaction.channel.messages.fetch(matchObject.message_id);
                if (interaction.customId === matchObject.rebel_queue_button_id || interaction.customId === matchObject.imperial_queue_button_id) {
                    let result = matchObject.queuePlayer(interaction.user.id, (interaction.customId === matchObject.rebel_queue_button_id ? "Rebel" : "Imperial"));
                    if (result === "Queue full." || result === "Already in queue.") {
                        await interaction.editReply({ ephemeral: true, content: result });
                    } else {
                        await matchMessage.edit({ content: matchObject.toString(), components: [matchObject.toButtons()] });
                        await interaction.editReply({ ephemeral: true, content: "Added to queue." });
                    }
                } else if (interaction.customId === matchObject.dequeue_button_id) {
                    let result = matchObject.dequeuePlayer(interaction.user.id);
                    if (result === "Player not in queue.") {
                        await interaction.editReply({ ephemeral: true, content: result });
                        return;
                    }
                    await matchMessage.edit({ content: matchObject.toString(), components: [matchObject.toButtons()] });
                    await interaction.editReply({ ephemeral: true, content: "Removed from queue." });
                }
            } catch (error) {
                console.error("Interaction failed with error:", error);
            }
        });
    } catch (error) {
        console.error("Failed to start collectors: ", error);
    }
    console.log("collectors are running");
}

async function deleteExpiredMatches() {
    try {
        let expiredMatches = getExpiredMatches();
        expiredMatches = expiredMatches.map(match => new Match(match));

        for (const match of expiredMatches) {
            const guild = client.guilds.cache.get(match.guild_id);
            if (guild) {
                const channel = guild.channels.cache.get(match.channel_id);
                if (channel) {
                    try {
                        const message = await channel.messages.fetch(match.message_id);
                        await message.delete();
                        setRemovedStatus(match.match_id);
                    } catch (error) {
                        console.error("Message not found, setting is_removed to true for match with id: ", match.match_id);
                        setRemovedStatus(match.match_id);
                    }
                }
            }
        }
    } catch (error) {
        console.error("Failed to delete expired matches:", error);
    }
}


client.on('ready', () => {
    startCollectors();
    cron.schedule('*/10 * * * *', () => {
        deleteExpiredMatches();
    });
});