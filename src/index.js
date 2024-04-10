// 1. Imports and Configurations
require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');
const commands = require('./commands.js');
const setupCommandHandlers = require('./commandHandler');
// Load configurations for all servers
const config = JSON.parse(fs.readFileSync('config.json', 'utf8')).servers;

// 2. Constants and Global Variables
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const DEBOUNCE_TIME = 1500; // 1.5 seconds
const CONFIG_RELOAD_DEBOUNCE = 2000; // 2 seconds for config reload
let lastKnownContent = '';
let configReloadTimer;
const lastProcessed = new Map();
const roleUpdateLastProcessed = new Map();
let roles = [];  // Holds the current roles configuration as RoleManager instances

// 3. Class Definitions
class RoleManager {
    constructor(roleId, roleName, dependencies = []) {
        this.roleId = roleId;
        this.roleName = roleName;
        this.removalDependencies = dependencies;
    }

    checkRemovalNeeded(oldMember, newMember) {
        const hasRoleBefore = oldMember.roles.cache.has(this.roleId);
        const shouldRemoveRole = this.removalDependencies.some(id => !newMember.roles.cache.has(id));
        return hasRoleBefore && shouldRemoveRole;
    }
}

// 4. Utility Functions
function loadRoles(checkContent = false) {
    fs.readFile('roles.json', (err, data) => {
        if (err) {
            console.error('Error reading roles.json:', err);
            return;
        }
        const currentContent = data.toString();
        if (!checkContent || currentContent !== lastKnownContent) {
            lastKnownContent = currentContent;
            roles = JSON.parse(currentContent).map(role => new RoleManager(role.roleId, role.roleName, role.dependencies));
            console.log('Roles configuration reloaded successfully.');
        } else {
            console.log('No change in roles configuration.');
        }
    });
}

function debounceReloadConfig() {
    clearTimeout(configReloadTimer);
    configReloadTimer = setTimeout(() => loadRoles(true), CONFIG_RELOAD_DEBOUNCE);
}

fs.watch('roles.json', (eventType, filename) => {
    if (eventType === 'change') {
        console.log('Detected change in roles.json, scheduling reload...');
        debounceReloadConfig();
    }
});

// 5. Event Handlers
client.on('ready', async () => {
    console.log(`${client.user.tag} is now online!`);
    client.user.setActivity('Managing Roles', { type: 'PLAYING' });
    config.forEach(serverConfig => {
        const guild = client.guilds.cache.get(serverConfig.guildId);
        if (guild) {
            commands.forEach(async (command) => {
                try {
                    await guild.commands.create(command.toJSON());
                    console.log(`Command ${command.name} registered in ${guild.name}!`);
                } catch (error) {
                    console.error(error);
                }
            });
        } else {
            console.log('Guild not found for ID:', serverConfig.guildId);
        }
    });
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const memberId = newMember.id;
    const now = Date.now();
    const lastTime = roleUpdateLastProcessed.get(memberId) || 0;

    if (now - lastTime < DEBOUNCE_TIME) {
        return; // Skip processing if it's within the debounce period
    }
    roleUpdateLastProcessed.set(memberId, now);

    const rolesToRemove = roles.filter(role => role.checkRemovalNeeded(oldMember, newMember)).map(role => role.roleId);
    if (rolesToRemove.length > 0) {
        try {
            await newMember.roles.remove(rolesToRemove);
            console.log(`Removed roles: ${rolesToRemove.join(', ')} from ${newMember.displayName}`);
        } catch (error) {
            console.error('Failed to remove roles:', error);
        }
    }
});

// 6. Initialization
loadRoles();
setupCommandHandlers(client);
client.login(process.env.TOKEN);
