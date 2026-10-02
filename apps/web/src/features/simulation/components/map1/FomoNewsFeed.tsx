import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Snowflake, Sparkles, TrendingUp, ShieldAlert, CheckCircle2 } from "lucide-react";
import { MAP1_ROUNDS_DATA, type Map1ChatMessage } from "../../data/map1-fomo-dataset";

interface FomoNewsCardProps {
  news?: string;
  hint?: string;
  round?: number;
}

export const FomoNewsCard: React.FC<FomoNewsCardProps> = ({ news, hint, round = 1 }) => {
  const roundData = MAP1_ROUNDS_DATA[round] || MAP1_ROUNDS_DATA[1];
  const breakingNews = roundData?.breakingNews;

  // Sentiment category styling matrix
  const categoryBadge = breakingNews?.category || "TIN DOANH NGHIỆP";
  let categoryColor = "bg-teal-50 text-teal-700 border-teal-200";
  const timestamp = breakingNews?.timestamp || "2 phút trước";
  const impactText = breakingNews?.impactText || "Độ tích cực: Khá cao";

  switch (round) {
    case 1:
      categoryColor = "bg-teal-50 text-teal-700 border-teal-200";
      break;
    case 2:
      categoryColor = "bg-purple-50 text-purple-700 border-purple-200";
      break;
    case 3:
      categoryColor = "bg-rose-50 text-rose-700 border-rose-200";
      break;
    case 4:
      categoryColor = "bg-amber-50 text-amber-700 border-amber-200";
      break;
    case 5:
      categoryColor = "bg-cyan-50 text-cyan-800 border-cyan-300";
      break;
    case 6:
      categoryColor = "bg-slate-100 text-slate-700 border-slate-300";
      break;
    case 7:
      categoryColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
      break;
    default:
      break;
  }

  const headline = news || breakingNews?.headline || "Công ty công bố ký kết biên bản ghi nhớ hợp tác chiến lược.";
  const summary = breakingNews?.narrativeSummary || "Thông tin thị trường quan trọng tác động trực tiếp đến tâm lý giao dịch.";

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
          {headline}
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed font-normal">
          {summary}
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

interface StreamedChatMessage extends Map1ChatMessage {
  addedAt?: number;
}

interface FomoHypeRoomProps {
  botChat?: Array<{ sender: string; message: string }>;
  round?: number;
}

export const FomoHypeRoom: React.FC<FomoHypeRoomProps> = ({ botChat, round = 1 }) => {
  const [inputMsg, setInputMsg] = useState("");
  const [streamedMessages, setStreamedMessages] = useState<StreamedChatMessage[]>([]);
  const [userMessages, setUserMessages] = useState<StreamedChatMessage[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const roundData = MAP1_ROUNDS_DATA[round] || MAP1_ROUNDS_DATA[1];
  const sentiment = roundData?.sentiment || { label: "Tham Lam / Tích Lũy", score: 68, color: "amber" };

  // Update clock every second for live relative timestamps
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format relative time: "Vừa xong", "3s trước", "8s trước"
  const getRelativeTime = (addedAt?: number, fallback = "Vừa xong"): string => {
    if (!addedAt) return fallback;
    const elapsedSec = Math.max(0, Math.floor((currentTime - addedAt) / 1000));
    if (elapsedSec < 3) return "Vừa xong";
    if (elapsedSec < 60) return `${elapsedSec}s trước`;
    return `${Math.floor(elapsedSec / 60)}m trước`;
  };

  const normalizeChatMessage = (
    item: Partial<Map1ChatMessage> & { user?: string; avatarColor?: string },
    fallbackTime = "Vừa xong",
    addedAt?: number
  ): StreamedChatMessage => ({
    ...item,
    id: String(item.id || item.second || Math.random()),
    sender: String(item.sender || item.user || "Trader"),
    time: String(item.time || fallbackTime),
    message: String(item.message || ""),
    avatar: item.avatar || (item.user ? String(item.user).slice(0, 2).toUpperCase() : undefined),
    avatarBg: item.avatarBg || (item.avatarColor ? `bg-${item.avatarColor}-500 text-white` : undefined),
    badge: item.badge || undefined,
    addedAt: addedAt || Date.now(),
  });

  // Dynamic message streaming engine (2 initial messages + new message every 3-6s)
  useEffect(() => {
    const feed = roundData?.hypeRoomFeed || [];
    if (feed.length === 0) return;

    // Start with first 2 messages
    const now = Date.now();
    const initialMsgs: StreamedChatMessage[] = feed.slice(0, 2).map((item, idx) =>
      normalizeChatMessage(item, "Vừa xong", now - (2 - idx) * 12000)
    );
    setStreamedMessages(initialMsgs);
    setUserMessages([]);

    let nextIndex = 2;
    let timeoutId: NodeJS.Timeout;

    const streamNext = () => {
      // 3 to 6 seconds random interval
      const delay = Math.floor(Math.random() * 3000) + 3000;
      timeoutId = setTimeout(() => {
        if (nextIndex < feed.length) {
          const rawItem = feed[nextIndex];
          if (rawItem) {
            const nextItem = normalizeChatMessage(rawItem, "Vừa xong", Date.now());
            setStreamedMessages((prev) => [...prev, nextItem]);
          }
          nextIndex++;
        } else {
          // Loop or pick random message from the pool
          const randomItem = feed[Math.floor(Math.random() * feed.length)];
          if (randomItem) {
            const nextItem = normalizeChatMessage(randomItem, "Vừa xong", Date.now());
            setStreamedMessages((prev) => [
              ...prev,
              {
                ...nextItem,
                id: `rep-${Date.now()}`,
              },
            ]);
          }
        }
        streamNext();
      }, delay);
    };

    streamNext();

    return () => clearTimeout(timeoutId);
  }, [round, roundData?.hypeRoomFeed]);

  // Auto-scroll strictly inside the chat container without touching window scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [streamedMessages.length, userMessages.length, botChat?.length]);

  // Handle user sending chat
  const handleSend = () => {
    if (!inputMsg.trim()) return;
    const newMsg: StreamedChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "Bạn (Learner)",
      avatar: "ME",
      avatarBg: "bg-slate-900 text-white",
      badge: "Trader",
      badgeColor: "bg-slate-900 text-white",
      time: "Vừa xong",
      message: inputMsg.trim(),
      addedAt: Date.now(),
    };
    setUserMessages((prev) => [...prev, newMsg]);
    setInputMsg("");
  };

  const handleQuickEmoji = (emoji: string) => {
    const newMsg: StreamedChatMessage = {
      id: `usr-emj-${Date.now()}`,
      sender: "Bạn (Learner)",
      avatar: "ME",
      avatarBg: "bg-slate-900 text-white",
      badge: "Trader",
      badgeColor: "bg-slate-900 text-white",
      time: "Vừa xong",
      message: emoji,
      addedAt: Date.now(),
    };
    setUserMessages((prev) => [...prev, newMsg]);
  };

  // Sentiment visuals
  let SentimentIcon = TrendingUp;
  let sentimentColor = "bg-amber-50/80 border-amber-200 text-amber-800";
  if (round === 2) {
    SentimentIcon = Sparkles;
    sentimentColor = "bg-purple-50 border-purple-200 text-purple-700";
  } else if (round === 3) {
    SentimentIcon = ShieldAlert;
    sentimentColor = "bg-rose-50 border-rose-200 text-rose-700";
  } else if (round === 5) {
    SentimentIcon = Snowflake;
    sentimentColor = "bg-cyan-50 border-cyan-200 text-cyan-800";
  }

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
            <span>{sentiment.label} {sentiment.score}/100</span>
          </span>
        </div>
      </div>

      {/* Chat Messages Feed with Streaming Bot Animation */}
      <div
        ref={chatContainerRef}
        className="chat-feed-list flex flex-col gap-1 max-h-48 overflow-y-auto pr-1 text-xs"
      >
        {streamedMessages.map((chat, idx) => (
          <div
            key={chat.id || `stream-${idx}`}
            className="fomo-chat-item fomo-stream-msg"
          >
            <div className={`w-7 h-7 rounded-full ${chat.avatarBg || "bg-amber-500 text-white"} font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs`}>
              {chat.avatar || chat.sender.slice(0, 2).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-slate-900 fomo-chat-sender text-xs">{chat.sender}</span>
                {chat.badge && (
                  <span className={`fomo-role-tag ${chat.badgeColor || "bg-amber-100 text-amber-800"}`}>
                    {chat.badge}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 ml-auto font-mono">
                  {getRelativeTime(chat.addedAt, chat.time)}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed font-normal text-xs break-words">{chat.message}</p>
            </div>
          </div>
        ))}

        {botChat && botChat.map((bc, idx) => (
          <div key={`bc-${idx}`} className="fomo-chat-item bg-amber-50/50 fomo-stream-msg">
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

        {userMessages.map((chat) => (
          <div key={chat.id} className="fomo-chat-item bg-blue-50/50 fomo-stream-msg">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
              ME
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-slate-900 text-xs">{chat.sender}</span>
                <span className="fomo-role-tag bg-slate-200 text-slate-800">
                  Learner
                </span>
                <span className="text-[10px] text-slate-400 ml-auto font-mono">
                  {getRelativeTime(chat.addedAt, "Vừa xong")}
                </span>
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
  news?: string;
  botChat?: Array<{ sender: string; message: string }>;
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
