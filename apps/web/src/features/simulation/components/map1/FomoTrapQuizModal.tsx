import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { Map1TrapConfig, Map1QuizConfig } from "../../types/map-game.types";
import { AlertTriangle, HelpCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { MAP1_ROUNDS_DATA } from "../../data/map1-fomo-dataset";

interface FomoTrapQuizModalProps {
  round: number;
  trap: Map1TrapConfig | null;
  quiz: Map1QuizConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitTrap: (round: number, trapId: string, optionId: string) => Promise<void>;
  onSubmitQuiz: (round: number, quizId: string, optionId: string) => Promise<{ success: boolean; isCorrect?: boolean; feedback?: string }>;
}

export const FomoTrapQuizModal: React.FC<FomoTrapQuizModalProps> = ({
  round,
  trap,
  quiz,
  isOpen,
  onClose,
  onSubmitTrap,
  onSubmitQuiz,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect?: boolean; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(10);

  // Fallback dataset item if state doesn't provide rich trap/quiz
  const datasetRound = MAP1_ROUNDS_DATA[round] || MAP1_ROUNDS_DATA[1];
  const datasetTrapOrQuiz = datasetRound?.trapOrQuiz;

  // Normalized display fields
  const isTrap = Boolean(trap || datasetTrapOrQuiz?.type === "TRAP_POPUP");
  const modalTitle = trap?.title || quiz?.prompt || datasetTrapOrQuiz?.title || `Thử Thách Kỷ Luật Vòng ${round}`;
  const modalPrompt =
    trap?.prompt ||
    quiz?.prompt ||
    datasetTrapOrQuiz?.question ||
    "Dữ liệu thị trường xuất hiện tín hiệu bất thường. Bạn sẽ lựa chọn hành động nào?";

  const displayOptions = useMemo(() => {
    if (trap?.options && trap.options.length > 0) {
      return trap.options.map((opt, idx) => ({
        id: opt.id,
        letter: String.fromCharCode(65 + idx),
        shortcutKey: String(idx + 1),
        text: opt.label || "",
        isCorrect: !opt.isAggressive,
        isAggressive: opt.isAggressive,
      }));
    }
    if (quiz?.options && quiz.options.length > 0) {
      return quiz.options.map((opt, idx) => ({
        id: opt.id,
        letter: String.fromCharCode(65 + idx),
        shortcutKey: String(idx + 1),
        text: opt.text || "",
        isCorrect: opt.isCorrect ?? (opt.id === datasetTrapOrQuiz?.correctOptionId),
        isAggressive: false,
      }));
    }
    if (datasetTrapOrQuiz?.options && datasetTrapOrQuiz.options.length > 0) {
      return datasetTrapOrQuiz.options.map((opt, idx) => ({
        id: opt.id,
        letter: opt.id.length === 1 ? opt.id : String.fromCharCode(65 + idx),
        shortcutKey: String(idx + 1),
        text: opt.text || opt.label || "",
        isCorrect: opt.id === datasetTrapOrQuiz.correctOptionId || opt.isCorrect,
        isAggressive: Boolean(opt.isAggressive),
      }));
    }
    return [
      { id: "A", letter: "A", shortcutKey: "1", text: "Mua đuổi / all-in theo xu hướng giá tăng.", isCorrect: false },
      { id: "B", letter: "B", shortcutKey: "2", text: "Giữ kỷ luật, chờ tín hiệu xác nhận thanh khoản rõ ràng.", isCorrect: true },
      { id: "C", letter: "C", shortcutKey: "3", text: "Sử dụng đòn bẩy Margin cao nhất để gom hàng.", isCorrect: false },
    ];
  }, [trap, quiz, datasetTrapOrQuiz]);

  const handleSelectOption = useCallback(async (optionId: string) => {
    if (selectedOption !== null || isSubmitting) return;

    setSelectedOption(optionId);
    setIsSubmitting(true);

    const chosen = displayOptions.find((o) => o.id === optionId);
    const isCorrect = chosen?.isCorrect ?? false;

    // Craft 1-sentence psychological takeaway
    let takeawayText = "";
    if (isCorrect) {
      takeawayText = `Chính xác! ${datasetTrapOrQuiz?.explanation || "Bạn đã giữ vững kỷ luật quản trị rủi ro và né bẫy cảm xúc thành công."}`;
    } else {
      const biasLabel = datasetTrapOrQuiz?.psychologicalBias ? ` (${datasetTrapOrQuiz.psychologicalBias})` : "";
      takeawayText = `Chưa chính xác! Bạn đã rơi vào bẫy tâm lý đám đông${biasLabel}. ${datasetTrapOrQuiz?.explanation || "Hãy ưu tiên bảo toàn vốn."}`;
    }

    try {
      if (trap) {
        await onSubmitTrap(round, trap.id, optionId);
      } else if (quiz) {
        const res = await onSubmitQuiz(round, quiz.id, optionId);
        if (res.feedback) {
          takeawayText = res.feedback;
        }
      }
    } catch {
      // Fallback graceful handling
    } finally {
      setFeedback({
        isCorrect,
        text: takeawayText,
      });
      setIsSubmitting(false);

      // Auto-close after 2.2 seconds for psychological reflection
      setTimeout(() => {
        onClose();
      }, 2200);
    }
  }, [selectedOption, isSubmitting, displayOptions, datasetTrapOrQuiz, trap, quiz, round, onSubmitTrap, onSubmitQuiz, onClose]);

  // 10s countdown timer
  useEffect(() => {
    if (!isOpen) {
      setSelectedOption(null);
      setFeedback(null);
      setSecondsRemaining(10);
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // If time expires without user selecting, pick safe option or close
          if (selectedOption === null) {
            handleSelectOption(displayOptions[0]?.id || "A");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, selectedOption, displayOptions, handleSelectOption]);

  // Keyboard shortcut listener (1, 2, 3, 4 / A, B, C, D)
  useEffect(() => {
    if (!isOpen || selectedOption !== null || isSubmitting) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key === "1" || key === "A") {
        if (displayOptions[0]) handleSelectOption(displayOptions[0].id);
      } else if (key === "2" || key === "B") {
        if (displayOptions[1]) handleSelectOption(displayOptions[1].id);
      } else if (key === "3" || key === "C") {
        if (displayOptions[2]) handleSelectOption(displayOptions[2].id);
      } else if (key === "4" || key === "D") {
        if (displayOptions[3]) handleSelectOption(displayOptions[3].id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedOption, isSubmitting, displayOptions, handleSelectOption]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fomo-trap-quiz-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="fomo-quiz-dialog w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Top 10-second countdown bar */}
        <div className="fomo-quiz-progress-track w-full h-2 bg-slate-100">
          <div
            className="fomo-quiz-progress-fill h-full transition-all duration-1000 ease-linear"
            style={{
              width: `${(secondsRemaining / 10) * 100}%`,
              backgroundColor: secondsRemaining <= 3 ? "#ef4444" : "#f59e0b",
            }}
          />
        </div>

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isTrap ? (
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <HelpCircle size={20} />
              </div>
            )}
            <div>
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400 block">
                {isTrap ? "TÌNH HUỐNG BẪY TÂM LÝ (10 GIÂY)" : "MINI-QUIZ ĐO ĐỘ KỶ LUẬT (10 GIÂY)"}
              </span>
              <h3 id="fomo-trap-quiz-title" className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {modalTitle}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-mono font-bold text-xs">
            <Clock size={13} className={secondsRemaining <= 3 ? "text-rose-600 animate-pulse" : "text-amber-600"} />
            <span>00:{String(secondsRemaining).padStart(2, "0")}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-semibold">
            {modalPrompt}
          </p>

          {/* Feedback banner if answered */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 border ${
                feedback.isCorrect === false
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : "bg-emerald-50 border-emerald-200 text-emerald-800"
              }`}
            >
              {feedback.isCorrect === false ? (
                <XCircle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              )}
              <span className="font-semibold leading-relaxed">{feedback.text}</span>
            </div>
          )}

          {/* Large Accessible Option Cards */}
          <div className="flex flex-col gap-2.5">
            {displayOptions.map((opt) => {
              const isSelected = selectedOption === opt.id;
              let stateClasses = "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300";

              if (isSelected) {
                if (feedback) {
                  stateClasses = opt.isCorrect
                    ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm"
                    : "bg-rose-50 border-rose-500 text-rose-900 shadow-sm";
                } else {
                  stateClasses = "bg-blue-50 border-blue-500 text-blue-900";
                }
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isSubmitting || selectedOption !== null}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`fomo-quiz-option-card flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border text-left font-medium transition-all ${stateClasses} disabled:opacity-80`}
                >
                  <span
                    className={`fomo-quiz-badge flex-shrink-0 w-8 h-8 rounded-lg font-black text-xs flex items-center justify-center border ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-300"
                    }`}
                  >
                    {opt.letter}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold flex-1 leading-snug">
                    {opt.text}
                  </span>
                  <kbd className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded bg-white border border-slate-200 flex-shrink-0">
                    Phím {opt.letter} / {opt.shortcutKey}
                  </kbd>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>⚡ Bấm phím tắt A, B, C hoặc 1, 2, 3 để trả lời nhanh</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 font-semibold underline"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
