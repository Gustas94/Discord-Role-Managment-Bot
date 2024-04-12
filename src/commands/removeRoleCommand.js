/**
 * Handles the 'removerole' command within the Discord bot. This function is invoked when a user executes
 * the 'removerole' command to delete a specific role from a guild's role configuration. It ensures
 * that the role to be removed matches exactly by both role ID and its listed dependencies.
 *
 * Process:
 * 1. Extracts role-related details from the command interaction:
 *    - guildId: The ID of the guild where the command was executed.
 *    - roleId: The unique identifier of the role to remove.
 *    - roleName: The visible name of the role.
 *    - dependencies: Comma-separated role IDs upon which the target role depends, parsed into an array.
 *
 * 2. Defines the path to the guild-specific roles file (e.g., 'roles_guildId.json') and checks its existence.
 *
 * 3. Reads the current role configuration from the guild-specific JSON file:
 *    - Parses the file into an array of role objects, where each object includes role ID, name, and dependencies.
 *
 * 4. Filters out the role to remove by checking for an exact match of roleId and dependencies:
 *    - Employs a helper function `arraysMatch` to confirm if dependency arrays are identical.
 *    - Removes the role entry if it matches the given criteria.
 *    - If no role matches the criteria, informs the user that no matching role was found.
 *
 * 5. Writes the revised role configuration back to the guild-specific file:
 *    - Serializes the updated array to JSON and writes it back to the file.
 *
 * 6. Responds to the command interaction:
 *    - Sends a success message upon role removal, or an error message if the role could not be found.
 *    - On failure (e.g., file read/write errors, logic errors), logs the issue and sends an ephemeral message to the user.
 *
 * This function ensures precise role management by strictly verifying both the role identifiers and their dependencies,
 * facilitating accurate updates directly via user commands in a guild-specific context.
 */


const fs = require('fs');
const path = require('path');

async function handle(interaction) {
    try {
        const guildId = interaction.guild.id; // Get the guild ID from the interaction
        const roleId = interaction.options.getString('roleid');
        const roleName = interaction.options.getString('rolename');
        const dependencies = interaction.options.getString('dependencies').split(',');

        // Construct the path to the roles file for the specific guild
        const rolesFilePath = path.join(__dirname, '../../roles', `roles_${guildId}.json`);

        // Ensure the roles file exists for the guild
        if (!fs.existsSync(rolesFilePath)) {
            await interaction.reply({ content: 'No roles file exists for this guild.', ephemeral: true });
            return;
        }

        // Load the existing roles data from the guild-specific file
        const rolesData = JSON.parse(fs.readFileSync(rolesFilePath, 'utf8'));
        const initialLength = rolesData.length;

        // Filter out the specific role entry with matching dependencies
        const updatedRolesData = rolesData.filter(role => {
            return !(role.roleId === roleId && arraysMatch(role.dependencies, dependencies));
        });

        if (updatedRolesData.length === initialLength) {
            // No role was removed, indicate failure to find the specified role
            await interaction.reply({ content: `No role with ID ${roleId} and the specified dependencies was found.`, ephemeral: true });
            return;
        }

        // Save the updated roles data back to the specific guild file
        fs.writeFileSync(rolesFilePath, JSON.stringify(updatedRolesData, null, 4));

        // Notify the interaction of successful role removal
        await interaction.reply(`Role ${roleName} with ID ${roleId} and dependencies ${dependencies.join(', ')} has been successfully removed.`);
    } catch (error) {
        console.error('Error in removeRoleCommand:', error);
        await interaction.reply({ content: 'Failed to remove role due to an internal error.', ephemeral: true });
    }
}

// Helper function to compare two arrays for equality
function arraysMatch(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
}

module.exports = { handle };
