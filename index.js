const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Collection, ComponentType } = require('discord.js');
const { token } = require('./config.json');
const { getMatchByButton, getExpiredMatches, setRemovedStatus } = require('./queries/match');
const { addBattlefield } = require('./queries/battlefield');
const axios = require('axios');
const cheerio = require('cheerio');
const Battlefield = require("./classes/Battlefield");
const BattlefieldPlayer = require("./classes/BattlefieldPlayer");
const cron = require('node-cron');
const { generateWeeklySummary } = require('./tools/weeklySummary');
const { initDB } = require('./tools/databaseInitializer');
const _ = require('lodash');

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
        const textChannels = [];

        for (const guild of client.guilds.cache.values()) {
            const guildTextChannels = guild.channels.cache;
            guildTextChannels.sweep(channel => channel.name != "battlefields");
            for (const textChannel of guildTextChannels.values()) {
                textChannels.push(textChannel);
            }
        }

        for (const channel of textChannels) {
            const collector = channel.createMessageComponentCollector({ componentType: ComponentType.Button });

            collector.on('collect', async (interaction) => {
                try {
                    await interaction.deferReply({ ephemeral: true });
                    let matchObject = getMatchByButton(interaction.customId);
                    let matchMessage = await interaction.channel.messages.fetch(matchObject.message_id);
                    if (interaction.customId === matchObject.rebel_queue_button_id || interaction.customId === matchObject.imperial_queue_button_id) {
                        const competitiveRoles = ["Sniper", "Commando", "Ranged Carry", "Ranged Support", "Melee Carry", "Melee Support"];
                        const member = await interaction.guild.members.fetch(interaction.user.id);
                        if (matchObject.is_competitive === 1 && !member.roles.cache.some(role => competitiveRoles.includes(role.name))) {
                            await interaction.editReply({ content: "Please select a valid role in <#1106719576508608523> before queueing for a competitive match." });
                            return;
                        }

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
                        if (matchObject.isEmpty()) {
                            await interaction.editReply({ ephemeral: true, content: "Removed from queue. The match was empty, so it was deleted." });
                            await matchMessage.delete();
                        } else {
                            await matchMessage.edit({ content: matchObject.toString(), components: [matchObject.toButtons()] });
                            await interaction.editReply({ ephemeral: true, content: "Removed from queue." });
                        }
                    }
                } catch (error) {
                    console.error("Interaction failed with error:", error);
                }
            });
        }
    } catch (error) {
        console.error("Failed to start collectors: ", error);
    }
    console.log("collectors are running");
}

async function postWeeklySummary() {
    client.guilds.cache.forEach(async (guild) => {
        await guild.channels.fetch();

        let casualChannel = guild.channels.cache.find(channel => channel.name === "weekly-summary" && channel.parent && channel.parent.name === "Casual");
        let competitiveChannel = guild.channels.cache.find(channel => channel.name === "weekly-summary" && channel.parent && channel.parent.name === "Competitive");

        if (casualChannel) {
            try {
                const casualSummaryPath = await generateWeeklySummary(false);
                await casualChannel.send({
                    content: 'The weekly results are in for Casual!',
                    files: [{ attachment: casualSummaryPath, name: 'table.png' }],
                });
            } catch (error) {
                console.error(`Failed to send weekly summary to guild ${guild.id} for Casual: ${error}`);
            }
        } else {
            console.error("No Casual summary channel found");
        }

        if (competitiveChannel) {
            try {
                const competitiveSummaryPath = await generateWeeklySummary(true);
                await competitiveChannel.send({
                    content: 'The weekly results are in for Competitive!',
                    files: [{ attachment: competitiveSummaryPath, name: 'table.png' }],
                });
            } catch (error) {
                console.error(`Failed to send weekly summary to guild ${guild.id} for Competitive: ${error}`);
            }
        } else {
            console.error("No Competitive summary channel found");
        }
    });
}

async function deleteExpiredMatches() {
    try {
        const expiredMatches = getExpiredMatches();

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
    cron.schedule('0 12 * * 0', () => {
        postWeeklySummary();
    });
    cron.schedule('* * * * *', () => {
        deleteExpiredMatches();
    });
});

const cooldowns = new Map();

client.on('messageCreate', async message => {
    try {

        if (message.channel.name === 'exports') {
            if (message.attachments.size > 0) {
                message.attachments.forEach(async attachment => {
                    try {
                        if (attachment.name.endsWith('.html')) {
                            if (cooldowns.has(message.channel.id)) {
                                const lastCommand = cooldowns.get(message.channel.id);
                                const timeDifference = Date.now() - lastCommand;
                                if (timeDifference < 60000) {
                                    await message.reply('Please wait 60 seconds before uploading another export.');
                                    return message.delete();
                                }
                            }
                            const response = await axios.get(attachment.url);
                            const $ = cheerio.load(response.data);
                            let players = [];

                            const headers = ['Name', 'Faction', 'Kills', 'Assists', 'Deaths', 'Damage', 'Healing', 'Captures'];
                            const tableHeaders = $('table tr').first().children().map((i, th) => $(th).text()).toArray();
                            if (!_.isEqual(headers, tableHeaders)) {
                                return message.reply('Incorrect export format.');
                            }

                            $('table tr').each((i, row) => {
                                if (i > 0) {
                                    let cells = $(row).find('td');
                                    let player = new BattlefieldPlayer({
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
                            const parent = await message.guild.channels.fetch(message.channel.parentId);
                            let battlefieldObj = new Battlefield(players, Math.floor(Date.now() / 1000), parent.name.toLowerCase() === "competitive" ? 1 : 0, null);
                            addBattlefield(battlefieldObj);
                            cooldowns.set(message.channel.id, Date.now());
                            await message.delete();
                            battlefieldObj.summary().then(imagePath => {
                                message.channel.send({ content: `Battlefield recorded`, files: [{ attachment: imagePath, name: 'table.png' }] });
                            }).catch(console.error);
                        } else if (!(message.author.id === client.user.id)) {
                            await message.delete();
                        }
                    } catch (error) {
                        console.error(`Failed to process attachment ${attachment.name}: ${error}`);
                    }
                });
            } else if (!(message.author.id === client.user.id)) {
                await message.delete();
            }
        }
    } catch (error) {
        console.error(`Message creation failed with error: ${error}`);
    }
});
