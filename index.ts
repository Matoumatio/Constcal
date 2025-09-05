import definePlugin from "@utils/types";
import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { getCurrentChannel } from "@utils/discord";
import { sendBotMessage } from "@api/Commands";

// Types
interface ConstcalConfig {
    targetUserId: string;
    callDuration: number;
    totalDuration: number;
}

interface ConstcalState {
    isActive: boolean;
    currentCallId?: string;
    startTime: number;
    currentTargetId: string;
    timeoutId?: number;
}

// Find required Discord functions lazily
const { call } = findByPropsLazy("call");
const { selectVoiceChannel } = findByPropsLazy("selectVoiceChannel");

let state: ConstcalState = {
    isActive: false,
    startTime: 0,
    currentTargetId: "",
    timeoutId: undefined
};

const settings = definePluginSettings({
    callDuration: {
        type: OptionType.NUMBER,
        description: "Duration of each call (seconds)",
        default: 30
    },
    totalDuration: {
        type: OptionType.NUMBER, 
        description: "Total time to keep calling (seconds)",
        default: 3600
    }
});

async function initiateCall(channelId: string): Promise<boolean> {
    try {
        await call(channelId);
        return true;
    } catch (error) {
        console.error("Failed to initiate call:", error);
        return false;
    }
}

function stopCalling() {
    state.isActive = false;
    if (state.timeoutId) {
        clearTimeout(state.timeoutId);
        state.timeoutId = undefined;
    }
    // Try to leave any active call
    try {
        selectVoiceChannel(null);
    } catch (error) {
        console.error("Error leaving call:", error);
    }
}

async function startCallingLoop(channelId: string) {
    if (!state.isActive) return;
    
    // Check if total duration exceeded
    const elapsed = (Date.now() - state.startTime) / 1000;
    if (elapsed >= settings.store.totalDuration) {
        stopCalling();
        sendBotMessage(channelId, {
            content: "⏰ Total duration reached. Stopping Constcal."
        });
        return;
    }
    
    // Attempt to call
    const success = await initiateCall(channelId);
    if (!success) {
        sendBotMessage(channelId, {
            content: "❌ Failed to initiate call. Stopping Constcal."
        });
        stopCalling();
        return;
    }
    
    // Schedule next call attempt
    state.timeoutId = window.setTimeout(() => {
        startCallingLoop(channelId);
    }, settings.store.callDuration * 1000);
}

export default definePlugin({
    name: "Constcal", 
    description: "Automatically calls someone until they respond",
    authors: [{
        name: "Matoumatio",
        id: 756864470026027100n
    }],
    
    settings,
    
    commands: [{
        name: "constcal",
        description: "Start or stop automatic calling",
        options: [{
            name: "action",
            description: "Action to perform (start/stop)",
            type: 3, // STRING type
            required: true,
            choices: [{
                name: "start",
                value: "start"
            }, {
                name: "stop", 
                value: "stop"
            }]
        }],
        execute(args, ctx) {
            const action = args[0]?.value || args[0];
            const channel = getCurrentChannel();
            
            if (!channel) {
                return sendBotMessage(ctx.channel.id, {
                    content: "❌ No active channel found!"
                });
            }
            
            switch (action) {
                case "start":
                    // Check if it's a DM
                    if (channel.type !== 1) { // DM channel type
                        return sendBotMessage(ctx.channel.id, {
                            content: "❌ This command only works in DM channels!"
                        });
                    }
                    
                    if (state.isActive) {
                        return sendBotMessage(ctx.channel.id, {
                            content: "⚠️ Constcal is already running! Use `/constcal stop` to stop it."
                        });
                    }
                    
                    // Start the calling process
                    state.isActive = true;
                    state.startTime = Date.now();
                    state.currentTargetId = channel.id;
                    
                    sendBotMessage(ctx.channel.id, {
                        content: `🔄 Starting Constcal... Will call for ${settings.store.totalDuration}s with ${settings.store.callDuration}s intervals.`
                    });
                    
                    // Start calling loop with a small delay
                    setTimeout(() => startCallingLoop(channel.id), 1000);
                    break;
                    
                case "stop":
                    if (!state.isActive) {
                        return sendBotMessage(ctx.channel.id, {
                            content: "⚠️ Constcal is not currently running."
                        });
                    }
                    
                    stopCalling();
                    return sendBotMessage(ctx.channel.id, {
                        content: "⏹️ Constcal stopped successfully."
                    });
                    
                default:
                    return sendBotMessage(ctx.channel.id, {
                        content: "❌ Invalid action. Use `start` or `stop`."
                    });
            }
        }
    }],
    
    start() {
        console.log("Constcal plugin started");
    },
    
    stop() {
        console.log("Constcal plugin stopped");
        stopCalling();
    }
});
