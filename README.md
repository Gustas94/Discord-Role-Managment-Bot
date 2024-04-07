
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
   npm install
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
      }
  ]
  ```
  Replace `roleId` and `dependencies` with actual role IDs from your Discord server.

## Usage

To start the bot, run:
```bash
node .
```

The bot will automatically connect to Discord and start monitoring and managing roles based on the configurations in `roles.json`.

## Commands

Currently, the bot automatically handles role management based on server events. Future versions may include direct command interactions for additional functionalities.

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

Your Name - [Gustas](https://github.com/Gustas94)

Project Link: [https://github.com/Gustas94/DiscordBot](https://github.com/Gustas94/DiscordBot)

---
