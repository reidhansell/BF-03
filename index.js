// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Collection, ComponentType } = require('discord.js');
const { token } = require('./config.json');
const { updateMatch, getMatchByButton } = require('./databaseManager');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

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
            matchObject = getMatchByButton(interaction.customId);
            if (interaction.customId === matchObject.queue_id) {
                let faction = "";
                if (interaction.member.roles.cache.some(role => role.name === "Rebel" && role.guild.id === interaction.guild.id) && !interaction.member.roles.cache.some(role => role.name === "Imperial" && role.guild.id === interaction.guild.id)) {
                    faction = "Rebel";
                }
                else if (interaction.member.roles.cache.some(role => role.name === "Imperial" && role.guild.id === interaction.guild.id) && !interaction.member.roles.cache.some(role => role.name === "Rebel" && role.guild.id === interaction.guild.id)) {
                    faction = "Imperial";
                }
                else {
                    await interaction.reply({ ephemeral: true, content: "Please obtain a Rebel or Imperial role before queueing. You cannot have both. This can be done by an admin or a role select bot." });
                    return;
                }
                result = matchObject.queuePlayer(interaction.user.id, faction);
                if (result === "Queue full." || result === "Already in queue.") {
                    await interaction.reply({ ephemeral: true, content: result });
                } else {
                    updateMatch(matchObject);
                    await interaction.update({ content: matchObject.toString(), components: [matchObject.toButtons()] });
                }
            }
            else if (interaction.customId === matchObject.dequeue_id) {
                matchObject.dequeuePlayer(interaction.user.id);
                updateMatch(matchObject);
                await interaction.update({ content: matchObject.toString(), components: [matchObject.toButtons()] });
            }
            else if (interaction.customId === matchObject.start_match_id) {
                if (interaction.user.id != matchObject.initiator_id) {
                    await interaction.reply({ ephemeral: true, content: "You cannot start a match that you did not initiate." });
                    return;
                }
                matchObject.start();
                updateMatch(matchObject);
                await interaction.update({ content: matchObject.toString(), components: [] });
            }
        }
        )
    };
    console.log("collectors are running on in all known guilds");
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


