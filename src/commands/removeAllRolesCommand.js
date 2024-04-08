const { Permissions } = require('discord.js');
const fs = require('fs');

async function handle(interaction) {
    if (!interaction.guild) {
        await interaction.reply({ content: 'This command can only be used within a server.', ephemeral: true });
        return;
    }

    const roleId = interaction.options.getString('roleid');
    const role = interaction.guild.roles.cache.get(roleId);

    if (!role) {
        await interaction.reply({ content: 'Role not found.', ephemeral: true });
        return;
    }

    try {
        const members = await interaction.guild.members.fetch();
        let count = 0; // Counter for members from whom the role is removed

        for (const member of members.values()) {
            if (member.roles.cache.has(roleId)) {
                await member.roles.remove(roleId);
                count++; // Increment count for each successful removal
            }
        }

        await interaction.reply(`Role ${role.name} removed from ${count} members.`);
    } catch (error) {
        console.error('Failed to remove roles:', error);
        await interaction.reply({ content: 'Failed to remove the role from all members.', ephemeral: true });
    }
}

module.exports = { handle };
