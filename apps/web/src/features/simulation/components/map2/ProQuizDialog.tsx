import React, { useState } from "react";
import { HelpCircle, Award, CheckCircle2, XCircle } from "lucide-react";

interface QuizOption {
  id: string;
  text: string;
}

interface ProQuizDialogProps {
  quarter: number;
  quizId: string;
  prompt: string;
  options: QuizOption[];
  isOpen: boolean;
  onClose: () => void;
  onSubmitQuiz: (quarter: number, quizId: string, optionId: string) => Promise<{ isCorrect: boolean; feedback: string }>;
}

export const ProQuizDialog: React.FC<ProQuizDialogProps> = ({
  quarter,
  quizId,
  prompt,
  options,
  isOpen,
  onClose,
  onSubmitQuiz,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [result, setResult] = useState<{ isCorrect: boolean; feedback: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSelect = async (optId: string) => {
    setSelectedOption(optId);
    setIsSubmitting(true);
    try {
      const res = await onSubmitQuiz(quarter, quizId, optId);
      setResult(res);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        onClose();
      }, 2500);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pro-quiz-title"
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <HelpCircle size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                THÁCH THỨC KỶ LUẬT QUÝ {quarter}
              </span>
              <h4 id="pro-quiz-title" className="text-base font-bold text-slate-900">
                Tình Huống Quản Trị Danh Mục (+10 Credit Score)
              </h4>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-white px-2.5 py-1 rounded-full border border-indigo-100 shadow-2xs">
            <Award size={13} />
            <span>+10 Điểm</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4">
          <p className="text-xs font-semibold text-slate-800 leading-relaxed">
            {prompt}
          </p>

          {/* Feedback banner */}
          {result && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                result.isCorrect
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {result.isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              <span className="font-semibold">{result.feedback}</span>
            </div>
          )}

          {/* Options */}
          <div className="flex flex-col gap-2">
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={isSubmitting || selectedOption !== null}
                onClick={() => handleSelect(opt.id)}
                className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                  selectedOption === opt.id
                    ? result?.isCorrect
                      ? "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold"
                      : "bg-rose-50 border-rose-400 text-rose-900 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 active:scale-98"
                } disabled:opacity-75`}
              >
                <span className="font-bold mr-1">{opt.id}.</span> {opt.text}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Tự động chuyển tiếp sau khi trả lời</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 font-medium underline"
          >
            Bỏ qua
          </button>
        </div>
      </div>
    </div>
  );
};
