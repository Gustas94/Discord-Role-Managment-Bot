const { SlashCommandBuilder } = require('@discordjs/builders');

const addRoleCommand = new SlashCommandBuilder()
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
        .setRequired(true));

module.exports = {
    data: addRoleCommand
};
