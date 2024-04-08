require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');
const { data: addRoleCommand } = require('./commands.js');
const { clientId, guildId } = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const DEBOUNCE_TIME = 5000; // 5 seconds
let lastKnownContent = '';
const CONFIG_RELOAD_DEBOUNCE = 2000; // 2 second for config reload
let configReloadTimer;

class RoleManager {
    constructor(roleId, roleName, removalDependencies = []) {
        this.roleId = roleId;
        this.roleName = roleName;
        this.removalDependencies = removalDependencies;
    }

    checkAndApplyRoles(oldMember, newMember) {
        const key = `${this.roleId}-${newMember.id}`;
        const now = Date.now();
        const lastTime = lastProcessed.get(key) || 0;

        if (now - lastTime < DEBOUNCE_TIME) {
            return; // Skip processing if it's within the debounce period
        }

        const hasRoleBefore = oldMember.roles.cache.has(this.roleId);
        const shouldRemoveRole = this.removalDependencies.some(id => !newMember.roles.cache.has(id));

        if (hasRoleBefore && shouldRemoveRole) {
            newMember.roles.remove(this.roleId).catch(console.error);
        }
    }
}

let roles = [];  // This will hold the current roles configuration as RoleManager instances

function loadRoles(checkContent = false) {
    fs.readFile('roles.json', (err, data) => {
        if (err) {
            console.error('Error reading roles.json:', err);
            return;
        }
        const currentContent = data.toString();
        if (!checkContent || currentContent !== lastKnownContent) {
            lastKnownContent = currentContent; // Update the last known content
            const rolesData = JSON.parse(currentContent);
            roles = rolesData.map(role => new RoleManager(role.roleId, role.roleName, role.dependencies));
            console.log('Roles configuration reloaded successfully.');
        } else {
            console.log('No change in roles configuration.');
        }
    });
}

function debounceReloadConfig() {
    clearTimeout(configReloadTimer);
    configReloadTimer = setTimeout(() => {
        loadRoles(true); // Passing true to check content change
    }, CONFIG_RELOAD_DEBOUNCE);
}


fs.watch('roles.json', (eventType, filename) => {
    if (eventType === 'change') {
        console.log('Detected change in roles.json, scheduling reload...');
        debounceReloadConfig();
    }
});

loadRoles();
const setupCommandHandlers = require('./commandHandler');
const lastProcessed = new Map();

client.on('ready', async () => {
    console.log(`${client.user.tag} is now online!`);
    client.user.setActivity('Managing Roles', { type: 'PLAYING' });

    const guild = client.guilds.cache.get(guildId);
    if (guild) {
        await guild.commands.create(addRoleCommand.toJSON())
            .then(() => console.log('Command registered!'))
            .catch(console.error);
    } else {
        console.log('Guild not found. Cannot register commands!');
    }
    // Registering commands globally. For future updates.
    // client.application.commands.create(addRoleCommand.toJSON())
    //     .then(() => console.log('Global command registered!'))
    //     .catch(console.error);
});


client.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (!oldMember.roles.cache.equals(newMember.roles.cache)) {
        roles.forEach(role => role.checkAndApplyRoles(oldMember, newMember));
    }
});

client.login(process.env.TOKEN);
