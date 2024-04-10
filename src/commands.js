/**
 * This module defines the command configurations for a Discord bot using the SlashCommandBuilder.
 * It sets up the necessary details for each command, including name, description, options, and
 * permissions, and links each command to its respective handling function.
 *
 * Command Definitions:
 * - addRoleCommand: Configures the 'addrole' command to add new roles to the server.
 *   Options:
 *     - roleid: The unique identifier of the role to be added.
 *     - rolename: The display name of the role.
 *     - dependencies: A list of other role IDs that this role depends on, formatted as a space-separated string.
 *   Permissions:
 *     - Only administrators can execute this command.
 *   Handler:
 *     - Linked to the 'handleAddRole' function which contains the logic to add roles based on the command interaction.
 *
 * - removeRoleCommand: Configures the 'removerole' command to remove existing roles from the server.
 *   Options:
 *     - roleid: The unique identifier of the role to be removed.
 *     - rolename: The display name of the role to be removed.
 *     - dependencies: A list of other role IDs that need to be verified before removal, formatted as a space-separated string.
 *   Permissions:
 *     - Only administrators can execute this command.
 *   Handler:
 *     - Linked to the 'handleRemoveRole' function which contains the logic to remove roles based on the command interaction.
 *
 * This structure ensures that each command is clearly defined and properly secured with the appropriate permissions,
 * facilitating ease of command management and execution within Discord.
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { handle: handleAddRole } = require('./commands/addRoleCommand');
const { handle: handleRemoveRole } = require('./commands/removeRoleCommand');

const addRoleCommand = {
    data: new SlashCommandBuilder()
        .setName('addrole')
        .setDescription('Add a role to the server')
        .addStringOption(option =>
            option.setName('roleid')
                .setDescription('The ID of the role')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('rolename')
                .setDescription('The name of the role')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('dependencies')
                .setDescription('Space-separated list of dependency role IDs')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    handle: handleAddRole
};

const removeRoleCommand = {
    data: new SlashCommandBuilder()
        .setName('removerole')
        .setDescription('Remove a role from the server')
        .addStringOption(option =>
            option.setName('roleid')
                .setDescription('The ID of the role to remove')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('rolename')
                .setDescription('The name of the role to remove')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('dependencies')
                .setDescription('Space-separated list of dependency role IDs to verify')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    handle: handleRemoveRole
};

module.exports = [addRoleCommand, removeRoleCommand];
