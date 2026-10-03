import React from "react";
import { ProRoomReportView } from "./ProRoomReportView";
import type { Map2FinalReport } from "../../types/map-game.types";

interface ProPortfolioReportProps {
  report: Map2FinalReport;
  onReplay: () => void;
}

/**
 * Backward compatibility alias for ProRoomReportView
 */
export const ProPortfolioReport: React.FC<ProPortfolioReportProps> = (props) => {
  return <ProRoomReportView {...props} />;
};

export { ProRoomReportView };
