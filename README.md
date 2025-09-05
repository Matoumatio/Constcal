# Constcal Plugin
Automatically calls a specified user until they respond.

## Features
- Automatically initiates voice calls to a target user
- Waits 30 seconds for response
- Leaves call if no response received
- Continues attempting calls until successful connection
- Built-in `/constcal` command for easy usage

## Installation
1. Clone this repository into your Vencord plugins directory:
   ```bash
   git clone https://github.com/yourusername/Constcal.git ~/vencord/src/userplugins/constcal
   ```
2. Restart Discord/Vencord
3. Configure the plugin settings to specify the target user ID

## Usage
1. Open Discord Settings
2. Navigate to Plugins > Constcal
3. Enter the target user's ID in the settings
4. Use `/constcal start` to begin automatic calling
5. Use `/constcal stop` to halt the process

## File Structure
```plaintext
src/userplugins/constcal/
├── index.ts          # Main plugin entry point
├── types.ts          # Type definitions
└── README.md         # Documentation
```
