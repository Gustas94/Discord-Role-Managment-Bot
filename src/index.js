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


/**
 * Constants and variables used for managing timing, configurations, and state within the bot:
 *
 * - DEBOUNCE_TIME (number): The amount of time, in milliseconds (1500ms), to delay processing repeated events
 *   or actions to avoid excessive operations or rate limiting. This is particularly used for debouncing role
 *   update checks to ensure efficient processing under frequent change conditions.
 *
 * - CONFIG_RELOAD_DEBOUNCE (number): The amount of time, in milliseconds (2000ms), to delay reloading the
 *   configuration to prevent excessive reloading during rapid consecutive file changes.
 *
 * - lastKnownContent (string): Stores the last known content of the roles configuration file ('roles.json').
 *   This is used to check against the current file content to determine whether a reload of role configurations
 *   is necessary.
 *
 * - configReloadTimer (Timeout): A variable to hold the reference to the current timeout for config reloading.
 *   This allows for cancellation of the reload timer if a new change is detected before the timer completes.
 *
 * - lastProcessed (Map): A map to keep track of the last processed times for guild members, used to debounce
 *   events like guildMemberUpdate. This prevents processing the same member multiple times within a short interval.
 *
 * - roleUpdateLastProcessed (Map): Similar to lastProcessed, but specifically tracks the last update times
 *   for role changes to manage and debounce the role updates efficiently.
 *
 * - roles (Array): An array that holds the current configuration of roles as instances of the RoleManager class.
 *   This array is updated when the roles configuration file is reloaded.
 * 
 * - updateQueue (Array): A queue that holds role removal tasks to manage and pace API requests according to
 *   Discord's rate limits, ensuring that bulk role changes do not exceed permissible request rates.
 *
 * - isProcessingQueue (boolean): A flag to indicate whether the update queue is currently being processed,
 *   ensuring that the queue operation runs sequentially and does not initiate multiple concurrent processes.
 */
const DEBOUNCE_TIME = 1500; // 1.5 seconds
const CONFIG_RELOAD_DEBOUNCE = 2000; // 2 seconds for config reload
let lastKnownContent = '';
let configReloadTimer;
const lastProcessed = new Map();
const roleUpdateLastProcessed = new Map();
let roles = [];
const updateQueue = [];
let isProcessingQueue = false;

// 3. Class Definitions


/**
 * Manages role dependencies and handles the logic for determining whether a role needs to be removed from a guild member.
 * This class provides the foundation for role-based operations within the Discord bot, ensuring that roles are managed
 * according to specific dependencies defined per role.
 *
 * Properties:
 * - roleId (string): The unique identifier for the role.
 * - roleName (string): The name of the role.
 * - removalDependencies (array): A list of role IDs that this role depends on. If any of these roles are removed from a member,
 *   then this role should also be considered for removal.
 *
 * Methods:
 * - checkRemovalNeeded(oldMember, newMember): Determines if a role should be removed based on changes in a member's roles.
 *   It checks if the role was present before and if any of the dependent roles have been removed in the latest update.
 *   Returns true if the role needs to be removed, otherwise false.
 */
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


/**
 * Loads and updates the roles configuration from a JSON file ('roles.json').
 * This function is designed to read role configurations and update the bot's role management settings
 * accordingly, ensuring that the bot's behavior aligns with the latest configurations.
 *
 * Parameters:
 * - checkContent (boolean): Indicates whether to check for updates in the 'roles.json' file before reloading. 
 *   When set to true, the function reloads roles only if there have been changes to the file content since 
 *   the last check.
 *
 * Process:
 * 1. Reads the 'roles.json' file asynchronously. If an error occurs during the read (e.g., file not found
 *    or inaccessible), it logs the error and returns early without changing the current role configurations.
 * 2. Converts the file data from Buffer to string format and checks if the content has changed from the
 *    last known content (if checkContent is true). This prevents unnecessary reprocessing of role data
 *    if there are no changes, optimizing performance.
 * 3. If the content is new or if checkContent is false, it parses the JSON string into an array of role
 *    objects and transforms these into instances of RoleManager. This update ensures that the bot's role
 *    management system uses the most current configurations.
 * 4. Logs the outcome of the reload operation; if roles are reloaded, it confirms successful reloading,
 *    otherwise, it notes that there was no change in configuration.
 *
 * This function supports efficient and dynamic role management, allowing the bot to adapt to configuration
 * changes without needing a restart.
 */
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


/**
 * Debounces the reloading of role configurations to prevent frequent reloads in quick succession.
 * This function ensures that reloading of the roles is delayed and only happens once per specified interval,
 * which avoids unnecessary processing and potential performance issues during rapid consecutive changes
 * to the roles configuration file.
 *
 * Uses `setTimeout` to delay the role reloading process by a duration defined in `CONFIG_RELOAD_DEBOUNCE`.
 * If called multiple times within the debounce interval, only the last call will trigger the reloading after
 * the interval expires, as previous timeouts are cleared with `clearTimeout`.
 */
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



/**
 * Processes queued role removal tasks sequentially to manage the rate of API requests made to Discord.
 * This function helps ensure that the bot adheres to Discord's rate limit constraints by controlling
 * how frequently roles are removed from members.
 *
 * Operation:
 * 1. Checks if the queue is already being processed. If so, it exits to avoid overlapping executions.
 * 2. Sets the `isProcessingQueue` flag to true, indicating that the queue processing has started.
 * 3. Defines an internal function `processNext` that handles the sequential processing of each task:
 *    a. Checks if the queue is empty. If yes, it resets `isProcessingQueue` to false and returns,
 *       indicating that all tasks have been processed.
 *    b. Dequeues the next task from `updateQueue` and attempts to remove the specified roles from the member.
 *    c. If the role removal is successful, it logs the action and uses `setTimeout` to delay the next call
 *       to `processNext`, pacing the requests to stay within the rate limit (20 requests per second, as 1000ms/50).
 *    d. If an error occurs during role removal, it logs the error and still proceeds to the next task after a delay,
 *       ensuring continued processing of remaining tasks.
 *
 * This structured and paced processing mitigates the risk of hitting rate limits when multiple role updates occur,
 * allowing the bot to manage roles efficiently even under high load conditions.
 */
function processQueue() {
    if (isProcessingQueue) return;
    isProcessingQueue = true;

    (function processNext() {
        if (updateQueue.length === 0) {
            isProcessingQueue = false;
            return;
        }

        const { member, rolesToRemove } = updateQueue.shift();
        member.roles.remove(rolesToRemove)
            .then(() => {
                console.log(`Removed roles: ${rolesToRemove.join(', ')} from ${member.displayName}`);
                setTimeout(processNext, 1000 / 50); // Process the next item at rate limit pace
            })
            .catch(error => {
                console.error('Failed to remove roles:', error);
                setTimeout(processNext, 1000 / 50);
            });
    })();
}


// 5. Event Handlers

/**
 * Handles the 'ready' event, which is triggered once the client is fully ready and connected to the Discord API.
 * This event ensures the bot starts its functionalities only after it has successfully logged in and set up.
 *
 * Actions performed on bot startup:
 * 1. Logs the bot's tag and online status to the console, indicating that the bot is operational.
 * 2. Sets the bot's activity to "Managing Roles", which is visible as the bot's status to all users on Discord.
 * 3. Iterates through each server configuration stored in the 'config' object. For each server:
 *    a. Attempts to fetch the guild (server) from the Discord API using the guild ID from the configuration.
 *    b. If the guild is found, it then iterates through a predefined list of commands:
 *       i. Each command is registered to the guild using the Discord API.
 *       ii. A success message is logged to the console for each command registered.
 *    c. If the guild is not found (e.g., the bot may have been removed from the server or the ID is incorrect),
 *       logs an error message indicating that the guild was not found.
 * 
 * This setup process ensures that the bot is correctly configured with necessary commands across all servers
 * it is intended to manage as soon as it becomes ready to operate. This is crucial for maintaining consistent
 * functionality and ensuring that all features are available immediately upon the bot's start.
 */
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


/**
 * Handles the 'guildMemberUpdate' event to manage role removals based on defined dependencies.
 * This listener is triggered whenever a guild member's properties, such as roles, are updated.
 *
 * The function implements debouncing and a queuing system to manage API requests efficiently:
 * 1. Checks if the update occurred within the debounced period since the last processed update for the same member.
 *    If so, it skips processing to ensure changes are stabilized.
 * 2. Updates the timestamp for the last processed event for this member.
 * 3. Determines which roles need to be removed based on the member's current roles and predefined dependencies.
 * 4. If any roles are identified for removal, they are added to a queue. The queue ensures roles are removed
 *    at a rate that complies with Discord's API rate limits.
 * 5. The queued removal operations are processed sequentially to ensure each request adheres to rate limiting constraints.
 *
 * This approach enhances bot performance by managing role updates efficiently and ensures compliance with Discord's rate limits.
 */
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
        updateQueue.push({ member: newMember, rolesToRemove });
        processQueue();
    }
});

// 6. Initialization
loadRoles();
setupCommandHandlers(client);
client.login(process.env.TOKEN);
