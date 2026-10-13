import { useState, useEffect, useCallback } from "react";
import {
  gamificationService,
  GamificationState,
  GAMIFICATION_UPDATE_EVENT,
  LeaderboardEntry,
} from "../services/gamification.service";

export function useGamification() {
  const [state, setState] = useState<GamificationState>(() =>
    gamificationService.getState(),
  );

  useEffect(() => {
    const handleUpdate = () => {
      setState(gamificationService.getState());
    };

    window.addEventListener(GAMIFICATION_UPDATE_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(GAMIFICATION_UPDATE_EVENT, handleUpdate);
    };
  }, []);

  const addXp = useCallback((amount: number) => {
    return gamificationService.addXp(amount);
  }, []);

  const unlockBadge = useCallback((badgeId: "SURVIVOR" | "MACRO_TACTICIAN" | "MARKET_SCHOLAR" | "VIP_PATRON") => {
    return gamificationService.unlockBadge(badgeId);
  }, []);

  const recordMap1Run = useCallback(
    (result: { finalNav: number; initialNav: number; fomoIndex: number }) => {
      return gamificationService.recordMap1Run(result);
    },
    [],
  );

  const recordMap2Run = useCallback(
    (result: { finalNav: number; initialNav: number; alpha: number }) => {
      return gamificationService.recordMap2Run(result);
    },
    [],
  );

  const getLeaderboard = useCallback((userName?: string): LeaderboardEntry[] => {
    return gamificationService.getLeaderboard(userName);
  }, []);

  return {
    state,
    addXp,
    unlockBadge,
    recordMap1Run,
    recordMap2Run,
    getLeaderboard,
  };
}
