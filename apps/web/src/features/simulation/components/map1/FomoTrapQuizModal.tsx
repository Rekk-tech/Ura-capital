import React, { useState, useEffect } from "react";
import type { Map1TrapConfig, Map1QuizConfig } from "../../types/map-game.types";
import { AlertTriangle, HelpCircle, CheckCircle, XCircle } from "lucide-react";

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

  // 10s timer countdown when modal opens
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
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen || (!trap && !quiz)) return null;

  const handleSelectOption = async (optionId: string) => {
    setSelectedOption(optionId);
    setIsSubmitting(true);

    try {
      if (trap) {
        await onSubmitTrap(round, trap.id, optionId);
        const opt = trap.options.find((o) => o.id === optionId);
        setFeedback({
          text: opt?.isAggressive
            ? "Cảnh báo: Bạn đã rơi vào bẫy tâm lý theo đám đông!"
            : "Tốt lắm! Bạn đã giữ kỷ luật và né tránh bẫy tâm lý thành công.",
        });
      } else if (quiz) {
        const res = await onSubmitQuiz(round, quiz.id, optionId);
        setFeedback({
          isCorrect: res.isCorrect,
          text: res.feedback || (res.isCorrect ? "Chính xác! Bạn được cộng điểm kỷ luật." : "Chưa chính xác."),
        });
      }
    } finally {
      setIsSubmitting(false);
      // Auto close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fomo-trap-quiz-title"
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Top Timer Bar */}
        <div className="w-full h-1.5 bg-slate-100">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              secondsRemaining <= 3 ? "bg-rose-500" : "bg-amber-500"
            }`}
            style={{ width: `${(secondsRemaining / 10) * 100}%` }}
          />
        </div>

        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {trap ? (
              <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
                <AlertTriangle size={18} />
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <HelpCircle size={18} />
              </div>
            )}
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                {trap ? "TÌNH HUỐNG BẪY TÂM LÝ" : "MINI-QUIZ KỶ LUẬT (10s)"}
              </span>
              <h3 id="fomo-trap-quiz-title" className="text-base font-bold text-slate-900">
                {trap ? trap.title : `Round ${round} Thách Thức Kỷ Luật`}
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {secondsRemaining}s
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-4">
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            {trap ? trap.prompt : quiz?.prompt}
          </p>

          {/* Feedback banner if answered */}
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                feedback.isCorrect === false
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : "bg-emerald-50 border-emerald-200 text-emerald-800"
              }`}
            >
              {feedback.isCorrect === false ? <XCircle size={16} /> : <CheckCircle size={16} />}
              <span className="font-semibold">{feedback.text}</span>
            </div>
          )}

          {/* Options List */}
          <div className="flex flex-col gap-2">
            {trap &&
              trap.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  disabled={isSubmitting || selectedOption !== null}
                  onClick={() => handleSelectOption(option.id)}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                    selectedOption === option.id
                      ? option.isAggressive
                        ? "bg-rose-50 border-rose-400 text-rose-900"
                        : "bg-emerald-50 border-emerald-400 text-emerald-900"
                      : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 active:scale-98"
                  } disabled:opacity-70`}
                >
                  <span>{option.label}</span>
                </button>
              ))}

            {quiz &&
              quiz.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  disabled={isSubmitting || selectedOption !== null}
                  onClick={() => handleSelectOption(option.id)}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                    selectedOption === option.id
                      ? option.isCorrect
                        ? "bg-emerald-50 border-emerald-400 text-emerald-900"
                        : "bg-rose-50 border-rose-400 text-rose-900"
                      : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 active:scale-98"
                  } disabled:opacity-70`}
                >
                  <span>{option.id}. {option.text}</span>
                </button>
              ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Tự động đóng khi hết thời gian</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 font-medium underline"
          >
            Đóng ngay
          </button>
        </div>
      </div>
    </div>
  );
};
