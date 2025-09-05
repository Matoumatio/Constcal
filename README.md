# Constcal
Automatically calls someone until they respond

## Features
- Automatically detects target user ID when used in DMs
- Configurable call duration and total duration limits
- Automatic cleanup of resources
- Built-in `/constcal` command for easy usage

## Installation
1. Clone this repository into your Vencord plugins directory:
   ```bash
   git clone https://github.com/Matoumatio/Constcal.git ~/vencord/src/userplugins/constcal
   ```
2. Restart Discord/Vencord

## Usage
1. Open a DM with the target user
2. Type `/constcal start` to begin automatic calling
3. Type `/constcal stop` to halt the process

## Settings
- **Call Duration**: Time to wait between calls (in seconds, default: 30)
- **Total Duration**: Maximum time to keep calling (in seconds, default: 3600)

## File Structure
```plaintext
src/userplugins/constcal/
├── index.ts          # Main plugin entry point
├── types.ts          # Type definitions
└── README.md         # Documentation
```
