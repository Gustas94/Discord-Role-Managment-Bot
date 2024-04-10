/**
 * This module is responsible for registering and handling interactions for commands in a Discord bot.
 * It integrates commands defined elsewhere and sets up an event listener on the client to manage
 * command interactions when they occur.
 *
 * Import:
 * - addRoleCommand: Imports the specific command handler for 'addrole' from the 'commands/addRoleCommand' module.
 *   This handler is responsible for the logic that executes when the 'addrole' command is used in Discord.
 *
 * Functionality:
 * - The module exports a function that accepts a 'client' parameter (the Discord client instance).
 * - Inside this function, an event listener is attached to the 'client' for 'interactionCreate', which is
 *   triggered whenever a user interacts with the bot using slash commands or other interactive components.
 * - The event listener checks if the interaction is a command. If not, it ignores the interaction.
 * - For command interactions, it switches based on the 'commandName' to determine which command was invoked.
 *   Currently, it only handles the 'addrole' command.
 * - When the 'addrole' command is detected, it calls the handle method on the 'addRoleCommand' imported earlier,
 *   passing the 'interaction' object to it. This method contains the specific implementation logic for
 *   adding a role as defined in the 'addRoleCommand' module.
 *
 * By modularizing command handling in this way, the bot's architecture remains clean and scalable, allowing
 * for easy addition of more commands by simply extending the switch statement and importing additional command handlers.
 */
const addRoleCommand = require('./commands/addRoleCommand');

module.exports = (client) => {
    client.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) return;

        switch (interaction.commandName) {
            case 'addrole':
                await addRoleCommand.handle(interaction);
                break;
        }
    });
};
