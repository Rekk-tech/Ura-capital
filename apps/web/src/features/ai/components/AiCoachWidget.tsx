import React, { useState, useEffect } from "react";
import { AiCoachFab } from "./AiCoachFab";
import { AiCoachModal } from "./AiCoachModal";
import { AURA_OPEN_AI_COACH_EVENT, AiCoachContext } from "../events";

export interface AiCoachWidgetProps {
  defaultContext?: AiCoachContext;
  showFab?: boolean;
}

export const AiCoachWidget: React.FC<AiCoachWidgetProps> = ({
  defaultContext = "GENERAL",
  showFab = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeContext, setActiveContext] = useState<AiCoachContext>(defaultContext);

  useEffect(() => {
    const handleOpenEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ context?: AiCoachContext }>;
      if (customEvent.detail?.context) {
        setActiveContext(customEvent.detail.context);
      }
      setIsOpen(true);
    };

    window.addEventListener(AURA_OPEN_AI_COACH_EVENT, handleOpenEvent);
    return () => {
      window.removeEventListener(AURA_OPEN_AI_COACH_EVENT, handleOpenEvent);
    };
  }, []);

  return (
    <>
      {showFab && !isOpen && (
        <AiCoachFab onClick={() => setIsOpen(true)} />
      )}
      <AiCoachModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialContext={activeContext}
      />
    </>
  );
};
