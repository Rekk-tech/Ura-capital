import { useState, useEffect, useCallback, useRef } from "react";
import { mapGameApiClient } from "../api/map-game.api";
import type {
  Map1CurrentState,
  Map1DebriefReport,
  Map1OrderInput,
  Map2Allocation,
  Map2FinalReport,
  Map2QuarterHistoryRecord,
  Map2Session,
} from "../types/map-game.types";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export interface UseMap1GameReturn {
  sessionId: string | null;
  state: Map1CurrentState | null;
  debrief: Map1DebriefReport | null;
  isLoading: boolean;
  isSubmittingOrder: boolean;
  error: string | null;
  tutorialCompleted: boolean;
  startNewGame: () => Promise<void>;
  submitOrder: (input: Map1OrderInput) => Promise<void>;
  submitTrap: (round: number, trapId: string, selectedOption: string) => Promise<void>;
  submitQuiz: (round: number, quizId: string, selectedOption: string) => Promise<{ success: boolean; isCorrect?: boolean; feedback?: string }>;
  finishGame: () => Promise<void>;
  completeTutorial: () => void;
  resetGame: () => void;
}

export function useMap1Game(accessToken?: string | null): UseMap1GameReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [state, setState] = useState<Map1CurrentState | null>(null);
  const [debrief, setDebrief] = useState<Map1DebriefReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tutorialCompleted, setTutorialCompleted] = useState(() => {
    try {
      return localStorage.getItem("map1_tutorial_seen") === "true";
    } catch {
      return false;
    }
  });

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const completeTutorial = useCallback(() => {
    setTutorialCompleted(true);
    try {
      localStorage.setItem("map1_tutorial_seen", "true");
    } catch {
      // ignore
    }
  }, []);

  const resetGame = useCallback(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setSessionId(null);
    setState(null);
    setDebrief(null);
    setError(null);
  }, []);

  const fetchState = useCallback(async (sid: string) => {
    try {
      const res = await mapGameApiClient.getMap1State(sid, accessToken);
      setState(res.data);
      if (
        res.data.status === "completed_burned" ||
        res.data.status === "completed_survived"
      ) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        const report = await mapGameApiClient.finishMap1(sid, accessToken);
        setDebrief(report.data);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể tải trạng thái giả lập Map 1"));
    }
  }, [accessToken]);

  const startNewGame = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setDebrief(null);
      const res = await mapGameApiClient.startMap1(accessToken);
      const sid = res.data.sessionId;
      setSessionId(sid);
      await fetchState(sid);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể bắt đầu giả lập Map 1"));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, fetchState]);

  // Polling loop every 1 second when session is active
  useEffect(() => {
    if (!sessionId) return;
    if (state?.status === "completed_burned" || state?.status === "completed_survived") return;

    pollIntervalRef.current = setInterval(() => {
      fetchState(sessionId);
    }, 1000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [sessionId, state?.status, fetchState]);

  const submitOrder = useCallback(
    async (input: Map1OrderInput) => {
      if (!sessionId) return;
      try {
        setIsSubmittingOrder(true);
        setError(null);
        const res = await mapGameApiClient.submitMap1Order(sessionId, input, accessToken);
        setState(res.data);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Đặt lệnh không thành công"));
      } finally {
        setIsSubmittingOrder(false);
      }
    },
    [sessionId, accessToken],
  );

  const submitTrap = useCallback(
    async (round: number, trapId: string, selectedOption: string) => {
      if (!sessionId) return;
      try {
        await mapGameApiClient.submitMap1Quiz(
          sessionId,
          { round, trapId, selectedOption },
          accessToken,
        );
        await fetchState(sessionId);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Không thể gửi lựa chọn bẫy"));
      }
    },
    [sessionId, accessToken, fetchState],
  );

  const submitQuiz = useCallback(
    async (round: number, quizId: string, selectedOption: string) => {
      if (!sessionId) return { success: false };
      try {
        const res = await mapGameApiClient.submitMap1Quiz(
          sessionId,
          { round, quizId, selectedOption },
          accessToken,
        );
        await fetchState(sessionId);
        return res.data;
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Không thể gửi câu trả lời"));
        return { success: false };
      }
    },
    [sessionId, accessToken, fetchState],
  );

  const finishGame = useCallback(async () => {
    if (!sessionId) return;
    try {
      setIsLoading(true);
      const res = await mapGameApiClient.finishMap1(sessionId, accessToken);
      setDebrief(res.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể kết thúc giả lập"));
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, accessToken]);

  return {
    sessionId,
    state,
    debrief,
    isLoading,
    isSubmittingOrder,
    error,
    tutorialCompleted,
    startNewGame,
    submitOrder,
    submitTrap,
    submitQuiz,
    finishGame,
    completeTutorial,
    resetGame,
  };
}

export interface UseMap2GameReturn {
  sessionId: string | null;
  session: Map2Session | null;
  lastQuarterRecord: Map2QuarterHistoryRecord | null;
  report: Map2FinalReport | null;
  isLoading: boolean;
  isCommitting: boolean;
  error: string | null;
  startNewGame: () => Promise<void>;
  updateAllocation: (allocation: Map2Allocation) => Promise<boolean>;
  submitQuiz: (quarter: number, quizId: string, selectedOption: string) => Promise<{ isCorrect: boolean; feedback: string }>;
  commitQuarter: (allocation?: Map2Allocation, quiz?: { quizId: string; selectedOption: string }) => Promise<void>;
  fetchReport: () => Promise<void>;
  resetGame: () => void;
}

export function useMap2Game(accessToken?: string | null): UseMap2GameReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<Map2Session | null>(null);
  const [lastQuarterRecord, setLastQuarterRecord] = useState<Map2QuarterHistoryRecord | null>(null);
  const [report, setReport] = useState<Map2FinalReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetGame = useCallback(() => {
    setSessionId(null);
    setSession(null);
    setLastQuarterRecord(null);
    setReport(null);
    setError(null);
  }, []);

  const fetchSession = useCallback(async (sid: string) => {
    try {
      const res = await mapGameApiClient.getMap2Session(sid, accessToken);
      setSession(res.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể tải phiên giả lập Map 2"));
    }
  }, [accessToken]);

  const startNewGame = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setReport(null);
      const res = await mapGameApiClient.startMap2(accessToken);
      setSessionId(res.data.sessionId);
      setSession(res.data.session);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể khởi tạo phiên Map 2"));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const updateAllocation = useCallback(
    async (allocation: Map2Allocation): Promise<boolean> => {
      if (!sessionId) return false;
      const sum = allocation.growth + allocation.value + allocation.bond + allocation.cash;
      if (Math.abs(sum - 100) > 0.01) {
        setError(`Tổng tỷ trọng phân bổ phải bằng 100% (Hiện tại: ${sum}%)`);
        return false;
      }
      try {
        setError(null);
        await mapGameApiClient.allocateMap2(sessionId, allocation, accessToken);
        if (session) {
          setSession({ ...session, currentAllocation: allocation });
        }
        return true;
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Cập nhật phân bổ thất bại"));
        return false;
      }
    },
    [sessionId, session, accessToken],
  );

  const submitQuiz = useCallback(
    async (quarter: number, quizId: string, selectedOption: string) => {
      if (!sessionId) return { isCorrect: false, feedback: "" };
      try {
        const res = await mapGameApiClient.submitMap2Quiz(
          sessionId,
          { quarter, quizId, selectedOption },
          accessToken,
        );
        await fetchSession(sessionId);
        return { isCorrect: res.data.isCorrect, feedback: res.data.feedback };
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Không thể gửi bài tập kỷ luật"));
        return { isCorrect: false, feedback: "" };
      }
    },
    [sessionId, accessToken, fetchSession],
  );

  const fetchReport = useCallback(async () => {
    if (!sessionId) return;
    try {
      setIsLoading(true);
      const res = await mapGameApiClient.getMap2Report(sessionId, accessToken);
      setReport(res.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể tạo báo cáo đầu tư"));
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, accessToken]);

  const commitQuarter = useCallback(
    async (allocation?: Map2Allocation, quiz?: { quizId: string; selectedOption: string }) => {
      if (!sessionId) return;
      try {
        setIsCommitting(true);
        setError(null);
        const res = await mapGameApiClient.commitMap2Quarter(
          sessionId,
          { allocation, quiz },
          accessToken,
        );
        setSession(res.data.session);
        setLastQuarterRecord(res.data.historyRecord);

        if (res.data.isFinalQuarter) {
          await fetchReport();
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Chuyển quý thất bại"));
      } finally {
        setIsCommitting(false);
      }
    },
    [sessionId, accessToken, fetchReport],
  );

  return {
    sessionId,
    session,
    lastQuarterRecord,
    report,
    isLoading,
    isCommitting,
    error,
    startNewGame,
    updateAllocation,
    submitQuiz,
    commitQuarter,
    fetchReport,
    resetGame,
  };
}
