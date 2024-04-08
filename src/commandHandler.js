// commandHandler.js
const addRoleCommand = require('./commands/addRoleCommand');
const removeAllRolesCommand = require('./commands/removeAllRolesCommand'); // Import the new command

module.exports = (client) => {
    client.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) return;

        switch (interaction.commandName) {
            case 'addrole':
                await addRoleCommand.handle(interaction);
                break;
            case 'removeallroles':
                await removeAllRolesCommand.handle(interaction);
                break;
        }
    });
};
