const fs = require('fs');

/**
 * Handles the 'addrole' command interaction for a Discord bot.
 * This function processes the 'addrole' command by extracting the necessary details from the interaction,
 * updating the roles configuration, and providing feedback to the user.
 *
 * Function Operation:
 * 1. Retrieves role-related details from the interaction options:
 *    - roleId: The unique identifier for the role to be added.
 *    - roleName: The display name for the role.
 *    - dependencies: A list of other role IDs that this role depends on, expected as a comma-separated string
 *      and then split into an array.
 * 2. Loads the current roles configuration from a 'roles.json' file, parsing the JSON data into an object.
 * 3. Appends the new role with its details to the roles configuration array.
 * 4. Writes the updated roles configuration back to the 'roles.json' file, formatting the JSON for readability.
 * 5. Sends a confirmation reply to the interaction initiator in the Discord channel, detailing the added role
 *    and its dependencies.
 * 6. Catches and handles any errors that occur during the process, logging the error and sending an error message
 *    back to the user through the Discord interaction to indicate that the operation failed.
 *
 * This handler ensures that role configurations are dynamically manageable via Discord interactions, enhancing
 * the bot's functionality for server administration tasks.
 */
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
