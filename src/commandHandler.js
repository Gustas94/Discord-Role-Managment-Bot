// commandHandler.js
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
