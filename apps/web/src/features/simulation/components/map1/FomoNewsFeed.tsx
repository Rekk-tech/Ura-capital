import React, { useState } from "react";
import { MessageSquare, Send, Snowflake, Sparkles, TrendingUp, ShieldAlert, CheckCircle2 } from "lucide-react";

interface FomoNewsCardProps {
  news: string;
  hint?: string;
  round?: number;
}

export const FomoNewsCard: React.FC<FomoNewsCardProps> = ({ news, hint, round = 1 }) => {
  // Category badge & impact indicator matrix per round
  let categoryBadge = "TIN DOANH NGHIỆP";
  let categoryColor = "bg-teal-50 text-teal-700 border-teal-200";
  let timestamp = "2 phút trước";
  let impactText = "Độ tích cực: Khá cao";

  switch (round) {
    case 1:
      categoryBadge = "TIN DOANH NGHIỆP";
      categoryColor = "bg-teal-50 text-teal-700 border-teal-200";
      timestamp = "2 phút trước";
      impactText = "Độ tích cực: Khá cao";
      break;
    case 2:
      categoryBadge = "TIN NÓNG ĐẶC BIỆT";
      categoryColor = "bg-purple-50 text-purple-700 border-purple-200";
      timestamp = "30 giây trước";
      impactText = "Độ tích cực: Cực đại (FOMO Peak)";
      break;
    case 3:
      categoryBadge = "TIN ĐỒN KHẨN CẤP";
      categoryColor = "bg-rose-50 text-rose-700 border-rose-200";
      timestamp = "Vừa xong";
      impactText = "Áp lực bán tháo: Báo động đỏ";
      break;
    case 4:
      categoryBadge = "ĐÍNH CHÍNH CHÍNH THỨC";
      categoryColor = "bg-amber-50 text-amber-700 border-amber-200";
      timestamp = "1 phút trước";
      impactText = "Tác động: Hồi phục kỹ thuật ngắn hạn";
      break;
    case 5:
      categoryBadge = "CẢNH BÁO THANH KHOẢN";
      categoryColor = "bg-cyan-50 text-cyan-800 border-cyan-300";
      timestamp = "Khẩn cấp";
      impactText = "Áp lực bán tháo: Cực độ (Mất thanh khoản)";
      break;
    case 6:
      categoryBadge = "NHẬN ĐỊNH CHUYÊN GIA";
      categoryColor = "bg-slate-100 text-slate-700 border-slate-300";
      timestamp = "3 phút trước";
      impactText = "Tâm lý thị trường: Chán nản cùng cực";
      break;
    case 7:
      categoryBadge = "BÁO CÁO TÀI CHÍNH";
      categoryColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
      timestamp = "5 phút trước";
      impactText = "Dòng tiền: Phân hóa cổ phiếu cơ bản";
      break;
    default:
      break;
  }

  return (
    <div className="fomo-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className={`fomo-news-tag ${categoryColor}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>● {categoryBadge}</span>
          </span>
        </div>
        <span className="text-xs text-slate-400 font-medium">{timestamp}</span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
          {news || "Công ty công bố ký kết biên bản ghi nhớ hợp tác chiến lược."}
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed font-normal">
          {round === 1 && "Đối tác chiến lược khu vực cam kết đồng hành thúc đẩy tăng trưởng hệ sinh thái dài hạn."}
          {round === 2 && "Quỹ đầu tư nội và ngoại cùng đăng ký gom sạch lượng cổ phiếu trôi nổi, đẩy giá dư mua trần hàng triệu đơn vị."}
          {round === 3 && "Tin đồn rò rỉ cơ quan quản lý mở đợt thanh tra đột xuất các giao dịch có dấu hiệu thao túng giá của VinAlpha Corp."}
          {round === 4 && "Chủ tịch HĐQT phát biểu trấn an cổ đông, khẳng định tình hình tài chính lành mạnh và tin đồn là vô căn cứ."}
          {round === 5 && "Hệ thống sàn giao dịch nghẽn lệnh cục bộ do lượng bán tháo tháo chạy quá lớn, toàn bộ lệnh mua bốc hơi."}
          {round === 6 && "Các chuyên gia khuyến nghị nhà đầu tư giữ cái đầu lạnh, không bán tống bán tháo ở vùng đáy kiệt quệ."}
          {round === 7 && "Báo cáo tài chính quý chính thức phát hành, loại bỏ hoàn toàn tin đồn thất thiệt, dòng tiền thông minh nhập cuộc."}
        </p>

        {hint && (
          <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-start gap-1.5 mt-0.5">
            <CheckCircle2 size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <span className="italic">{hint}</span>
          </div>
        )}
      </div>

      {/* Footer Badges */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
        <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-emerald-700">
          <span>📈</span>
          <span>{impactText}</span>
        </span>
        <span className="text-[11px] text-slate-400 font-medium">Aura Financial Wire</span>
      </div>
    </div>
  );
};

interface FomoHypeRoomProps {
  botChat?: Array<{ sender: string; message: string }>;
  round?: number;
}

export const FomoHypeRoom: React.FC<FomoHypeRoomProps> = ({ botChat, round = 1 }) => {
  const [inputMsg, setInputMsg] = useState("");
  const [localMessages, setLocalMessages] = useState<
    Array<{ sender: string; badge: string; badgeColor: string; time: string; message: string }>
  >([]);

  // Sentiment score and label matrix per round
  let sentimentScore = 68;
  let sentimentLabel = "Tham Lam / Tích Lũy";
  let SentimentIcon = TrendingUp;
  let sentimentColor = "bg-amber-50/80 border-amber-200/90 text-amber-800";

  switch (round) {
    case 1:
      sentimentScore = 68;
      sentimentLabel = "Tham Lam / Tích Lũy";
      SentimentIcon = TrendingUp;
      sentimentColor = "bg-amber-50/80 border-amber-200 text-amber-800";
      break;
    case 2:
      sentimentScore = 94;
      sentimentLabel = "Extreme Greed";
      SentimentIcon = Sparkles;
      sentimentColor = "bg-purple-50 border-purple-200 text-purple-700";
      break;
    case 3:
      sentimentScore = 32;
      sentimentLabel = "Hoảng Loạn / Bán Tháo";
      SentimentIcon = ShieldAlert;
      sentimentColor = "bg-rose-50 border-rose-200 text-rose-700";
      break;
    case 4:
      sentimentScore = 55;
      sentimentLabel = "Nghi Ngờ / Hy Vọng";
      SentimentIcon = TrendingUp;
      sentimentColor = "bg-blue-50 border-blue-200 text-blue-700";
      break;
    case 5:
      sentimentScore = 5;
      sentimentLabel = "Extreme Panic";
      SentimentIcon = Snowflake;
      sentimentColor = "bg-cyan-50 border-cyan-200 text-cyan-800";
      break;
    case 6:
      sentimentScore = 18;
      sentimentLabel = "Chán Nản / Kiệt Quệ";
      SentimentIcon = ShieldAlert;
      sentimentColor = "bg-slate-100 border-slate-200 text-slate-700";
      break;
    case 7:
      sentimentScore = 62;
      sentimentLabel = "Thận Trọng Tích Cực";
      SentimentIcon = TrendingUp;
      sentimentColor = "bg-emerald-50 border-emerald-200 text-emerald-700";
      break;
    default:
      break;
  }

  // Persona round-specific messages matching road1.jpg
  const roundPersonaMessages = [
    {
      round: 1,
      sender: "Trader_Shark88",
      avatar: "S88",
      avatarBg: "bg-amber-500 text-white",
      badge: "VIP 5",
      badgeColor: "bg-amber-100 text-amber-800",
      time: "Vừa xong",
      message: "Kèo này x2 tài khoản nhé! Đang vào pha tích lũy đẹp như tranh vẽ! 🚀🔥",
    },
    {
      round: 1,
      sender: "FO_DiamondHands",
      avatar: "FO",
      avatarBg: "bg-emerald-500 text-white",
      badge: "Margin King",
      badgeColor: "bg-emerald-100 text-emerald-800",
      time: "10s trước",
      message: "Vào sớm ăn dày. Không múc vòng này tí trần lại tiếc hùi hụi! 💎💎",
    },
    {
      round: 1,
      sender: "Broker_Thanh",
      avatar: "BT",
      avatarBg: "bg-sky-400 text-white",
      badge: "Lead Analyst",
      badgeColor: "bg-blue-100 text-blue-800",
      time: "25s trước",
      message: "Tin vừa ra trên báo kìa anh em! Bắt đầu có lệnh gom nhẹ đón sóng.",
    },
    {
      round: 1,
      sender: "BigWhale_99",
      avatar: "BW",
      avatarBg: "bg-slate-900 text-white",
      badge: "Institutional",
      badgeColor: "bg-purple-100 text-purple-800",
      time: "40s trước",
      message: "Dòng tiền lớn đang vào âm thầm, anh em gom theo chân cá mập nhé! 🔥",
    },
    {
      round: 2,
      sender: "Trader_Shark88",
      avatar: "S88",
      avatarBg: "bg-amber-500 text-white",
      badge: "VIP 5",
      badgeColor: "bg-amber-100 text-amber-800",
      time: "Vừa xong",
      message: "Múc nhanh còn kịp anh em ơi! Cây trần thứ 3 liên tiếp rồi, không vào là lỡ sóng thế kỷ! 🚀🚀🚀",
    },
    {
      round: 2,
      sender: "FO_DiamondHands",
      avatar: "FO",
      avatarBg: "bg-emerald-500 text-white",
      badge: "Margin King",
      badgeColor: "bg-emerald-100 text-emerald-800",
      time: "8s trước",
      message: "Tím lịm tìm sim! Đã full margin từ sáng, mục tiêu x3 tài khoản! 💎💎💎",
    },
  ];

  const activeFeed = roundPersonaMessages.filter((m) => m.round === round);

  const handleSend = () => {
    if (!inputMsg.trim()) return;
    setLocalMessages((prev) => [
      ...prev,
      {
        sender: "Bạn (Learner)",
        badge: "Trader",
        badgeColor: "bg-slate-900 text-white",
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
        badgeColor: "bg-slate-900 text-white",
        time: "Vừa xong",
        message: emoji,
      },
    ]);
  };

  return (
    <div className="fomo-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <MessageSquare size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Community VIP Hype Room
              </h3>
              <span className="fomo-live-badge flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                1,420 Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Automated psychological crowd dynamics feed
            </p>
          </div>
        </div>

        {/* Dynamic Sentiment Meter */}
        <div className={`fomo-sentiment-badge ${sentimentColor}`}>
          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800/70 block">
            SENTIMENT METER
          </span>
          <span className="text-xs font-bold flex items-center gap-1 text-emerald-700">
            <SentimentIcon size={12} />
            <span>{sentimentLabel} {sentimentScore}/100</span>
          </span>
        </div>
      </div>

      {/* Chat Messages Feed */}
      <div className="chat-feed-list flex flex-col gap-1 max-h-48 overflow-y-auto pr-1 text-xs">
        {activeFeed.map((chat, idx) => (
          <div key={`seed-${idx}`} className="fomo-chat-item">
            <div className={`w-7 h-7 rounded-full ${chat.avatarBg} font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs`}>
              {chat.avatar}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-slate-900 fomo-chat-sender text-xs">{chat.sender}</span>
                {chat.badge && (
                  <span className={`fomo-role-tag ${chat.badgeColor}`}>
                    {chat.badge}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 ml-auto font-mono">{chat.time}</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-normal text-xs break-words">{chat.message}</p>
            </div>
          </div>
        ))}

        {botChat && botChat.map((bc, idx) => (
          <div key={`bc-${idx}`} className="fomo-chat-item bg-amber-50/50">
            <div className="w-7 h-7 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
              {bc.sender.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-slate-900 fomo-chat-sender text-xs">{bc.sender}</span>
                <span className="fomo-role-tag bg-amber-200 text-amber-900">
                  Bot Signal
                </span>
                <span className="text-[10px] text-slate-400 ml-auto font-mono">Vừa xong</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-normal text-xs break-words">{bc.message}</p>
            </div>
          </div>
        ))}

        {localMessages.map((chat, idx) => (
          <div key={`local-${idx}`} className="fomo-chat-item bg-blue-50/50">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
              ME
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-slate-900 text-xs">{chat.sender}</span>
                <span className="fomo-role-tag bg-slate-200 text-slate-800">
                  Learner
                </span>
                <span className="text-[10px] text-slate-400 ml-auto font-mono">{chat.time}</span>
              </div>
              <p className="text-slate-800 leading-relaxed font-medium text-xs break-words">{chat.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Emoji Reactions */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
        <span className="text-[11px] text-slate-400 font-medium">Thả cảm xúc nhanh:</span>
        {["🚀", "💎", "🏦", "📈"].map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleQuickEmoji(emoji)}
            className="fomo-emoji-btn"
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
          disabled={round === 5}
          onChange={(e) => setInputMsg(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder={round === 5 ? "Sàn nghẽn lệnh... Chat bị hạn chế tạm thời (Slow mode)" : "Gửi tin nhắn hoặc thả cảm xúc FOMO..."}
          className="fomo-chat-input disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          disabled={round === 5}
          onClick={handleSend}
          className="fomo-chat-send-btn disabled:opacity-50"
        >
          <span>Gửi</span>
          <Send size={11} />
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
  round?: number;
}> = ({ news, botChat, hint, round }) => {
  return (
    <div className="fomo-newsfeed-composite flex flex-col gap-4">
      <FomoNewsCard news={news} hint={hint} round={round} />
      <FomoHypeRoom botChat={botChat} round={round} />
    </div>
  );
};
