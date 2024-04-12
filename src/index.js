// 1. Imports and Configurations
require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');
const commands = require('./commands.js');
const setupCommandHandlers = require('./commandHandler');
const path = require('path');
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
 * - DEBOUNCE_TIME (number): The amount of time, in milliseconds (1500ms), designated to delay processing repeated events
 *   or actions. This delay helps prevent excessive operations or rate limiting, particularly useful for debouncing
 *   role update checks to ensure efficient processing under frequent change conditions.
 *
 * - CONFIG_RELOAD_DEBOUNCE (number): The amount of time, in milliseconds (2000ms), set to delay the reloading of 
 *   configurations to avoid excessive reloads during rapid, consecutive file changes.
 * 
 * - lastProcessed (Map): A map to keep track of the last processed times for guild members, used to debounce events like
 *   guildMemberUpdate. This helps in preventing the same member from being processed multiple times within a brief interval.
 *
 * - roleUpdateLastProcessed (Map): A map, similar to lastProcessed, but specifically tracks the last update times for role changes.
 *   This management helps in debouncing the role updates efficiently.
 * 
 * - updateQueue (Array): A queue that holds tasks for role removal to manage and pace API requests according to Discord's rate limits,
 *   ensuring that bulk role changes do not exceed permissible request rates.
 * 
 * - isProcessingQueue (boolean): A flag to indicate whether the update queue is currently being processed. This ensures that the
 *   queue operation runs sequentially and prevents multiple concurrent processes from initiating.
 * 
 * - lastKnownContent (object): A map that stores the last known content of the roles configuration files for each guild.
 *   It's checked against the current file content to determine if a reload of role configurations is necessary.
 * 
 * - configReloadTimer (object): A map of timers, each holding a reference to the current timeout for config reloading for a guild.
 *   This structure allows for the cancellation of the reload timer if a new change is detected before the timer expires.
 * 
 * - roles (object): An object that holds the current configurations of roles as instances of the RoleManager class for each guild.
 *   This object is updated whenever the roles configuration file for a guild is reloaded.
 *
 */
const DEBOUNCE_TIME = 1500; // 1.5 seconds
const CONFIG_RELOAD_DEBOUNCE = 2000; // 2 seconds for config reload
const lastProcessed = new Map();
const roleUpdateLastProcessed = new Map();
const updateQueue = [];
let isProcessingQueue = false;
let lastKnownContent = {};
let configReloadTimer = {};
let roles = {};
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
 * Loads and updates the roles configuration from a guild-specific JSON file.
 * This function is tailored to manage role configurations for individual guilds by reading from
 * separate files named 'roles_{guildId}.json'. It ensures the bot's role management settings are
 * consistent with the latest configurations.
 *
 * Parameters:
 * - guildId (string): The unique identifier for the guild whose roles configuration is being loaded.
 * - checkContent (boolean): Indicates whether to check for updates in the guild-specific roles file before reloading.
 *   When set to true, the function reloads roles only if there have been changes to the file content since
 *   the last known state.
 *
 * Process:
 * 1. Constructs the path to the guild-specific roles file and checks for its existence.
 *   If the file does not exist, logs a message and exits without changing configurations.
 * 2. Reads the file asynchronously. If an error occurs (e.g., file not found or inaccessible),
 *   logs the error and returns early without modifying the current role configurations.
 * 3. Converts the file data from Buffer to string format and checks if the content has changed from the
 *   last known content (if checkContent is true). This check helps prevent unnecessary reprocessing of role data,
 *   optimizing performance.
 * 4. If the content is new or checkContent is false, parses the JSON string into an array of role
 *   objects and updates the roles configuration for the guild by transforming these into instances of RoleManager.
 * 5. Logs the outcome of the reload operation; if roles are reloaded, it confirms successful reloading and updates,
 *   otherwise, it notes that there was no change in the configuration.
 *
 * This function supports efficient and dynamic role management, enabling the bot to adapt to configuration
 * changes without needing a restart and maintaining accurate role configurations across multiple guilds.
 */
function loadRoles(guildId, checkContent = false) {
    const rolesFilePath = path.join(__dirname, '../roles', `roles_${guildId}.json`);
    if (!fs.existsSync(rolesFilePath)) {
        console.log(`Roles file for guild ${guildId} does not exist.`);
        return;
    }

    fs.readFile(rolesFilePath, (err, data) => {
        if (err) {
            console.error(`Error reading ${rolesFilePath}:`, err);
            return;
        }
        const currentContent = data.toString();
        if (!checkContent || currentContent !== lastKnownContent[guildId]) {
            lastKnownContent[guildId] = currentContent;
            roles[guildId] = JSON.parse(currentContent).map(role => new RoleManager(role.roleId, role.roleName, role.dependencies));
            console.log(`Roles configuration for guild ${guildId} reloaded successfully.`);
        }
    });
}


/**
 * Debounces the reloading of role configurations for a specific guild to prevent frequent reloads in quick succession.
 * This function ensures that reloading of the roles is delayed and only happens once per specified interval,
 * which helps to avoid unnecessary processing and potential performance issues during rapid consecutive changes
 * to the guild-specific roles configuration file.
 *
 * Parameters:
 * - guildId (string): The unique identifier for the guild whose roles configuration is being managed.
 *
 * Uses `setTimeout` to delay the role reloading process by a duration defined in `CONFIG_RELOAD_DEBOUNCE`.
 * If called multiple times within the debounce interval, only the last call will trigger the reloading after
 * the interval expires, as previous timeouts are cleared with `clearTimeout`. This mechanism ensures that the
 * role configurations are reloaded effectively without overwhelming the server with frequent file read operations.
 */
function debounceReloadConfig(guildId) {
    if (configReloadTimer[guildId]) {
        clearTimeout(configReloadTimer[guildId]);
    }
    configReloadTimer[guildId] = setTimeout(() => loadRoles(guildId, true), CONFIG_RELOAD_DEBOUNCE);
}


function setupRoleFileWatcher(guildId) {
    const rolesFilePath = path.join(__dirname, '../roles', `roles_${guildId}.json`);

    if (fs.existsSync(rolesFilePath)) {
        fs.watch(rolesFilePath, (eventType, filename) => {
            if (eventType === 'change') {
                console.log(`Detected change in ${rolesFilePath}, scheduling reload...`);
                debounceReloadConfig(guildId);
            }
        });
    } else {
        console.log(`Guild: ${guildId} doesn't have any roles setup. No watcher will be set for this guild.`);
    }
}

/**
 * Processes queued role removal tasks sequentially to ensure efficient management of API requests within Discord's rate limits.
 * This function is designed to handle role removal operations by queuing them and processing sequentially,
 * preventing the bot from exceeding Discord's API rate limits and ensuring reliable operation under varying loads.
 *
 * Operation:
 * 1. Checks if the queue is currently being processed. If so, it exits to avoid concurrent executions that could lead to errors or rate limit issues.
 * 2. Sets the `isProcessingQueue` flag to true, indicating that the processing of the queue has started and is active.
 * 3. Continuously processes the next task in the queue using a recursive approach until the queue is empty:
 *    a. If the queue is empty, resets the `isProcessingQueue` to false and exits, signaling that all pending tasks have been handled.
 *    b. Dequeues the next task, which includes a guild member and the roles to be removed from that member.
 *    c. Attempts to remove the specified roles from the member, and logs the outcome:
 *       - If successful, logs the roles removed and the member's display name, then sets a delay before the next execution to adhere to rate limits.
 *       - If an error occurs, logs the error and still proceeds to set a delay for the next task, ensuring that one failure does not halt the queue processing.
 *    d. Uses `setTimeout` to ensure that there is a delay (paced at an appropriate rate, such as 20 operations per second) before processing the next task in the queue.
 *
 * This method ensures that role updates are managed efficiently, maintaining consistent performance and adherence to Discord's operational constraints.
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
                setTimeout(processNext, 1000 / 50);
            })
            .catch(error => {
                console.error('Failed to remove roles:', error);
                setTimeout(processNext, 1000 / 50);
            });
    })();
}

// 5. Event Handlers

/**
 * Handles the 'ready' event, which is triggered when the client successfully connects to the Discord API.
 * This event signifies that the bot is fully operational and ready to interact with users, having completed
 * all necessary initialization steps.
 *
 * Actions performed on bot startup:
 * 1. Logs the bot's operational status, displaying its username and readiness.
 * 2. Sets the bot's activity to "Managing Roles", making its function visible to users on Discord.
 * 3. Ensures that all role file watchers are properly set up for each guild available in the cache:
 *    - For each guild, the bot sets up a file watcher to monitor changes in role configurations, logging the setup.
 * 4. Registers all commands for each guild:
 *    - Attempts to register configured commands for each guild by converting command data into the appropriate JSON format.
 *    - Logs a success message for each guild where commands are successfully registered.
 *    - In cases where a guild cannot be accessed (e.g., if the bot has been removed or the ID is incorrect),
 *      logs an error message indicating that the commands could not be registered.
 *
 * This thorough initialization process ensures that the bot is equipped with the necessary configurations and
 * commands across all intended servers, providing consistent functionality and immediate response capabilities
 * from the moment it goes online.
 */
client.once('ready', async () => {
    console.log(`${client.user.tag} is now online!`);
    client.user.setActivity('Managing Roles', { type: 'PLAYING' });

    client.guilds.cache.forEach(guild => {
        console.log(`Setting up role file watcher for ${guild.name} with ID ${guild.id}.`);
        setupRoleFileWatcher(guild.id);
    });

    for (const guild of client.guilds.cache.values()) {
        try {
            await guild.commands.set(commands.map(cmd => cmd.data.toJSON()));
            console.log(`Commands registered in ${guild.name}!`);
        } catch (error) {
            console.error(`Error registering commands in ${guild.name}:`, error);
        }
    }
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
    if (now - (roleUpdateLastProcessed.get(memberId) || 0) < DEBOUNCE_TIME) {
        return;
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