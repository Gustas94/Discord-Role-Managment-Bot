const fs = require('fs');

// This function handles the 'addrole' command interaction.
async function handle(interaction) {
    try {
        const roleId = interaction.options.getString('roleid');
        const roleName = interaction.options.getString('rolename');
        const dependencies = interaction.options.getString('dependencies').split(',');

        // Load the existing roles data
        const rolesData = JSON.parse(fs.readFileSync('roles.json', 'utf8'));
        // Add the new role
        rolesData.push({ roleId, roleName, dependencies });
        // Save the updated roles data
        fs.writeFileSync('roles.json', JSON.stringify(rolesData, null, 4));

        await interaction.reply(`Role ${roleName} added with ID ${roleId} and dependencies ${dependencies.join(', ')}`);
    } catch (error) {
        console.error('Error in addRoleCommands:', error);
        await interaction.reply({ content: 'Failed to add role due to an internal error.', ephemeral: true });
    }
}

module.exports = { handle };
