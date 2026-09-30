import React, { useState } from "react";
import { MessageSquare, Flame, Send } from "lucide-react";

interface FomoNewsCardProps {
  news: string;
  hint?: string;
}

export const FomoNewsCard: React.FC<FomoNewsCardProps> = ({ news, hint }) => {
  return (
    <div className="fomo-news-card card-aura p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600">
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
          <span>TIN NÓNG ĐẶC BIỆT</span>
        </div>
        <span className="text-xs text-slate-400 font-medium">2 phút trước</span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5">
        <h4 className="text-base font-bold text-slate-900 leading-snug">
          {news || "Cổ đông lớn đăng ký gom thêm 5 triệu cổ phiếu $FOMO trong tuần này."}
        </h4>
        <p className="text-xs text-slate-600 leading-relaxed">
          Quỹ ngoại Aura Apex Partners vừa công bố kế hoạch nâng tỷ lệ sở hữu lên 15% vốn điều lệ. Tin đồn sáp nhập dự án nghìn tỷ sắp được ký kết trong hôm nay.
        </p>
        {hint && (
          <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200/60 mt-1 italic">
            {hint}
          </p>
        )}
      </div>

      {/* Footer Badges */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
          ⚡ Độ tích cực: Cực cao
        </span>
        <span className="text-[11px] text-slate-400">Aura Financial Wire</span>
      </div>
    </div>
  );
};

interface FomoHypeRoomProps {
  botChat?: Array<{ sender: string; message: string }>;
}

export const FomoHypeRoom: React.FC<FomoHypeRoomProps> = ({ botChat }) => {
  const [inputMsg, setInputMsg] = useState("");
  const [localMessages, setLocalMessages] = useState<Array<{ sender: string; badge?: string; badgeColor?: string; time: string; message: string }>>([
    {
      sender: "Trader_Shark88",
      badge: "VIP 5",
      badgeColor: "bg-amber-100 text-amber-800",
      time: "Vừa xong",
      message: "Múc nhanh còn kịp anh em ơi! Cây trần thứ 3 liên tiếp rồi, không vào là lỡ sóng thế kỷ! 🚀🚀🚀",
    },
    {
      sender: "FO_DiamondHands",
      badge: "Margin King",
      badgeColor: "bg-emerald-100 text-emerald-800",
      time: "12s trước",
      message: "Tím lịm tìm sim! Đã full margin từ sáng, mục tiêu x3 tài khoản! 💎💎💎",
    },
    {
      sender: "BigWhale_99",
      badge: "Institutional",
      badgeColor: "bg-purple-100 text-purple-800",
      time: "28s trước",
      message: "Lệnh gom 500k cổ phiếu vừa vào quét sạch bảng điện! Chuẩn bị trắng bên bán toàn tập! 🔥",
    },
    {
      sender: "Broker_Thanh",
      badge: "Lead Analyst",
      badgeColor: "bg-blue-100 text-blue-800",
      time: "45s trước",
      message: "Tin mật từ ban lãnh đạo sắp ra, ai chưa có hàng tranh thủ đớp ngay giá trần!",
    },
  ]);

  const handleSend = () => {
    if (!inputMsg.trim()) return;
    setLocalMessages((prev) => [
      ...prev,
      {
        sender: "Bạn (Learner)",
        badge: "Trader",
        badgeColor: "bg-slate-200 text-slate-800",
        time: "Vừa xong",
        message: inputMsg.trim(),
      },
    ]);
    setInputMsg("");
  };

  const handleQuickEmoji = (emoji: string) => {
    setLocalMessages((prev) => [
      ...prev,
      {
        sender: "Bạn (Learner)",
        badge: "Trader",
        badgeColor: "bg-slate-200 text-slate-800",
        time: "Vừa xong",
        message: emoji,
      },
    ]);
  };

  return (
    <div className="fomo-hype-room card-aura p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
            <MessageSquare size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-slate-900">
                Community VIP Hype Room
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                1,420 Live
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Automated psychological crowd dynamics feed
            </p>
          </div>
        </div>

        {/* Sentiment Meter */}
        <div className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex flex-col items-end">
          <span className="text-[9px] font-black uppercase tracking-wider text-amber-600">
            SENTIMENT METER
          </span>
          <span className="text-xs font-black flex items-center gap-1">
            <Flame size={13} className="text-amber-500" /> Extreme Greed 94/100
          </span>
        </div>
      </div>

      {/* Chat Messages Feed */}
      <div className="chat-feed-list flex flex-col gap-3 max-h-52 overflow-y-auto pr-1 text-xs">
        {localMessages.map((chat, idx) => (
          <div key={idx} className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
            {/* User Avatar Circle */}
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              {chat.sender.slice(0, 2).toUpperCase()}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-slate-900">{chat.sender}</span>
                {chat.badge && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${chat.badgeColor}`}>
                    {chat.badge}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 ml-auto">{chat.time}</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-medium">{chat.message}</p>
            </div>
          </div>
        ))}

        {botChat && botChat.map((bc, idx) => (
          <div key={`bc-${idx}`} className="flex items-start gap-3 p-2 rounded-xl bg-slate-50">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              {bc.sender.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-slate-900">{bc.sender}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                  Bot Signal
                </span>
                <span className="text-[10px] text-slate-400 ml-auto">Vừa xong</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-medium">{bc.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Emoji Reactions */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
        <span className="text-[11px] text-slate-400 font-medium">Thả cảm xúc nhanh:</span>
        {["🚀", "💎", "🔥", "📈"].map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleQuickEmoji(emoji)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-transform active:scale-90 text-sm"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Gửi tin nhắn hoặc thả cảm xúc FOMO..."
          className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
        />
        <button
          type="button"
          onClick={handleSend}
          className="btn btn-primary py-2 px-4 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1 shadow-xs active:scale-95"
        >
          <span>Gửi</span>
          <Send size={12} />
        </button>
      </div>
    </div>
  );
};

// Composite export for backwards compatibility
export const FomoNewsFeed: React.FC<{
  news: string;
  botChat: Array<{ sender: string; message: string }>;
  hint?: string;
}> = ({ news, botChat, hint }) => {
  return (
    <div className="fomo-newsfeed-composite flex flex-col gap-4">
      <FomoNewsCard news={news} hint={hint} />
      <FomoHypeRoom botChat={botChat} />
    </div>
  );
};
