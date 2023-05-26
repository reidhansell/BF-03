// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Collection, ComponentType } = require('discord.js');
const { token } = require('./config.json');
const { updateMatch, getMatchByButton, addExport } = require('./databaseManager');
const axios = require('axios');
const cheerio = require('cheerio');
const Export = require("./objects/Export");
const Player = require("./objects/Player");

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Log in to Discord with your client's token
client.login(token);

function startCollectors() {

    var guilds = client.guilds.cache;
    guilds = guilds.values();
    var textChannels = []
    for (const guild of guilds) {
        var guildTextChannels = guild.channels.cache;
        guildTextChannels.sweep(channel => channel.name != "battlefields");
        guildTextChannels = guildTextChannels.values();
        for (const textChannel of guildTextChannels) {
            textChannels.push(textChannel);
        }
    }

    for (const channel of textChannels) {
        const collector = channel.createMessageComponentCollector({ componentType: ComponentType.Button });

        collector.on('collect', async (interaction) => {
            try {
                await interaction.deferReply({ ephemeral: true });
            } catch (error) {
                console.log("Interaction could not be deferred.");
                return;
            }
            let matchObject = getMatchByButton(interaction.customId);
            let matchMessage = await interaction.channel.messages.fetch(matchObject.message_id);
            if (interaction.customId === matchObject.rebel_queue_id || interaction.customId === matchObject.imperial_queue_id) {
                result = matchObject.queuePlayer(interaction.user.id, (interaction.customId === matchObject.rebel_queue_id ? "Rebel" : "Imperial"));
                if (result === "Queue full." || result === "Already in queue.") {
                    await interaction.editReply({ ephemeral: true, content: result });
                } else {
                    updateMatch(matchObject);
                    await matchMessage.edit({ content: matchObject.toString(), components: [matchObject.toButtons()] });
                    await interaction.editReply({ ephemeral: true, content: "Added to queue." });
                }
            }
            else if (interaction.customId === matchObject.dequeue_id) {
                matchObject.dequeuePlayer(interaction.user.id);
                updateMatch(matchObject);
                if (matchObject.isEmpty()) {
                    await interaction.editReply({ ephemeral: true, content: "Removed from queue. The match was empty, so it was deleted." });
                    await matchMessage.delete();
                } else {
                    await matchMessage.edit({ content: matchObject.toString(), components: [matchObject.toButtons()] });
                    await interaction.editReply({ ephemeral: true, content: "Removed from queue." });
                }
            }
            else if (interaction.customId === matchObject.start_match_id) {
                if (interaction.user.id != matchObject.initiator_id) {
                    await interaction.editReply({ ephemeral: true, content: "You cannot start a match that you did not initiate." });
                    return;
                }
                matchObject.start();
                updateMatch(matchObject);
                await matchMessage.edit({ content: matchObject.toString(), components: [] });
                await interaction.editReply({ ephemeral: true, content: "Match started." });
            }
        }
        );
        console.log("collectors are running on in all known guilds");
    }
}

client.on('ready', () => {
    startCollectors();
});

client.on("guildCreate", guild => {
    startCollectors();
})

client.on("channelCreate", channel => {
    if (channel.name === "battlefields") {
        startCollectors();
    }
})

client.on('messageCreate', async message => {
    if (message.channel.name === 'exports' && message.attachments.size > 0) {
        message.attachments.forEach(attachment => {
            if (attachment.name.endsWith('.html')) {
                axios.get(attachment.url)
                    .then(response => {
                        const $ = cheerio.load(response.data);
                        let players = [];
                        $('table tr').each((i, row) => {
                            if (i > 0) { // Skip header row
                                let cells = $(row).find('td');
                                let player = new Player({
                                    name: $(cells[0]).text(),
                                    faction: $(cells[1]).text(),
                                    kills: parseInt($(cells[2]).text()),
                                    assists: parseInt($(cells[3]).text()),
                                    deaths: parseInt($(cells[4]).text()),
                                    damage: parseInt($(cells[5]).text()),
                                    healing: parseInt($(cells[6]).text()),
                                    captures: parseInt($(cells[7]).text())
                                });
                                players.push(player);
                            }
                        });
                        let exportObj = new Export(players);
                        // Save to the database
                        addExport(exportObj);

                        // Send summary to #exports channel
                        // Assuming summary() is a method in the Export class that returns a summary string
                        message.channel.send(`Export added:\n ${exportObj.summary()}`);
                    })
                    .catch(console.error);
            }
        });
    }
});

