export interface ConstcalConfig {
    callDuration: number;  // Duration of each call in seconds
    totalDuration: number; // Total time to keep calling in seconds
}

export interface ConstcalState {
    isActive: boolean;
    currentCallId?: string;
    startTime: number;
    currentTargetId: string;
}
