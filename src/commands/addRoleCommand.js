/**
 * Handles the 'addrole' command interaction within a Discord bot.
 * This function is triggered when a user executes the 'addrole' command. It manages the addition
 * of a new role to the server's role configuration and provides direct feedback to the user.
 *
 * Process:
 * 1. Extracts role-related details from the command interaction:
 *    - roleId: The unique identifier for the new role.
 *    - roleName: The name of the role as it appears to users.
 *    - dependencies: Comma-separated list of dependent role IDs, converted into an array.
 *
 * 2. Loads the existing role configuration from a JSON file ('roles.json'):
 *    - Parses the JSON into an array of role objects.
 *
 * 3. Adds the new role with its details to the roles array.
 *
 * 4. Saves the updated roles configuration back to the 'roles.json' file:
 *    - Writes the modified array back to the file using formatted JSON.
 *
 * 5. Responds to the command interaction:
 *    - Sends a confirmation message detailing the added role and its dependencies.
 *
 * 6. Handles errors that might occur during the process:
 *    - Logs errors and sends an ephemeral message back to the user indicating the failure.
 *
 * This method ensures that roles are easily manageable through Discord commands, facilitating
 * efficient server administration directly through user interactions.
 */
const fs = require('fs');
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
