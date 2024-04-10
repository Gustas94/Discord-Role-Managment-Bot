/**
 * This module defines slash commands for use in a Discord bot, utilizing the `@discordjs/builders` package to construct the commands.
 * Currently, it includes a single command for adding a role to the server.
 *
 * Command: addrole
 * - Purpose: Allows administrators or authorized users to add a new role to the Discord server with specific dependencies.
 * - Options:
 *   - roleid: A required string option that takes the unique identifier (ID) of the role to be added. This ID is used to
 *     uniquely define the role within the server.
 *   - rolename: A required string option that specifies the name of the role. This is the name that will be visible to
 *     users and used in server settings.
 *   - dependencies: A required string option that accepts a space-separated list of role IDs. These IDs define other roles
 *     that the new role depends on. This can be used to set up hierarchical or conditional role structures within the server.
 *
 * The command is structured using the `SlashCommandBuilder` class, which provides a fluent API to define command details and options.
 * This command can be registered with a Discord server using the bot's command handling setup, allowing users to interact with it
 * through the Discord interface.
 *
 * The module exports an array of commands, which currently contains only the 'addrole' command. This array can be imported
 * in other parts of the bot application for registration and handling.
 */
const { SlashCommandBuilder } = require('@discordjs/builders');

const addRoleCommand = new SlashCommandBuilder()
    .setName('addrole')
    .setDescription('Add a role to the server')
    .addStringOption(option => option.setName('roleid').setDescription('The ID of the role').setRequired(true))
    .addStringOption(option => option.setName('rolename').setDescription('The name of the role').setRequired(true))
    .addStringOption(option => option.setName('dependencies').setDescription('Space-separated list of dependency role IDs').setRequired(true));

module.exports = [addRoleCommand]; 