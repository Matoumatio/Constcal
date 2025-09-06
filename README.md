# Constcal (WIP)
Automatically calls someone until they respond

## Features
- Automatically detects target user ID when used in DMs
- Configurable call duration and total duration limits
- Automatic cleanup of resources
- Built-in `/constcal` command for easy usage

## Installation
1. Clone this repository into your Vencord plugins directory
   ```bash
   git clone https://github.com/Matoumatio/Constcal.git ~/vencord/src/userplugins/Constcal
   ```
2. [Rebuild your Discord/Vencord]: https://docs.vencord.dev/installing/#building-vencord

## Usage
1. Open a DM with the target user
2. Type `/constcal start` to begin automatic calling
3. Type `/constcal stop` to stop the process

## Settings
- **Call Duration** : Time to wait between calls (in seconds, default : 30)
- **Total Duration** : Maximum time to keep calling (in seconds, default : 3600 (0 : unlimited))

## File Structure
```plaintext
src/userplugins/constcal/
├── index.ts          # Main plugin entry point
└── README.md         # Documentation
```
