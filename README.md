
---

# Discord Role Manager Bot

This Discord bot automatically manages roles within servers based on predefined dependencies. It listens for role changes and adjusts user roles accordingly to ensure that all role assignments follow the rules set in the configuration.

## Features

- **Dynamic Role Management**: Automatically removes roles based on the dependencies specified in `roles.json`.
- **Real-time Configuration**: Monitors changes in role configuration and applies updates in real-time without needing to restart the bot.
- **Secure Handling**: Uses environment variables to securely manage sensitive information like the Discord bot token.

## Prerequisites

Before you begin, ensure you have the following:

- [Node.js](https://nodejs.org/) installed (version v20.x or newer recommended).
- A Discord bot token. Follow the steps [here](https://discord.com/developers/applications) to create a bot and obtain your token.

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Gustas94/DiscordBot.git
   ```

2. **Install dependencies**:
   ```bash
   npm install discord.js
   ```

3. **Set up the environment variables**:
   Create a `.env` file in the root directory and add your Discord bot token:
   ```plaintext
   TOKEN=your_discord_bot_token_here
   ```

## Configuration

- **roles.json**: This file contains the role configurations. Format the file as follows:
  ```json
  [
      {
          "roleId": "123456789012345678",
          "roleName": "RoleName1",
          "dependencies": ["987654321098765432"]
      },
      {
          "roleId": "234567890123456789",
          "roleName": "RoleName2",
          "dependencies": ["876543210987654321"]
      },
      {
          "roleId": "1226506678481064037",
          "roleName": "RoleName3",
          "dependencies": ["123456789012345678 234567890123456789"]
      }
  ]
  ```
  Replace `roleId` and `dependencies` with actual role IDs from your Discord server. The `roleName` can be any name you want.

## Usage

To start the bot, run:
```bash
npm start
```

The bot will automatically connect to Discord and start monitoring and managing roles based on the configurations in `roles.json`.

## Commands

Currently, the bot automatically handles role management based on server events. Additionally, the bot supports a command to manually add roles to the configuration file.

### Add Role Command
- **Command**: `/addrole`
- **Usage**: `/addrole roleid: [roleid] rolename: [rolename] dependencies: [dependency ID]`
-  **Description**: This command allows administrators to add a new role configuration directly through Discord. Specify the role ID, role name, and any role dependencies separated by spaces. Dependencies should be entered as role IDs.

#### Example
```bash
/addrole roleid: 123456789012345678 rolename: Moderator dependencies: 987654321098765432
```
This command would add a new role with ID `123456789012345678`, named "Moderator", with a dependency on the role with ID `987654321098765432`.

**Note**: This command is intended for use by administrators only. Ensure you have the appropriate permissions before attempting to use it.



## Contributing

Contributions to this project are welcome! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch: `git checkout -b new-feature`
3. Make your changes and commit them: `git commit -am 'Add some feature'`
4. Push to the original branch: `git push origin your-branch`
5. Create the pull request.

Alternatively, see the GitHub documentation on [creating a pull request](https://help.github.com/articles/creating-a-pull-request/).

## License

Distribute under the MIT License. See `LICENSE` for more information.

## Contact

[Gustas](https://github.com/Gustas94)

Project Link: [https://github.com/Gustas94/DiscordBot](https://github.com/Gustas94/DiscordBot)

---
