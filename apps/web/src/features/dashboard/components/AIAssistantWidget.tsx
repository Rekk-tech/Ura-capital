import React, { useState } from "react";
import { Sparkles, ArrowRight, Send } from "lucide-react";

export const AIAssistantWidget: React.FC = () => {
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "assistant" | "user"; text: string }>>([
    {
      role: "assistant",
      text: "Chào Tuấn! Danh mục giả lập của bạn đang có tỷ trọng tiền mặt an toàn (66%). Hãy duy trì kỷ luật cắt lỗ ở mức -5% cho mỗi vị thế mở.",
    },
  ]);

  const quickPrompts = [
    "Đánh giá rủi ro danh mục hôm nay",
    "Gợi ý chiến lược cắt lỗ kỷ luật HPG",
  ];

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      {
        role: "assistant",
        text: text.includes("HPG")
          ? "Với HPG (giá mua 28.500, lãi +6.49%), bạn có thể nâng mức chặn lãi trailing stop lên 29.800 để bảo toàn lợi nhuận nếu thị trường điều chỉnh."
          : "Hệ thống ghi nhận tỷ lệ Sharpe danh mục hiện tại là 1.82. Bạn đang kiểm soát rủi ro rất tốt trong chu kỳ biến động hiện tại.",
      },
    ]);
    setInputMessage("");
  };

  return (
    <div className="ai-assistant-dashboard-widget rounded-2xl p-5 text-white shadow-md border border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-cyan-400">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white tracking-tight">Trợ Lý AI Aura</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-400">Cố vấn 24/7 &amp; Quản trị rủi ro</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950/80 text-cyan-300 border border-indigo-700/60">
            Credit: Tin AI
          </span>
        </div>

        {/* AI Dialog Bubble */}
        <div className="my-3.5 space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl text-xs leading-relaxed ${
                msg.role === "assistant"
                  ? "bg-slate-800/90 border border-slate-700/70 text-slate-200"
                  : "bg-blue-600 text-white ml-6 text-right"
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>

        {/* Quick Reflex Prompts */}
        <div className="mt-3">
          <span className="text-[11px] font-semibold text-slate-400 block mb-2">
            Gợi ý câu hỏi phản xạ nhanh:
          </span>
          <div className="flex flex-col gap-1.5">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                onClick={() => handleSend(prompt)}
              >
                <span className="truncate">{prompt}</span>
                <ArrowRight size={12} className="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input box */}
      <div className="mt-3.5 pt-3 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 pr-10 transition-colors"
            placeholder="Hỏi AI về chiến lược hoặc bài học..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
          />
          <button
            type="submit"
            className="absolute right-1.5 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            aria-label="Gửi tin nhắn cho AI"
          >
            <Send size={12} />
          </button>
        </form>
      </div>
    </div>
  );
};
