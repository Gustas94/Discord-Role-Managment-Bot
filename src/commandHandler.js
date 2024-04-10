/**
 * This module handles registering and managing command interactions for a Discord bot.
 * It coordinates command handling by linking command-specific handlers to interaction events.
 *
 * Imports:
 * - Commands module: Imports command handlers such as 'addRoleCommand' and 'removeRoleCommand'
 *   which are responsible for executing specific logic when their corresponding commands
 *   are triggered in Discord.
 *
 * Overview:
 * - Exports a function that attaches to a Discord client instance.
 * - An event listener for 'interactionCreate' is added to the client, which triggers whenever
 *   a user interacts with the bot using slash commands or other interactive components.
 * - Upon detecting a command interaction, the listener identifies which command was invoked
 *   by comparing the 'commandName' with registered commands.
 *   - For 'addrole', the 'addRoleCommand' handler is executed, which processes role addition.
 *   - For 'removerole', the 'removeRoleCommand' handler is executed, which handles role removal.
 *
 * Advantages:
 * - This modular approach ensures a clean and scalable architecture, facilitating easy management
 *   and extension of command functionalities.
 * - Adding new commands is straightforward, involving only the addition of new handlers and
 *   extending the command identification logic.
 */
const commands = require('./commands');

module.exports = (client) => {
    client.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) return;

        const command = commands.find(c => c.data.name === interaction.commandName);
        if (command) {
            await command.handle(interaction);
        }
    });
};


