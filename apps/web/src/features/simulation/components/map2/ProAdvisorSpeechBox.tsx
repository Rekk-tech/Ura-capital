import React from "react";
import { ProRoomAiAdvisor } from "./ProRoomAiAdvisor";
import type { Map2QuarterHistoryRecord } from "../../types/map-game.types";

interface ProAdvisorSpeechBoxProps {
  lastRecord: Map2QuarterHistoryRecord | null;
  currentQuarter?: number;
}

/**
 * Backward compatibility alias for ProRoomAiAdvisor
 */
export const ProAdvisorSpeechBox: React.FC<ProAdvisorSpeechBoxProps> = (props) => {
  return <ProRoomAiAdvisor {...props} />;
};

export { ProRoomAiAdvisor };
