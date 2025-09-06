import definePlugin from "@utils/types";
import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { getCurrentChannel } from "@utils/discord";
import { sendBotMessage, ApplicationCommandOptionType, ApplicationCommandInputType } from "@api/Commands";

interface ConstcalState {
    isActive: boolean;
    currentCallId?: string;
    startTime: number;
    currentTargetId: string;
    timeoutId?: number;
}

// Grab Discord’s call-related functions dynamically
const callModule =
    findByPropsLazy("call") ||
    findByPropsLazy("startCall") ||
    findByPropsLazy("ring") ||
    findByPropsLazy("callUser");

const voiceModule =
    findByPropsLazy("selectVoiceChannel") ||
    findByPropsLazy("setChannel");


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
        description: "Total time to keep calling (seconds, 0 = unlimited)",
        default: 3600
    }
});

function stopCalling() {
    state.isActive = false;
    if (state.timeoutId) {
        clearTimeout(state.timeoutId);
        state.timeoutId = undefined;
    }

    try {
        if (voiceModule?.selectVoiceChannel) {
            voiceModule.selectVoiceChannel(null);
        } else if (voiceModule?.setChannel) {
            voiceModule.setChannel(null);
        }
    } catch (error: any) {
        if (state.currentTargetId) {
            sendBotMessage(state.currentTargetId, {
                content: `An Error occurred while executing command "constcal":\n\`\`\`ts\n${error?.stack ?? error}\n\`\`\``
            });
        }
    }
}

async function tryCall(channelId: string) {
    if (!callModule) {
        throw new Error("No call module found");
    }

    const methods = ["call", "startCall", "ring", "callUser"];
    for (const m of methods) {
        const fn = (callModule as any)[m];
        if (typeof fn === "function") {
            await fn(channelId);
            return;
        }
    }

    throw new Error("No working call function in callModule");
}

async function startCallingLoop(channelId: string) {
    if (!state.isActive) return;

    const elapsed = (Date.now() - state.startTime) / 1000;

    // Only enforce total duration if greater than 0
    if (settings.store.totalDuration > 0 && elapsed >= settings.store.totalDuration) {
        stopCalling();
        sendBotMessage(channelId, {
            content: "⏰ Total duration reached. Stopping Constcal."
        });
        return;
    }

    try {
        await tryCall(channelId);
    } catch (error: any) {
        sendBotMessage(channelId, {
            content: `An Error occurred while executing command "constcal":\n\`\`\`ts\n${error?.stack ?? error}\n\`\`\``
        });
        stopCalling();
        return;
    }

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
        inputType: ApplicationCommandInputType.BUILT_IN,
        options: [{
            name: "action",
            description: "Action to perform (start/stop)",
            type: ApplicationCommandOptionType.STRING,
            required: true,
            choices: [{
                name: "start",
                value: "start",
                label: "start"
            }, {
                name: "stop",
                value: "stop",
                label: "stop"
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
                    if (channel.type !== 1) {
                        return sendBotMessage(ctx.channel.id, {
                            content: "❌ This command only works in DM channels!"
                        });
                    }

                    if (state.isActive) {
                        return sendBotMessage(ctx.channel.id, {
                            content: "⚠️ Constcal is already running! Use `/constcal stop` to stop it."
                        });
                    }

                    state.isActive = true;
                    state.startTime = Date.now();
                    state.currentTargetId = channel.id;

                    sendBotMessage(ctx.channel.id, {
                        content: `🔄 Starting Constcal. Will call for ${settings.store.totalDuration === 0 ? "unlimited time" : settings.store.totalDuration + "s"} with ${settings.store.callDuration}s intervals.`
                    });

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

    start() {},
    stop() {
        stopCalling();
    }
});
