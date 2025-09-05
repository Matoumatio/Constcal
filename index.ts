import definePlugin from "@utils/types";
import { findByProps } from "@webpack";
import { getCurrentChannel } from "@utils/discord";
import type { Message } from "discord-types/channel";

// Types
interface ConstcalConfig {
    targetUserId: string;
    callDuration: number;  // Duration of each call in seconds
    totalDuration: number; // Total time to keep calling in seconds
}

interface ConstcalState {
    isActive: boolean;
    currentCallId?: string;
    startTime: number;
    currentTargetId: string;
}

// Configuration
const config: ConstcalConfig = {
    targetUserId: "",
    callDuration: 30,  // Default 30 seconds per call
    totalDuration: 3600 // Default 1 hour total duration
};

let state: ConstcalState = {
    isActive: false,
    startTime: 0,
    currentTargetId: ""
};

// Find required Discord functions
const { createCall, joinVoiceChannel, leaveVoiceAndVideo } = findByProps(
    "createCall",
    "joinVoiceChannel",
    "leaveVoiceAndVideo"
);

async function initiateCall(userId: string): Promise<string | null> {
    const channel = getCurrentChannel();
    if (!channel) return null;

    // Create call
    const callData = await createCall(channel.id, userId);
    if (!callData) return null;

    // Join voice channel
    const voiceState = await joinVoiceChannel(channel.id);
    if (!voiceState) return null;

    state.currentCallId = callData.callId;
    return callData.callId;
}

async function checkResponse(callId: string): Promise<boolean> {
    // Wait for configured call duration
    await new Promise(resolve => setTimeout(resolve, config.callDuration * 1000));

    // Check if call still exists
    const calls = findByProps("getCalls");
    const activeCalls = calls.getCalls();
    
    return activeCalls.some(call => 
        call.callId === callId && 
        call.status !== "RINGING"
    );
}

export default definePlugin({
    name: "Constcal",
    description: "Automatically calls someone until they respond",
    authors: [{
        name: "Matoumatio",
        id: 756864470026027100n
    }],
    patches: [],
    settings: definePluginSettings({
        callDuration: {
            type: "number",
            description: "Duration of each call (seconds)",
            default: 30,
            min: 5,
            max: 300
        },
        totalDuration: {
            type: "number",
            description: "Total time to keep calling (seconds)",
            default: 3600,
            min: 30,
            max: 86400
        }
    }),
    start() {
        console.log("Constcal plugin started");
        
        // Register commands
        this.registerCommand({
            name: "constcal",
            execute: async (args: string[]) => {
                switch(args[0]) {
                    case "start":
                        // Get current channel and user
                        const channel = getCurrentChannel();
                        if (!channel) {
                            return Message.create({
                                content: "Please use this command in a DM channel!"
                            });
                        }

                        // Get target user ID from DM
                        const targetUserId = channel.recipients[0];
                        if (!targetUserId) {
                            return Message.create({
                                content: "Failed to get target user ID!"
                            });
                        }

                        // Update state
                        state.currentTargetId = targetUserId;
                        state.startTime = Date.now();
                        state.isActive = true;

                        // Start calling loop
                        while (state.isActive) {
                            // Check total duration
                            const elapsed = (Date.now() - state.startTime) / 1000;
                            if (elapsed >= config.totalDuration) {
                                state.isActive = false;
                                return Message.create({
                                    content: "Total duration reached. Stopping Constcal."
                                });
                            }

                            const callId = await initiateCall(state.currentTargetId);
                            if (!callId) break;

                            const responded = await checkResponse(callId);
                            if (responded) {
                                state.isActive = false;
                                return Message.create({
                                    content: "Target has answered! Stopping Constcal."
                                });
                            }

                            // Leave current call
                            leaveVoiceAndVideo();
                            await new Promise(resolve => setTimeout(resolve, 5000));
                        }

                        break;

                    case "stop":
                        state.isActive = false;
                        leaveVoiceAndVideo();
                        return Message.create({
                            content: "Stopping Constcal..."
                        });

                    default:
                        return Message.create({
                            content: "Usage: `/constcal <start|stop>`"
                        });
                }
            }
        });
    },
    stop() {
        console.log("Constcal plugin stopped");
        state.isActive = false;
        leaveVoiceAndVideo();
    }
});
