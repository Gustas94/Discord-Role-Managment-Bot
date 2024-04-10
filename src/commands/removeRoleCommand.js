/**
 * Handles the 'removerole' command within the Discord bot. This function is invoked when a user executes
 * the 'removerole' command to delete a specific role from the server's role configuration. It ensures
 * that the role to be removed matches exactly by both role ID and its listed dependencies.
 *
 * Process:
 * 1. Extracts role-related details from the command interaction:
 *    - roleId: The unique identifier of the role to remove.
 *    - roleName: The visible name of the role.
 *    - dependencies: Space-separated role IDs upon which the target role depends, parsed into an array.
 *
 * 2. Reads the current role configuration from a JSON file ('roles.json'):
 *    - Parses the file into an array of role objects, where each object includes role ID, name, and dependencies.
 *
 * 3. Filters out the role to remove by checking for an exact match of roleId and dependencies:
 *    - Employs a helper function `arraysMatch` to confirm if dependency arrays are identical.
 *    - Removes the role entry if it matches the given criteria.
 *
 * 4. Saves the revised role configuration back to 'roles.json':
 *    - Serializes the updated array to JSON and writes it back to the file.
 *
 * 5. Responds to the command interaction:
 *    - Sends a success message upon role removal.
 *    - On failure (e.g., file read/write errors, filtering logic errors), logs the issue and sends an ephemeral message to the user.
 *
 * This function ensures precise role management by strictly verifying both the role identifiers and their dependencies,
 * facilitating accurate updates directly via user commands.
 */

const fs = require('fs');

async function handle(interaction) {
    try {
        const roleId = interaction.options.getString('roleid');
        const roleName = interaction.options.getString('rolename');
        const dependencies = interaction.options.getString('dependencies').split(',');

        // Load the existing roles data
        const rolesData = JSON.parse(fs.readFileSync('roles.json', 'utf8'));

        // Filter out the specific role entry with matching dependencies
        const updatedRolesData = rolesData.filter(role => {
            return !(role.roleId === roleId && arraysMatch(role.dependencies, dependencies));
        });

        // Save the updated roles data
        fs.writeFileSync('roles.json', JSON.stringify(updatedRolesData, null, 4));

        await interaction.reply(`Role ${roleName} with ID ${roleId} and dependencies ${dependencies.join(', ')} has been removed.`);
    } catch (error) {
        console.error('Error in removeRoleCommands:', error);
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
