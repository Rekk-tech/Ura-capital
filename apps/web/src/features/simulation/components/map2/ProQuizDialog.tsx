import React, { useState } from "react";
import { Brain, CheckCircle2, Lock, ArrowRight } from "lucide-react";

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

  const handleSelectOption = (optId: string) => {
    if (result) return;
    setSelectedOption(optId);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedOption || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await onSubmitQuiz(quarter, quizId, selectedOption);
      setResult(res);
      setTimeout(() => {
        onClose();
        setSelectedOption(null);
        setResult(null);
      }, 2000);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pro-quiz-title"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Top Header Pill & Check Counter */}
        <div className="p-5 pb-3 border-b border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-300">
              KIỂM TRA KỶ LUẬT ĐẦU TƯ • QUÝ {quarter}
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              Discipline Check #{String(quarter).padStart(2, "0")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center shadow-xs flex-shrink-0">
              <Brain size={20} />
            </div>
            <div>
              <h3 id="pro-quiz-title" className="text-lg font-black text-slate-900 tracking-tight">
                Tình Huống Kỷ Luật Đầu Tư
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Aura Discipline Check #{String(quarter).padStart(2, "0")} • Tác động Vĩ mô &amp; Tâm lý quản trị
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-4">
          {/* Scenario Box (Figma Style) */}
          <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200/80 flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-800">
              TÌNH HUỐNG THỰC TẾ (SCENARIO)
            </span>
            <p className="text-sm font-semibold text-slate-900 leading-relaxed font-sans">
              "{prompt}"
            </p>
          </div>

          {/* Interactive Options Cards */}
          <div className="flex flex-col gap-2.5">
            {options.map((opt) => {
              const isSelected = selectedOption === opt.id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(opt.id)}
                  disabled={isSubmitting || !!result}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-950 shadow-md"
                      : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 font-mono ${
                      isSelected
                        ? "bg-teal-500 text-slate-950"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {opt.id}
                  </span>
                  <div className="flex-1">
                    <p className={`text-xs font-bold leading-snug ${isSelected ? "text-white" : "text-slate-900"}`}>
                      {opt.text}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Feedback Alert if submitted */}
          {result && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200 ${
                result.isCorrect
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-amber-50 text-amber-800 border-amber-300"
              }`}
            >
              <CheckCircle2 size={16} className={result.isCorrect ? "text-emerald-600" : "text-amber-600"} />
              <span>{result.feedback}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <Lock size={12} className="text-slate-400 flex-shrink-0" />
            <span>CrediFin AI Advisor đang theo dõi logic ra quyết định của bạn</span>
          </div>

          <button
            type="button"
            disabled={!selectedOption || isSubmitting || !!result}
            onClick={handleConfirmSubmit}
            className={`py-2 px-5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              selectedOption && !isSubmitting && !result
                ? "bg-slate-900 hover:bg-slate-950 text-white shadow-sm cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <span>{isSubmitting ? "Đang xử lý..." : "Xác Nhận & Tiếp Tục"}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
