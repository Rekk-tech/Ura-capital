import React from "react";
import { Newspaper, MessageSquare, Flame } from "lucide-react";

interface FomoNewsFeedProps {
  news: string;
  botChat: Array<{ sender: string; message: string }>;
  hint?: string;
}

export const FomoNewsFeed: React.FC<FomoNewsFeedProps> = ({
  news,
  botChat,
  hint,
}) => {
  return (
    <div className="fomo-newsfeed-container flex flex-col gap-3">
      {/* Breaking News Ticker */}
      <div className="news-banner p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-start gap-2.5 shadow-sm">
        <div className="p-1.5 rounded-lg bg-amber-500 text-white flex-shrink-0 mt-0.5">
          <Newspaper size={16} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
              TIN NÓNG THỊ TRƯỜNG
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-800 leading-snug">{news}</p>
          {hint && (
            <p className="text-xs text-amber-800 mt-1 italic opacity-90">{hint}</p>
          )}
        </div>
      </div>

      {/* Simulated Community Bot Chat Stream */}
      <div className="bot-chat-box p-3 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <MessageSquare size={13} className="text-blue-400" />
            <span className="font-semibold text-slate-300">Room Chat Phím Hàng $FOMO</span>
          </div>
          <span className="flex items-center gap-1 text-[11px] text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            1,248 online
          </span>
        </div>

        <div className="chat-messages flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
          {botChat && botChat.length > 0 ? (
            botChat.map((chat, idx) => (
              <div key={idx} className="chat-item flex items-start gap-2 text-xs">
                <span className="font-bold text-amber-400 flex-shrink-0">
                  [{chat.sender}]:
                </span>
                <span className="text-slate-200">{chat.message}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic">Đang chờ tín hiệu thảo luận...</p>
          )}
        </div>

        <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Flame size={12} className="text-orange-400" /> Tâm lý room: <strong className="text-rose-400">Hưng phấn tột độ</strong>
          </span>
          <span className="text-slate-500">Giả lập hành vi đám đông</span>
        </div>
      </div>
    </div>
  );
};
