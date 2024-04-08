// commands.js
const { SlashCommandBuilder } = require('@discordjs/builders');

const addRoleCommand = new SlashCommandBuilder()
    .setName('addrole')
    .setDescription('Add a role to the server')
    .addStringOption(option => option.setName('roleid').setDescription('The ID of the role').setRequired(true))
    .addStringOption(option => option.setName('rolename').setDescription('The name of the role').setRequired(true))
    .addStringOption(option => option.setName('dependencies').setDescription('Space-separated list of dependency role IDs').setRequired(true));

const removeAllRolesCommand = new SlashCommandBuilder()
    .setName('removeallroles')
    .setDescription('Remove a specific role from all users')
    .addStringOption(option => option.setName('roleid').setDescription('The ID of the role to remove from all users').setRequired(true));

module.exports = [addRoleCommand, removeAllRolesCommand]; 