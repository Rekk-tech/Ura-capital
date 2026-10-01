import React, { useState } from "react";
import { MessageSquare, Flame, Send, AlertTriangle, Snowflake, Sparkles, TrendingUp, ShieldAlert, CheckCircle2 } from "lucide-react";

interface FomoNewsCardProps {
  news: string;
  hint?: string;
  round?: number;
}

export const FomoNewsCard: React.FC<FomoNewsCardProps> = ({ news, hint, round = 1 }) => {
  // Category badge & impact indicator matrix per round
  let categoryBadge = "TIN DOANH NGHIỆP";
  let categoryColor = "bg-blue-50 text-blue-700 border-blue-200";
  let timestamp = "2 phút trước";
  let impactText = "⚡ Độ tích cực: Khá cao";
  let impactColor = "bg-emerald-50 text-emerald-700 border-emerald-200";

  switch (round) {
    case 1:
      categoryBadge = "TIN DOANH NGHIỆP";
      categoryColor = "bg-blue-50 text-blue-700 border-blue-200";
      timestamp = "2 phút trước";
      impactText = "⚡ Độ tích cực: Khá cao";
      impactColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
      break;
    case 2:
      categoryBadge = "TIN NÓNG ĐẶC BIỆT";
      categoryColor = "bg-purple-50 text-purple-700 border-purple-200";
      timestamp = "30 giây trước";
      impactText = "🔥 Độ tích cực: Cực đại (FOMO Peak)";
      impactColor = "bg-purple-50 text-purple-700 border-purple-200";
      break;
    case 3:
      categoryBadge = "TIN ĐỒN KHẨN CẤP";
      categoryColor = "bg-rose-50 text-rose-700 border-rose-200";
      timestamp = "Vừa xong";
      impactText = "⚠️ Áp lực bán tháo: Báo động đỏ";
      impactColor = "bg-rose-50 text-rose-700 border-rose-200";
      break;
    case 4:
      categoryBadge = "ĐÍNH CHÍNH CHÍNH THỨC";
      categoryColor = "bg-amber-50 text-amber-700 border-amber-200";
      timestamp = "1 phút trước";
      impactText = "🔄 Tác động: Hồi phục kỹ thuật ngắn hạn";
      impactColor = "bg-blue-50 text-blue-700 border-blue-200";
      break;
    case 5:
      categoryBadge = "CẢNH BÁO THANH KHOẢN";
      categoryColor = "bg-cyan-50 text-cyan-800 border-cyan-300";
      timestamp = "Khẩn cấp";
      impactText = "❄️ Áp lực bán tháo: Cực độ (Mất thanh khoản)";
      impactColor = "bg-cyan-50 text-cyan-800 border-cyan-300";
      break;
    case 6:
      categoryBadge = "NHẬN ĐỊNH CHUYÊN GIA";
      categoryColor = "bg-slate-100 text-slate-700 border-slate-300";
      timestamp = "3 phút trước";
      impactText = "🛡️ Tâm lý thị trường: Chán nản cùng cực";
      impactColor = "bg-slate-100 text-slate-700 border-slate-300";
      break;
    case 7:
      categoryBadge = "BÁO CÁO TÀI CHÍNH";
      categoryColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
      timestamp = "5 phút trước";
      impactText = "💎 Dòng tiền: Phân hóa cổ phiếu cơ bản";
      impactColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
      break;
    default:
      break;
  }

  return (
    <div className="fomo-news-card card-aura p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex flex-col justify-between gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-xs ${categoryColor}`}>
            {categoryBadge}
          </span>
        </div>
        <span className="text-xs text-slate-400 font-medium font-mono">{timestamp}</span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
          {news || "Công ty công bố ký kết biên bản ghi nhớ hợp tác chiến lược dự án trọng điểm."}
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          {round === 1 && "Dự án hợp tác chiến lược mở ra tiềm năng tăng trưởng doanh thu 300% cho VinAlpha Corp trong các quý tới."}
          {round === 2 && "Quỹ đầu tư nội và ngoại cùng đăng ký gom sạch lượng cổ phiếu trôi nổi, đẩy giá dư mua trần hàng triệu đơn vị."}
          {round === 3 && "Tin đồn rò rỉ cơ quan quản lý mở đợt thanh tra đột xuất các giao dịch có dấu hiệu thao túng giá của VinAlpha Corp."}
          {round === 4 && "Chủ tịch HĐQT phát biểu trấn an cổ đông, khẳng định tình hình tài chính lành mạnh và tin đồn là vô căn cứ."}
          {round === 5 && "Hệ thống sàn giao dịch nghẽn lệnh cục bộ do lượng bán tháo tháo chạy quá lớn, toàn bộ lệnh mua bốc hơi."}
          {round === 6 && "Các chuyên gia khuyến nghị nhà đầu tư giữ cái đầu lạnh, không bán tống bán tháo ở vùng đáy kiệt quệ."}
          {round === 7 && "Báo cáo tài chính quý chính thức phát hành, loại bỏ hoàn toàn tin đồn thất thiệt, dòng tiền thông minh nhập cuộc."}
        </p>

        {hint && (
          <div className="text-xs text-amber-800 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 flex items-start gap-1.5 mt-0.5">
            <CheckCircle2 size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <span className="italic">{hint}</span>
          </div>
        )}
      </div>

      {/* Footer Badges */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${impactColor}`}>
          {impactText}
        </span>
        <span className="text-[10px] text-slate-400 font-medium">Aura Financial Wire</span>
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

  // Sentiment score and label matrix per round
  let sentimentScore = 68;
  let sentimentLabel = "Tham Lam";
  let SentimentIcon = Flame;
  let sentimentColor = "bg-amber-500/10 border-amber-500/30 text-amber-700";

  switch (round) {
    case 1:
      sentimentScore = 68;
      sentimentLabel = "Tham Lam";
      SentimentIcon = TrendingUp;
      sentimentColor = "bg-emerald-500/10 border-emerald-500/30 text-emerald-700";
      break;
    case 2:
      sentimentScore = 94;
      sentimentLabel = "Extreme Greed";
      SentimentIcon = Sparkles;
      sentimentColor = "bg-purple-500/15 border-purple-500/30 text-purple-700";
      break;
    case 3:
      sentimentScore = 35;
      sentimentLabel = "Hoang Mang";
      SentimentIcon = AlertTriangle;
      sentimentColor = "bg-rose-500/15 border-rose-500/30 text-rose-700";
      break;
    case 4:
      sentimentScore = 55;
      sentimentLabel = "Nghi Ngờ / Hy Vọng";
      SentimentIcon = TrendingUp;
      sentimentColor = "bg-blue-500/10 border-blue-500/30 text-blue-700";
      break;
    case 5:
      sentimentScore = 5;
      sentimentLabel = "Extreme Panic";
      SentimentIcon = Snowflake;
      sentimentColor = "bg-cyan-500/15 border-cyan-500/30 text-cyan-800";
      break;
    case 6:
      sentimentScore = 18;
      sentimentLabel = "Chán Nản / Kiệt Quệ";
      SentimentIcon = ShieldAlert;
      sentimentColor = "bg-slate-500/10 border-slate-500/30 text-slate-700";
      break;
    case 7:
      sentimentScore = 62;
      sentimentLabel = "Thận Trọng Tích Cực";
      SentimentIcon = TrendingUp;
      sentimentColor = "bg-emerald-500/10 border-emerald-500/30 text-emerald-700";
      break;
    default:
      break;
  }

  // Persona round-specific messages
  const roundPersonaMessages = [
    {
      round: 1,
      sender: "Trader_Shark88",
      badge: "VIP 5",
      badgeColor: "bg-amber-100 text-amber-800",
      time: "Vừa xong",
      message: "Kèo này x2 tài khoản nhé anh em! Tích lũy đủ rồi, vào sớm ăn dày! 🚀",
    },
    {
      round: 1,
      sender: "FO_DiamondHands",
      badge: "Margin King",
      badgeColor: "bg-emerald-100 text-emerald-800",
      time: "10s trước",
      message: "Vừa khớp 50% tiền thịt! Chuẩn bị đón sóng thần VinAlpha Corp!",
    },
    {
      round: 2,
      sender: "Trader_Shark88",
      badge: "VIP 5",
      badgeColor: "bg-amber-100 text-amber-800",
      time: "Vừa xong",
      message: "Múc nhanh còn kịp anh em ơi! Cây trần thứ 3 liên tiếp rồi, không vào là lỡ sóng thế kỷ! 🚀🚀🚀",
    },
    {
      round: 2,
      sender: "FO_DiamondHands",
      badge: "Margin King",
      badgeColor: "bg-emerald-100 text-emerald-800",
      time: "8s trước",
      message: "Tím lịm tìm sim! Đã full margin từ sáng, mục tiêu x3 tài khoản! 💎💎💎",
    },
    {
      round: 2,
      sender: "BigWhale_99",
      badge: "Institutional",
      badgeColor: "bg-purple-100 text-purple-800",
      time: "25s trước",
      message: "Lệnh gom 500k cổ phiếu vừa vào quét sạch bảng điện! Chuẩn bị trắng bên bán toàn tập! 🔥",
    },
    {
      round: 2,
      sender: "Broker_Thanh",
      badge: "Lead Analyst",
      badgeColor: "bg-blue-100 text-blue-800",
      time: "40s trước",
      message: "Tin mật từ ban lãnh đạo sắp ra, ai chưa có hàng tranh thủ đớp ngay giá trần!",
    },
    {
      round: 3,
      sender: "Broker_Thanh",
      badge: "Lead Analyst",
      badgeColor: "bg-blue-100 text-blue-800",
      time: "Vừa xong",
      message: "Thanh tra chỉ là tin đồn vô căn cứ! Đội lái rung cây dọa khỉ thôi, mở Margin x5 bắt đáy ngay!",
    },
    {
      round: 3,
      sender: "Trader_Shark88",
      badge: "VIP 5",
      badgeColor: "bg-rose-100 text-rose-800",
      time: "12s trước",
      message: "Ai xả vậy trời? Vừa khớp sàn 1 triệu cổ! Bình tĩnh anh em ơi!",
    },
    {
      round: 4,
      sender: "FO_DiamondHands",
      badge: "Margin King",
      badgeColor: "bg-emerald-100 text-emerald-800",
      time: "Vừa xong",
      message: "Thấy chưa! Chủ tịch lên tiếng là xanh lại ngay! Bắt đáy thành công ăn trọn cây hồi! 🚀",
    },
    {
      round: 5,
      sender: "Trader_Shark88",
      badge: "VIP 5",
      badgeColor: "bg-cyan-100 text-cyan-800",
      time: "Vừa xong",
      message: "Cứu với! Sao bấm nút BÁN không được? Sàn nghẽn lệnh rồi! Trắng bên mua!",
    },
    {
      round: 5,
      sender: "FO_DiamondHands",
      badge: "Margin King",
      badgeColor: "bg-cyan-100 text-cyan-800",
      time: "15s trước",
      message: "Chết rồi, Call margin treo lơ lửng... Chất sàn 5 triệu cổ không ai mua!",
    },
    {
      round: 6,
      sender: "BigWhale_99",
      badge: "Institutional",
      badgeColor: "bg-slate-200 text-slate-800",
      time: "Vừa xong",
      message: "Lượng hàng hoảng loạn cắt lỗ đã cạn. Vùng đáy bắt đầu xuất hiện lực cầu thăm dò.",
    },
    {
      round: 7,
      sender: "Broker_Thanh",
      badge: "Lead Analyst",
      badgeColor: "bg-blue-100 text-blue-800",
      time: "Vừa xong",
      message: "Báo cáo tài chính quá đẹp! Dòng tiền lớn quay trở lại cổ phiếu cơ bản!",
    },
  ];

  const currentRoundMessages = roundPersonaMessages.filter((m) => m.round === round);
  const activeFeed = currentRoundMessages.length > 0 ? currentRoundMessages : roundPersonaMessages.slice(0, 4);

  const [localMessages, setLocalMessages] = useState<Array<{ sender: string; badge?: string; badgeColor?: string; time: string; message: string }>>([]);

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
    <div className="fomo-hype-room card-aura p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex flex-col gap-3.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
            <MessageSquare size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Community VIP Hype Room
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                1,420 Live
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Kênh thảo luận tâm lý đám đông thời gian thực
            </p>
          </div>
        </div>

        {/* Dynamic Sentiment Meter */}
        <div className={`self-start sm:self-center px-3 py-1.5 rounded-xl border flex flex-col items-end ${sentimentColor}`}>
          <span className="text-[9px] font-black uppercase tracking-wider opacity-80">
            SENTIMENT METER
          </span>
          <span className="text-xs font-black flex items-center gap-1 font-mono">
            <SentimentIcon size={13} />
            <span>{sentimentLabel} {sentimentScore}/100</span>
          </span>
        </div>
      </div>

      {/* Chat Messages Feed */}
      <div className="chat-feed-list flex flex-col gap-2.5 max-h-44 sm:max-h-52 overflow-y-auto pr-1 text-xs">
        {activeFeed.map((chat, idx) => (
          <div key={`seed-${idx}`} className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50/70 hover:bg-slate-100/60 transition-colors">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
              {chat.sender.slice(0, 2).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-slate-900 truncate">{chat.sender}</span>
                {chat.badge && (
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${chat.badgeColor}`}>
                    {chat.badge}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 ml-auto font-mono">{chat.time}</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-medium text-xs break-words">{chat.message}</p>
            </div>
          </div>
        ))}

        {botChat && botChat.map((bc, idx) => (
          <div key={`bc-${idx}`} className="flex items-start gap-2.5 p-2 rounded-xl bg-amber-50/70 border border-amber-200/50">
            <div className="w-7 h-7 rounded-full bg-amber-500 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
              {bc.sender.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-slate-900 truncate">{bc.sender}</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-200 text-amber-900">
                  Bot Signal
                </span>
                <span className="text-[10px] text-slate-400 ml-auto font-mono">Vừa xong</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-medium text-xs break-words">{bc.message}</p>
            </div>
          </div>
        ))}

        {localMessages.map((chat, idx) => (
          <div key={`local-${idx}`} className="flex items-start gap-2.5 p-2 rounded-xl bg-blue-50/70 border border-blue-200/50">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
              ME
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-slate-900">{chat.sender}</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200 text-slate-800">
                  Learner
                </span>
                <span className="text-[10px] text-slate-400 ml-auto font-mono">{chat.time}</span>
              </div>
              <p className="text-slate-800 leading-relaxed font-semibold text-xs break-words">{chat.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Emoji Reactions */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
        <span className="text-[11px] text-slate-400 font-medium">Thả biểu cảm nhanh:</span>
        {["🚀", "💎", "🏦", "📈"].map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleQuickEmoji(emoji)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-transform active:scale-90 text-sm shadow-xs"
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
          placeholder={round === 5 ? "Sàn nghẽn lệnh... Chat bị hạn chế tạm thời (Slow mode)" : "Gửi tin nhắn hoặc phản hồi tâm lý..."}
          className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/70 disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          disabled={round === 5}
          onClick={handleSend}
          className="btn btn-primary py-2 px-4 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1 shadow-xs active:scale-95 disabled:opacity-50"
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
  round?: number;
}> = ({ news, botChat, hint, round }) => {
  return (
    <div className="fomo-newsfeed-composite flex flex-col gap-4">
      <FomoNewsCard news={news} hint={hint} round={round} />
      <FomoHypeRoom botChat={botChat} round={round} />
    </div>
  );
};
