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
 *    - guildId: The ID of the guild where the command was executed, used for role configuration.
 *
 * 2. Defines the path for the guild-specific roles configuration file (e.g., 'roles_guildId.json').
 *
 * 3. Checks if the roles configuration file exists for the guild, reads it if available, or initializes
 *    an empty roles array if the file does not exist.
 *
 * 4. Adds the new role with its details to the roles array.
 *
 * 5. Writes the updated roles configuration back to the guild-specific file using formatted JSON.
 *
 * 6. Responds to the command interaction with a confirmation message detailing the added role and its dependencies.
 *
 * 7. Handles errors that might occur during the process, logging errors and sending an ephemeral message back
 *    to the user indicating the failure.
 *
 * This method ensures that roles are managed dynamically per guild, facilitating efficient server administration
 * directly through user interactions and allowing for scalable role management across different servers.
 */
const fs = require('fs');
const path = require('path');

async function handle(interaction) {
    try {
        const guildId = interaction.guild.id;  // Get the guild ID from the interaction
        const roleId = interaction.options.getString('roleid');
        const roleName = interaction.options.getString('rolename');
        const dependencies = interaction.options.getString('dependencies').split(',');

        const rolesFilePath = path.join(__dirname, '../../roles', `roles_${guildId}.json`); // Define the file path with guildId

        // Initialize roles data array
        let rolesData = [];

        // Check if the file exists and read from it if it does
        if (fs.existsSync(rolesFilePath)) {
            rolesData = JSON.parse(fs.readFileSync(rolesFilePath, 'utf8'));
        }

        // Add the new role
        rolesData.push({ roleId, roleName, dependencies });

        // Save the updated roles data back to the specific guild file
        fs.writeFileSync(rolesFilePath, JSON.stringify(rolesData, null, 4));

        // Reply to the interaction
        await interaction.reply(`Role ${roleName} added with ID ${roleId} and dependencies ${dependencies.join(', ')}`);
    } catch (error) {
        console.error('Error in addRoleCommand:', error);
        await interaction.reply({ content: 'Failed to add role due to an internal error.', ephemeral: true });
    }
}

module.exports = { handle };

