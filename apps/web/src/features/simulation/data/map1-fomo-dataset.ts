/**
 * Map 1: FOMO Arena Complete Dataset
 * Bundled from docs/data_map_1
 */

export interface Map1Tick {
  second: number;
  price: number;
  volume: number;
  candleState: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
}

export interface Map1ChatMessage {
  id?: string;
  round?: number;
  second?: number;
  sender: string;
  avatar?: string;
  avatarBg?: string;
  badge?: string;
  badgeColor?: string;
  time: string;
  message: string;
  [key: string]: unknown;
}

export interface Map1MatchingTapeItem {
  id: string;
  timeSecond?: number;
  second?: number;
  shares: number;
  price: number;
  side: "BUY" | "SELL";
  prefix?: string;
  text?: string;
  [key: string]: unknown;
}

export interface Map1QuizOption {
  id: string;
  text?: string;
  label?: string;
  isCorrect?: boolean;
  isAggressive?: boolean;
}

export interface Map1QuizItem {
  hasTrapOrQuiz: boolean;
  triggerSecond: number | null;
  type: string | null;
  title: string | null;
  question: string | null;
  prompt?: string | null;
  timeLimit: number | null;
  options: Map1QuizOption[];
  correctOptionId: string | null;
  psychologicalBias: string | null;
  explanation: string | null;
  [key: string]: unknown;
}

export interface Map1RoundData {
  roundId: number;
  roundName: string;
  narrativeStage: string;
  sentiment: {
    label: string;
    score: number;
    color: string;
  };
  marketSummary: {
    referencePrice: number;
    ceilingPrice: number;
    floorPrice: number;
    openPrice: number;
    expectedClose: number;
    statusBadge: string;
    statusColor: string;
    [key: string]: unknown;
  };
  tickSeries: Map1Tick[];
  matchingTape: Map1MatchingTapeItem[];
  hypeRoomFeed: Map1ChatMessage[];
  breakingNews: {
    headline: string;
    category: string;
    badge?: string;
    timestamp: string;
    impactText: string;
    narrativeSummary: string;
    [key: string]: unknown;
  };
  trapOrQuiz: Map1QuizItem;
  specialMechanic?: {
    type: string;
    name?: string;
    leverage?: number;
    unlockSecond?: number;
    fromSecond?: number;
    toSecond?: number;
    triggerSecond?: number;
    description: string;
  } | null;
}

export const MAP1_ROUNDS_DATA: Record<number, Map1RoundData> = {
  "1": {
    "roundId": 1,
    "roundName": "Khởi Động",
    "narrativeStage": "Accumulation (Tích lũy)",
    "sentiment": {
      "label": "Tham Lam / Tích Lũy",
      "score": 68,
      "color": "amber"
    },
    "marketSummary": {
      "referencePrice": 45000,
      "ceilingPrice": 48100,
      "floorPrice": 42100,
      "openPrice": 45000,
      "expectedClose": 46350,
      "statusBadge": "+3.0% TĂNG NHẸ (TÍCH LŨY)",
      "statusColor": "emerald"
    },
    "tickSeries": [
      {
        "second": 1.5,
        "price": 45050,
        "volume": 13500,
        "candleState": {
          "open": 45000,
          "high": 45050,
          "low": 45000,
          "close": 45050
        }
      },
      {
        "second": 3,
        "price": 45100,
        "volume": 21000,
        "candleState": {
          "open": 45050,
          "high": 45100,
          "low": 45050,
          "close": 45100
        }
      },
      {
        "second": 4.5,
        "price": 45100,
        "volume": 28500,
        "candleState": {
          "open": 45100,
          "high": 45100,
          "low": 45100,
          "close": 45100
        }
      },
      {
        "second": 6,
        "price": 45150,
        "volume": 36000,
        "candleState": {
          "open": 45100,
          "high": 45150,
          "low": 45100,
          "close": 45150
        }
      },
      {
        "second": 7.5,
        "price": 45250,
        "volume": 43500,
        "candleState": {
          "open": 45150,
          "high": 45250,
          "low": 45150,
          "close": 45250
        }
      },
      {
        "second": 9,
        "price": 45250,
        "volume": 51000,
        "candleState": {
          "open": 45250,
          "high": 45250,
          "low": 45250,
          "close": 45250
        }
      },
      {
        "second": 10.5,
        "price": 45300,
        "volume": 58500,
        "candleState": {
          "open": 45250,
          "high": 45300,
          "low": 45250,
          "close": 45300
        }
      },
      {
        "second": 12,
        "price": 45350,
        "volume": 66000,
        "candleState": {
          "open": 45300,
          "high": 45350,
          "low": 45300,
          "close": 45350
        }
      },
      {
        "second": 13.5,
        "price": 45450,
        "volume": 73500,
        "candleState": {
          "open": 45350,
          "high": 45450,
          "low": 45350,
          "close": 45450
        }
      },
      {
        "second": 15,
        "price": 45450,
        "volume": 81000,
        "candleState": {
          "open": 45450,
          "high": 45450,
          "low": 45450,
          "close": 45450
        }
      },
      {
        "second": 16.5,
        "price": 45450,
        "volume": 88500,
        "candleState": {
          "open": 45450,
          "high": 45450,
          "low": 45450,
          "close": 45450
        }
      },
      {
        "second": 18,
        "price": 45550,
        "volume": 96000,
        "candleState": {
          "open": 45450,
          "high": 45550,
          "low": 45450,
          "close": 45550
        }
      },
      {
        "second": 19.5,
        "price": 45600,
        "volume": 103500,
        "candleState": {
          "open": 45550,
          "high": 45600,
          "low": 45550,
          "close": 45600
        }
      },
      {
        "second": 21,
        "price": 45600,
        "volume": 111000,
        "candleState": {
          "open": 45600,
          "high": 45600,
          "low": 45600,
          "close": 45600
        }
      },
      {
        "second": 22.5,
        "price": 45650,
        "volume": 118500,
        "candleState": {
          "open": 45600,
          "high": 45650,
          "low": 45600,
          "close": 45650
        }
      },
      {
        "second": 24,
        "price": 45750,
        "volume": 126000,
        "candleState": {
          "open": 45650,
          "high": 45750,
          "low": 45650,
          "close": 45750
        }
      },
      {
        "second": 25.5,
        "price": 45750,
        "volume": 133500,
        "candleState": {
          "open": 45750,
          "high": 45750,
          "low": 45750,
          "close": 45750
        }
      },
      {
        "second": 27,
        "price": 45800,
        "volume": 141000,
        "candleState": {
          "open": 45750,
          "high": 45800,
          "low": 45750,
          "close": 45800
        }
      },
      {
        "second": 28.5,
        "price": 45850,
        "volume": 148500,
        "candleState": {
          "open": 45800,
          "high": 45850,
          "low": 45800,
          "close": 45850
        }
      },
      {
        "second": 30,
        "price": 45950,
        "volume": 156000,
        "candleState": {
          "open": 45850,
          "high": 45950,
          "low": 45850,
          "close": 45950
        }
      },
      {
        "second": 31.5,
        "price": 45950,
        "volume": 163500,
        "candleState": {
          "open": 45950,
          "high": 45950,
          "low": 45950,
          "close": 45950
        }
      },
      {
        "second": 33,
        "price": 45950,
        "volume": 171000,
        "candleState": {
          "open": 45950,
          "high": 45950,
          "low": 45950,
          "close": 45950
        }
      },
      {
        "second": 34.5,
        "price": 46050,
        "volume": 178500,
        "candleState": {
          "open": 45950,
          "high": 46050,
          "low": 45950,
          "close": 46050
        }
      },
      {
        "second": 36,
        "price": 46100,
        "volume": 186000,
        "candleState": {
          "open": 46050,
          "high": 46100,
          "low": 46050,
          "close": 46100
        }
      },
      {
        "second": 37.5,
        "price": 46100,
        "volume": 193500,
        "candleState": {
          "open": 46100,
          "high": 46100,
          "low": 46100,
          "close": 46100
        }
      },
      {
        "second": 39,
        "price": 46150,
        "volume": 201000,
        "candleState": {
          "open": 46100,
          "high": 46150,
          "low": 46100,
          "close": 46150
        }
      },
      {
        "second": 40.5,
        "price": 46250,
        "volume": 208500,
        "candleState": {
          "open": 46150,
          "high": 46250,
          "low": 46150,
          "close": 46250
        }
      },
      {
        "second": 42,
        "price": 46250,
        "volume": 216000,
        "candleState": {
          "open": 46250,
          "high": 46250,
          "low": 46250,
          "close": 46250
        }
      },
      {
        "second": 43.5,
        "price": 46250,
        "volume": 223500,
        "candleState": {
          "open": 46250,
          "high": 46250,
          "low": 46250,
          "close": 46250
        }
      },
      {
        "second": 45,
        "price": 46350,
        "volume": 231000,
        "candleState": {
          "open": 46250,
          "high": 46350,
          "low": 46250,
          "close": 46350
        }
      }
    ],
    "matchingTape": [
      {
        "id": "tape-1-0",
        "timeSecond": 3,
        "second": 3,
        "shares": 1000,
        "price": 45000,
        "side": "BUY",
        "text": "↑ +15,000 CP @ 45,200 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-1-1",
        "timeSecond": 6.5,
        "second": 6.5,
        "shares": 1500,
        "price": 45000,
        "side": "BUY",
        "text": "↑ +8,000 CP @ 45,350 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-1-2",
        "timeSecond": 10,
        "second": 10,
        "shares": 2000,
        "price": 45000,
        "side": "BUY",
        "text": "↑ +22,000 CP @ 45,500 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-1-3",
        "timeSecond": 13.5,
        "second": 13.5,
        "shares": 2500,
        "price": 45000,
        "side": "SELL",
        "text": "↓ -12,000 CP @ 45,650 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-1-4",
        "timeSecond": 17,
        "second": 17,
        "shares": 3000,
        "price": 45000,
        "side": "BUY",
        "text": "↑ +30,000 CP @ 45,800 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-1-5",
        "timeSecond": 20.5,
        "second": 20.5,
        "shares": 3500,
        "price": 45000,
        "side": "BUY",
        "text": "↑ +18,000 CP @ 46,000 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-1-6",
        "timeSecond": 24,
        "second": 24,
        "shares": 4000,
        "price": 45000,
        "side": "SELL",
        "text": "↓ -9,000 CP @ 46,050 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-1-7",
        "timeSecond": 27.5,
        "second": 27.5,
        "shares": 4500,
        "price": 45000,
        "side": "BUY",
        "text": "↑ +25,000 CP @ 46,200 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-1-8",
        "timeSecond": 31,
        "second": 31,
        "shares": 5000,
        "price": 45000,
        "side": "BUY",
        "text": "↑ +17,000 CP @ 46,300 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-1-9",
        "timeSecond": 34.5,
        "second": 34.5,
        "shares": 5500,
        "price": 45000,
        "side": "BUY",
        "text": "↑ +11,000 CP @ 46,350 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-1-10",
        "timeSecond": 38,
        "second": 38,
        "shares": 6000,
        "price": 45000,
        "side": "SELL",
        "text": "↓ -7,000 CP @ 46,250 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-1-11",
        "timeSecond": 41.5,
        "second": 41.5,
        "shares": 6500,
        "price": 45000,
        "side": "BUY",
        "text": "↑ +14,000 CP @ 46,350 (BUY)",
        "prefix": "↑"
      }
    ],
    "hypeRoomFeed": [
      {
        "id": "chat-1-0",
        "round": 1,
        "second": 4,
        "sender": "Trader_Shark88",
        "avatar": "TR",
        "avatarBg": "amber",
        "badge": "VIP 5",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "4s trước",
        "message": "Có vẻ tay to đang gom, bảng giá khá bình tĩnh."
      },
      {
        "id": "chat-1-1",
        "round": 1,
        "second": 10.2,
        "sender": "F0MO_Hunter",
        "avatar": "F0",
        "avatarBg": "emerald",
        "badge": "F0",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "10.2s trước",
        "message": "Mình thấy volume nhích dần, chưa cần FOMO đâu."
      },
      {
        "id": "chat-1-2",
        "round": 1,
        "second": 16.4,
        "sender": "NhaDauTuF0",
        "avatar": "NH",
        "avatarBg": "slate",
        "badge": "F0",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "16.4s trước",
        "message": "Kèo này mà vượt 46k là room lại tím cho xem 😂"
      },
      {
        "id": "chat-1-3",
        "round": 1,
        "second": 22.6,
        "sender": "KẹpHàng2026",
        "avatar": "KẸ",
        "avatarBg": "red",
        "badge": "VIP 3",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "22.6s trước",
        "message": "Nghe nói có insider đang tích lũy? Ai xác nhận không?"
      },
      {
        "id": "chat-1-4",
        "round": 1,
        "second": 28.8,
        "sender": "BullBear_VN",
        "avatar": "BU",
        "avatarBg": "violet",
        "badge": "Pro",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "28.8s trước",
        "message": "Mua thăm dò thôi anh em, hàng về tài khoản mới biết."
      },
      {
        "id": "chat-1-5",
        "round": 1,
        "second": 35,
        "sender": "CáMậpQuận1",
        "avatar": "CÁ",
        "avatarBg": "cyan",
        "badge": "VIP 7",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "35s trước",
        "message": "Chart đang đẹp, nhưng đừng múc tất tay."
      },
      {
        "id": "chat-1-6",
        "round": 1,
        "second": 41.2,
        "sender": "ChứngSĩTỉnh",
        "avatar": "CH",
        "avatarBg": "amber",
        "badge": "F0",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "41.2s trước",
        "message": "VIP 5: Có dòng tiền vào thật, theo dõi thêm."
      }
    ],
    "breakingNews": {
      "badge": "TIN DOANH NGHIỆP",
      "urgency": "2 phút trước",
      "headline": "Công ty công bố ký kết biên bản ghi nhớ hợp tác chiến lược.",
      "summary": "Đối tác chiến lược khu vực cam kết đồng hành thúc đẩy tăng trưởng hệ sinh thái dài hạn.",
      "impact": "Độ tích cực: Khá cao",
      "source": "Aura Financial Wire",
      "category": "TIN DOANH NGHIỆP",
      "timestamp": "2 phút trước",
      "impactText": "Độ tích cực: Khá cao",
      "narrativeSummary": "Đối tác chiến lược khu vực cam kết đồng hành thúc đẩy tăng trưởng hệ sinh thái dài hạn."
    },
    "trapOrQuiz": {
      "hasTrapOrQuiz": true,
      "triggerSecond": 30,
      "type": "TRAP_POPUP",
      "title": "Bẫy Tích Lũy",
      "question": "Dữ liệu giá tăng đều và room bắt đầu hô gom. Hành động nào phù hợp với quản trị rủi ro?",
      "timeLimit": 10,
      "options": [
        {
          "id": "A",
          "text": "Mua đuổi/all-in vì sợ bỏ lỡ cơ hội."
        },
        {
          "id": "B",
          "text": "Không mua tất tay chỉ vì tin đồn; giải ngân theo vị thế và chờ xác nhận thanh khoản."
        },
        {
          "id": "C",
          "text": "Vay thêm margin để tăng vị thế ngay lập tức."
        }
      ],
      "correctOptionId": "B",
      "psychologicalBias": "Herding Bias",
      "explanation": "Không mua tất tay chỉ vì tin đồn; giải ngân theo vị thế và chờ xác nhận thanh khoản."
    }
  },
  "2": {
    "roundId": 2,
    "roundName": "Đỉnh FOMO / Ceiling",
    "narrativeStage": "Markup (Bứt phá)",
    "sentiment": {
      "label": "Cực Độ Tham Lam / FOMO",
      "score": 94,
      "color": "red"
    },
    "marketSummary": {
      "referencePrice": 45000,
      "ceilingPrice": 48100,
      "floorPrice": 42100,
      "openPrice": 46350,
      "expectedClose": 48100,
      "statusBadge": "+6.9% TĂNG TRẦN (FOMO)",
      "statusColor": "emerald"
    },
    "tickSeries": [
      {
        "second": 1.5,
        "price": 46450,
        "volume": 17000,
        "candleState": {
          "open": 46350,
          "high": 46450,
          "low": 46350,
          "close": 46450
        }
      },
      {
        "second": 3,
        "price": 46450,
        "volume": 24500,
        "candleState": {
          "open": 46450,
          "high": 46450,
          "low": 46450,
          "close": 46450
        }
      },
      {
        "second": 4.5,
        "price": 46500,
        "volume": 32000,
        "candleState": {
          "open": 46450,
          "high": 46500,
          "low": 46450,
          "close": 46500
        }
      },
      {
        "second": 6,
        "price": 46600,
        "volume": 39500,
        "candleState": {
          "open": 46500,
          "high": 46600,
          "low": 46500,
          "close": 46600
        }
      },
      {
        "second": 7.5,
        "price": 46650,
        "volume": 47000,
        "candleState": {
          "open": 46600,
          "high": 46650,
          "low": 46600,
          "close": 46650
        }
      },
      {
        "second": 9,
        "price": 46650,
        "volume": 54500,
        "candleState": {
          "open": 46650,
          "high": 46650,
          "low": 46650,
          "close": 46650
        }
      },
      {
        "second": 10.5,
        "price": 46750,
        "volume": 62000,
        "candleState": {
          "open": 46650,
          "high": 46750,
          "low": 46650,
          "close": 46750
        }
      },
      {
        "second": 12,
        "price": 46850,
        "volume": 69500,
        "candleState": {
          "open": 46750,
          "high": 46850,
          "low": 46750,
          "close": 46850
        }
      },
      {
        "second": 13.5,
        "price": 46900,
        "volume": 77000,
        "candleState": {
          "open": 46850,
          "high": 46900,
          "low": 46850,
          "close": 46900
        }
      },
      {
        "second": 15,
        "price": 46900,
        "volume": 84500,
        "candleState": {
          "open": 46900,
          "high": 46900,
          "low": 46900,
          "close": 46900
        }
      },
      {
        "second": 16.5,
        "price": 47000,
        "volume": 92000,
        "candleState": {
          "open": 46900,
          "high": 47000,
          "low": 46900,
          "close": 47000
        }
      },
      {
        "second": 18,
        "price": 47100,
        "volume": 99500,
        "candleState": {
          "open": 47000,
          "high": 47100,
          "low": 47000,
          "close": 47100
        }
      },
      {
        "second": 19.5,
        "price": 47100,
        "volume": 107000,
        "candleState": {
          "open": 47100,
          "high": 47100,
          "low": 47100,
          "close": 47100
        }
      },
      {
        "second": 21,
        "price": 47150,
        "volume": 114500,
        "candleState": {
          "open": 47100,
          "high": 47150,
          "low": 47100,
          "close": 47150
        }
      },
      {
        "second": 22.5,
        "price": 47250,
        "volume": 122000,
        "candleState": {
          "open": 47150,
          "high": 47250,
          "low": 47150,
          "close": 47250
        }
      },
      {
        "second": 24,
        "price": 47300,
        "volume": 129500,
        "candleState": {
          "open": 47250,
          "high": 47300,
          "low": 47250,
          "close": 47300
        }
      },
      {
        "second": 25.5,
        "price": 47300,
        "volume": 137000,
        "candleState": {
          "open": 47300,
          "high": 47300,
          "low": 47300,
          "close": 47300
        }
      },
      {
        "second": 27,
        "price": 47400,
        "volume": 144500,
        "candleState": {
          "open": 47300,
          "high": 47400,
          "low": 47300,
          "close": 47400
        }
      },
      {
        "second": 28.5,
        "price": 47500,
        "volume": 152000,
        "candleState": {
          "open": 47400,
          "high": 47500,
          "low": 47400,
          "close": 47500
        }
      },
      {
        "second": 30,
        "price": 47550,
        "volume": 159500,
        "candleState": {
          "open": 47500,
          "high": 47550,
          "low": 47500,
          "close": 47550
        }
      },
      {
        "second": 31.5,
        "price": 47550,
        "volume": 167000,
        "candleState": {
          "open": 47550,
          "high": 47550,
          "low": 47550,
          "close": 47550
        }
      },
      {
        "second": 33,
        "price": 47650,
        "volume": 174500,
        "candleState": {
          "open": 47550,
          "high": 47650,
          "low": 47550,
          "close": 47650
        }
      },
      {
        "second": 34.5,
        "price": 47750,
        "volume": 182000,
        "candleState": {
          "open": 47650,
          "high": 47750,
          "low": 47650,
          "close": 47750
        }
      },
      {
        "second": 36,
        "price": 47750,
        "volume": 189500,
        "candleState": {
          "open": 47750,
          "high": 47750,
          "low": 47750,
          "close": 47750
        }
      },
      {
        "second": 37.5,
        "price": 47750,
        "volume": 197000,
        "candleState": {
          "open": 47750,
          "high": 47750,
          "low": 47750,
          "close": 47750
        }
      },
      {
        "second": 39,
        "price": 47900,
        "volume": 204500,
        "candleState": {
          "open": 47750,
          "high": 47900,
          "low": 47750,
          "close": 47900
        }
      },
      {
        "second": 40.5,
        "price": 47950,
        "volume": 212000,
        "candleState": {
          "open": 47900,
          "high": 47950,
          "low": 47900,
          "close": 47950
        }
      },
      {
        "second": 42,
        "price": 47950,
        "volume": 219500,
        "candleState": {
          "open": 47950,
          "high": 47950,
          "low": 47950,
          "close": 47950
        }
      },
      {
        "second": 43.5,
        "price": 48000,
        "volume": 227000,
        "candleState": {
          "open": 47950,
          "high": 48000,
          "low": 47950,
          "close": 48000
        }
      },
      {
        "second": 45,
        "price": 48100,
        "volume": 234500,
        "candleState": {
          "open": 48000,
          "high": 48100,
          "low": 48000,
          "close": 48100
        }
      }
    ],
    "matchingTape": [
      {
        "id": "tape-2-0",
        "timeSecond": 3,
        "second": 3,
        "shares": 1000,
        "price": 46350,
        "side": "BUY",
        "text": "↑ +35,000 CP @ 46,600 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-2-1",
        "timeSecond": 6.5,
        "second": 6.5,
        "shares": 1500,
        "price": 46350,
        "side": "BUY",
        "text": "↑ +42,000 CP @ 47,000 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-2-2",
        "timeSecond": 10,
        "second": 10,
        "shares": 2000,
        "price": 46350,
        "side": "BUY",
        "text": "↑ +55,000 CP @ 47,400 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-2-3",
        "timeSecond": 13.5,
        "second": 13.5,
        "shares": 2500,
        "price": 46350,
        "side": "BUY",
        "text": "↑ +70,000 CP @ 47,800 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-2-4",
        "timeSecond": 17,
        "second": 17,
        "shares": 3000,
        "price": 46350,
        "side": "BUY",
        "text": "↑ +90,000 CP @ 48,100 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-2-5",
        "timeSecond": 20.5,
        "second": 20.5,
        "shares": 3500,
        "price": 46350,
        "side": "BUY",
        "text": "↑ +120,000 CP @ 48,100 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-2-6",
        "timeSecond": 24,
        "second": 24,
        "shares": 4000,
        "price": 46350,
        "side": "BUY",
        "text": "↑ +80,000 CP @ 48,100 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-2-7",
        "timeSecond": 27.5,
        "second": 27.5,
        "shares": 4500,
        "price": 46350,
        "side": "BUY",
        "text": "↑ +150,000 CP @ 48,100 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-2-8",
        "timeSecond": 31,
        "second": 31,
        "shares": 5000,
        "price": 46350,
        "side": "BUY",
        "text": "↑ +65,000 CP @ 48,100 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-2-9",
        "timeSecond": 34.5,
        "second": 34.5,
        "shares": 5500,
        "price": 46350,
        "side": "BUY",
        "text": "↑ +95,000 CP @ 48,100 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-2-10",
        "timeSecond": 38,
        "second": 38,
        "shares": 6000,
        "price": 46350,
        "side": "BUY",
        "text": "↑ +110,000 CP @ 48,100 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-2-11",
        "timeSecond": 41.5,
        "second": 41.5,
        "shares": 6500,
        "price": 46350,
        "side": "BUY",
        "text": "↑ +75,000 CP @ 48,100 (BUY)",
        "prefix": "↑"
      }
    ],
    "hypeRoomFeed": [
      {
        "id": "chat-2-0",
        "round": 2,
        "second": 4,
        "sender": "F0MO_Hunter",
        "avatar": "F0",
        "avatarBg": "emerald",
        "badge": "F0",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "4s trước",
        "message": "TÍM LỊM TÌM SIM!!! 🔥"
      },
      {
        "id": "chat-2-1",
        "round": 2,
        "second": 10.2,
        "sender": "NhaDauTuF0",
        "avatar": "NH",
        "avatarBg": "slate",
        "badge": "F0",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "10.2s trước",
        "message": "Trắng bên bán rồi, ai chưa lên tàu là mất vé!"
      },
      {
        "id": "chat-2-2",
        "round": 2,
        "second": 16.4,
        "sender": "KẹpHàng2026",
        "avatar": "KẸ",
        "avatarBg": "red",
        "badge": "VIP 3",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "16.4s trước",
        "message": "Múc tất tay đi anh em, mai còn cao hơn!"
      },
      {
        "id": "chat-2-3",
        "round": 2,
        "second": 22.6,
        "sender": "BullBear_VN",
        "avatar": "BU",
        "avatarBg": "violet",
        "badge": "Pro",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "22.6s trước",
        "message": "Kèo x2 tài khoản nhé, không FOMO là tiếc cả đời."
      },
      {
        "id": "chat-2-4",
        "round": 2,
        "second": 28.8,
        "sender": "CáMậpQuận1",
        "avatar": "CÁ",
        "avatarBg": "cyan",
        "badge": "VIP 7",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "28.8s trước",
        "message": "VIP 5: Trần cứng rồi, tranh nhau đặt lệnh!"
      },
      {
        "id": "chat-2-5",
        "round": 2,
        "second": 35,
        "sender": "ChứngSĩTỉnh",
        "avatar": "CH",
        "avatarBg": "amber",
        "badge": "F0",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "35s trước",
        "message": "Có ai còn tiền không? Mình all-in luôn."
      },
      {
        "id": "chat-2-6",
        "round": 2,
        "second": 41.2,
        "sender": "RoomVIP5",
        "avatar": "RO",
        "avatarBg": "blue",
        "badge": "VIP 2",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "41.2s trước",
        "message": "Đừng để hàng chạy trước mặt!"
      }
    ],
    "breakingNews": {
      "badge": "TIN THỊ TRƯỜNG",
      "urgency": "1 phút trước",
      "headline": "Cổ phiếu FOMO tăng mạnh, lực mua chủ động áp đảo.",
      "summary": "Dòng tiền đầu cơ tập trung khi giá tiến sát mức trần phiên.",
      "impact": "Độ tích cực: Rất cao",
      "source": "Aura Financial Wire",
      "category": "TIN THỊ TRƯỜNG",
      "timestamp": "2 phút trước",
      "impactText": "Độ tích cực: Rất cao",
      "narrativeSummary": "Dòng tiền đầu cơ tập trung khi giá tiến sát mức trần phiên."
    },
    "trapOrQuiz": {
      "hasTrapOrQuiz": true,
      "triggerSecond": 30,
      "type": "TRAP_POPUP",
      "title": "Bẫy Đua Trần",
      "question": "Cổ phiếu đã tăng mạnh và đang trắng bên bán. Hành động hợp lý là gì?",
      "timeLimit": 10,
      "options": [
        {
          "id": "A",
          "text": "Mua đuổi/all-in vì sợ bỏ lỡ cơ hội."
        },
        {
          "id": "B",
          "text": "Đứng ngoài quan sát, không mua đuổi khi rủi ro đảo chiều cao."
        },
        {
          "id": "C",
          "text": "Vay thêm margin để tăng vị thế ngay lập tức."
        }
      ],
      "correctOptionId": "B",
      "psychologicalBias": "FOMO & Herding Bias (Hiệu ứng bầy đàn)",
      "explanation": "Đứng ngoài quan sát, không mua đuổi khi rủi ro đảo chiều cao."
    }
  },
  "3": {
    "roundId": 3,
    "roundName": "Bẫy Margin / Floor Crash",
    "narrativeStage": "Distribution (Phân phối)",
    "sentiment": {
      "label": "Hoảng Loạn / Margin",
      "score": 91,
      "color": "red"
    },
    "marketSummary": {
      "referencePrice": 48100,
      "ceilingPrice": 51300,
      "floorPrice": 44730,
      "openPrice": 48100,
      "expectedClose": 44730,
      "statusBadge": "-7.0% SÀN (BÁN THÁO)",
      "statusColor": "red"
    },
    "tickSeries": [
      {
        "second": 1.5,
        "price": 48000,
        "volume": 20500,
        "candleState": {
          "open": 48100,
          "high": 48100,
          "low": 48000,
          "close": 48000
        }
      },
      {
        "second": 3,
        "price": 47800,
        "volume": 28000,
        "candleState": {
          "open": 48000,
          "high": 48000,
          "low": 47800,
          "close": 47800
        }
      },
      {
        "second": 4.5,
        "price": 47750,
        "volume": 35500,
        "candleState": {
          "open": 47800,
          "high": 47800,
          "low": 47750,
          "close": 47750
        }
      },
      {
        "second": 6,
        "price": 47750,
        "volume": 43000,
        "candleState": {
          "open": 47750,
          "high": 47750,
          "low": 47750,
          "close": 47750
        }
      },
      {
        "second": 7.5,
        "price": 47500,
        "volume": 50500,
        "candleState": {
          "open": 47750,
          "high": 47750,
          "low": 47500,
          "close": 47500
        }
      },
      {
        "second": 9,
        "price": 47350,
        "volume": 58000,
        "candleState": {
          "open": 47500,
          "high": 47500,
          "low": 47350,
          "close": 47350
        }
      },
      {
        "second": 10.5,
        "price": 47350,
        "volume": 65500,
        "candleState": {
          "open": 47350,
          "high": 47350,
          "low": 47350,
          "close": 47350
        }
      },
      {
        "second": 12,
        "price": 47250,
        "volume": 73000,
        "candleState": {
          "open": 47350,
          "high": 47350,
          "low": 47250,
          "close": 47250
        }
      },
      {
        "second": 13.5,
        "price": 47000,
        "volume": 80500,
        "candleState": {
          "open": 47250,
          "high": 47250,
          "low": 47000,
          "close": 47000
        }
      },
      {
        "second": 15,
        "price": 46950,
        "volume": 88000,
        "candleState": {
          "open": 47000,
          "high": 47000,
          "low": 46950,
          "close": 46950
        }
      },
      {
        "second": 16.5,
        "price": 46950,
        "volume": 95500,
        "candleState": {
          "open": 46950,
          "high": 46950,
          "low": 46950,
          "close": 46950
        }
      },
      {
        "second": 18,
        "price": 46800,
        "volume": 103000,
        "candleState": {
          "open": 46950,
          "high": 46950,
          "low": 46800,
          "close": 46800
        }
      },
      {
        "second": 19.5,
        "price": 46550,
        "volume": 110500,
        "candleState": {
          "open": 46800,
          "high": 46800,
          "low": 46550,
          "close": 46550
        }
      },
      {
        "second": 21,
        "price": 46500,
        "volume": 118000,
        "candleState": {
          "open": 46550,
          "high": 46550,
          "low": 46500,
          "close": 46500
        }
      },
      {
        "second": 22.5,
        "price": 46500,
        "volume": 125500,
        "candleState": {
          "open": 46500,
          "high": 46500,
          "low": 46500,
          "close": 46500
        }
      },
      {
        "second": 24,
        "price": 46300,
        "volume": 133000,
        "candleState": {
          "open": 46500,
          "high": 46500,
          "low": 46300,
          "close": 46300
        }
      },
      {
        "second": 25.5,
        "price": 46100,
        "volume": 140500,
        "candleState": {
          "open": 46300,
          "high": 46300,
          "low": 46100,
          "close": 46100
        }
      },
      {
        "second": 27,
        "price": 46100,
        "volume": 148000,
        "candleState": {
          "open": 46100,
          "high": 46100,
          "low": 46100,
          "close": 46100
        }
      },
      {
        "second": 28.5,
        "price": 46050,
        "volume": 155500,
        "candleState": {
          "open": 46100,
          "high": 46100,
          "low": 46050,
          "close": 46050
        }
      },
      {
        "second": 30,
        "price": 45800,
        "volume": 163000,
        "candleState": {
          "open": 46050,
          "high": 46050,
          "low": 45800,
          "close": 45800
        }
      },
      {
        "second": 31.5,
        "price": 45700,
        "volume": 170500,
        "candleState": {
          "open": 45800,
          "high": 45800,
          "low": 45700,
          "close": 45700
        }
      },
      {
        "second": 33,
        "price": 45700,
        "volume": 178000,
        "candleState": {
          "open": 45700,
          "high": 45700,
          "low": 45700,
          "close": 45700
        }
      },
      {
        "second": 34.5,
        "price": 45550,
        "volume": 185500,
        "candleState": {
          "open": 45700,
          "high": 45700,
          "low": 45550,
          "close": 45550
        }
      },
      {
        "second": 36,
        "price": 45300,
        "volume": 193000,
        "candleState": {
          "open": 45550,
          "high": 45550,
          "low": 45300,
          "close": 45300
        }
      },
      {
        "second": 37.5,
        "price": 45300,
        "volume": 200500,
        "candleState": {
          "open": 45300,
          "high": 45300,
          "low": 45300,
          "close": 45300
        }
      },
      {
        "second": 39,
        "price": 45250,
        "volume": 208000,
        "candleState": {
          "open": 45300,
          "high": 45300,
          "low": 45250,
          "close": 45250
        }
      },
      {
        "second": 40.5,
        "price": 45050,
        "volume": 215500,
        "candleState": {
          "open": 45250,
          "high": 45250,
          "low": 45050,
          "close": 45050
        }
      },
      {
        "second": 42,
        "price": 44850,
        "volume": 223000,
        "candleState": {
          "open": 45050,
          "high": 45050,
          "low": 44850,
          "close": 44850
        }
      },
      {
        "second": 43.5,
        "price": 44850,
        "volume": 230500,
        "candleState": {
          "open": 44850,
          "high": 44850,
          "low": 44850,
          "close": 44850
        }
      },
      {
        "second": 45,
        "price": 44730,
        "volume": 238000,
        "candleState": {
          "open": 44850,
          "high": 44850,
          "low": 44730,
          "close": 44730
        }
      }
    ],
    "matchingTape": [
      {
        "id": "tape-3-0",
        "timeSecond": 3,
        "second": 3,
        "shares": 1000,
        "price": 48100,
        "side": "SELL",
        "text": "↓ -40,000 CP @ 47,600 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-3-1",
        "timeSecond": 6.5,
        "second": 6.5,
        "shares": 1500,
        "price": 48100,
        "side": "SELL",
        "text": "↓ -55,000 CP @ 47,000 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-3-2",
        "timeSecond": 10,
        "second": 10,
        "shares": 2000,
        "price": 48100,
        "side": "SELL",
        "text": "↓ -80,000 CP @ 46,400 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-3-3",
        "timeSecond": 13.5,
        "second": 13.5,
        "shares": 2500,
        "price": 48100,
        "side": "SELL",
        "text": "↓ -95,000 CP @ 45,800 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-3-4",
        "timeSecond": 17,
        "second": 17,
        "shares": 3000,
        "price": 48100,
        "side": "SELL",
        "text": "↓ -110,000 CP @ 45,300 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-3-5",
        "timeSecond": 20.5,
        "second": 20.5,
        "shares": 3500,
        "price": 48100,
        "side": "SELL",
        "text": "↓ -140,000 CP @ 44,900 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-3-6",
        "timeSecond": 24,
        "second": 24,
        "shares": 4000,
        "price": 48100,
        "side": "SELL",
        "text": "↓ -170,000 CP @ 44,730 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-3-7",
        "timeSecond": 27.5,
        "second": 27.5,
        "shares": 4500,
        "price": 48100,
        "side": "SELL",
        "text": "↓ -125,000 CP @ 44,730 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-3-8",
        "timeSecond": 31,
        "second": 31,
        "shares": 5000,
        "price": 48100,
        "side": "SELL",
        "text": "↓ -200,000 CP @ 44,730 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-3-9",
        "timeSecond": 34.5,
        "second": 34.5,
        "shares": 5500,
        "price": 48100,
        "side": "SELL",
        "text": "↓ -160,000 CP @ 44,730 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-3-10",
        "timeSecond": 38,
        "second": 38,
        "shares": 6000,
        "price": 48100,
        "side": "SELL",
        "text": "↓ -180,000 CP @ 44,730 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-3-11",
        "timeSecond": 41.5,
        "second": 41.5,
        "shares": 6500,
        "price": 48100,
        "side": "SELL",
        "text": "↓ -220,000 CP @ 44,730 (SELL)",
        "prefix": "↓"
      }
    ],
    "hypeRoomFeed": [
      {
        "id": "chat-3-0",
        "round": 3,
        "second": 4,
        "sender": "NhaDauTuF0",
        "avatar": "NH",
        "avatarBg": "slate",
        "badge": "F0",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "4s trước",
        "message": "Ủa chuyện gì vậy, bên bán đạp kinh thế?"
      },
      {
        "id": "chat-3-1",
        "round": 3,
        "second": 10.2,
        "sender": "KẹpHàng2026",
        "avatar": "KẸ",
        "avatarBg": "red",
        "badge": "VIP 3",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "10.2s trước",
        "message": "Rumor kiểm tra doanh nghiệp đang lan trong room."
      },
      {
        "id": "chat-3-2",
        "round": 3,
        "second": 16.4,
        "sender": "BullBear_VN",
        "avatar": "BU",
        "avatarBg": "violet",
        "badge": "Pro",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "16.4s trước",
        "message": "Cháy margin mất, ai dùng đòn bẩy coi chừng."
      },
      {
        "id": "chat-3-3",
        "round": 3,
        "second": 22.6,
        "sender": "CáMậpQuận1",
        "avatar": "CÁ",
        "avatarBg": "cyan",
        "badge": "VIP 7",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "22.6s trước",
        "message": "Bắt đáy hay chạy đây anh em?"
      },
      {
        "id": "chat-3-4",
        "round": 3,
        "second": 28.8,
        "sender": "ChứngSĩTỉnh",
        "avatar": "CH",
        "avatarBg": "amber",
        "badge": "F0",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "28.8s trước",
        "message": "FOMO Booster x5 vừa mở, nghe nguy hiểm quá."
      },
      {
        "id": "chat-3-5",
        "round": 3,
        "second": 35,
        "sender": "RoomVIP5",
        "avatar": "RO",
        "avatarBg": "blue",
        "badge": "VIP 2",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "35s trước",
        "message": "Lái đạp thật hay tin xấu thật vậy?"
      },
      {
        "id": "chat-3-6",
        "round": 3,
        "second": 41.2,
        "sender": "Trader_Shark88",
        "avatar": "TR",
        "avatarBg": "amber",
        "badge": "VIP 5",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "41.2s trước",
        "message": "Đừng bắt dao rơi bằng margin, bình tĩnh."
      }
    ],
    "breakingNews": {
      "badge": "TIN RÒ RỈ",
      "urgency": "30 giây trước",
      "headline": "Xuất hiện tin đồn cơ quan chức năng kiểm tra hoạt động doanh nghiệp.",
      "summary": "Thông tin chưa được xác nhận nhưng đang kích hoạt tâm lý bán tháo và giảm đòn bẩy.",
      "impact": "Độ tiêu cực: Rất cao",
      "source": "Aura Financial Wire",
      "category": "TIN RÒ RỈ",
      "timestamp": "2 phút trước",
      "impactText": "Độ tiêu cực: Rất cao",
      "narrativeSummary": "Thông tin chưa được xác nhận nhưng đang kích hoạt tâm lý bán tháo và giảm đòn bẩy."
    },
    "trapOrQuiz": {
      "hasTrapOrQuiz": true,
      "triggerSecond": 30,
      "type": "TRAP_POPUP",
      "title": "Bẫy Bắt Đáy X5",
      "question": "Giá rơi về sàn và Booster x5 xuất hiện. Hành động nào kiểm soát rủi ro tốt hơn?",
      "timeLimit": 10,
      "options": [
        {
          "id": "A",
          "text": "Mua đuổi/all-in vì sợ bỏ lỡ cơ hội."
        },
        {
          "id": "B",
          "text": "Không dùng margin để bắt dao rơi; ưu tiên bảo toàn vốn và chờ tín hiệu xác nhận."
        },
        {
          "id": "C",
          "text": "Vay thêm margin để tăng vị thế ngay lập tức."
        }
      ],
      "correctOptionId": "B",
      "psychologicalBias": "Loss Aversion & Leverage Bias",
      "explanation": "Không dùng margin để bắt dao rơi; ưu tiên bảo toàn vốn và chờ tín hiệu xác nhận."
    },
    "specialMechanic": {
      "type": "MARGIN_BOOSTER",
      "name": "FOMO Booster x5",
      "leverage": 5,
      "unlockSecond": 25,
      "description": "Mở khoá đòn bẩy x5; mua thêm khi giá đang giãn sàn làm tăng nguy cơ call margin ở các vòng sau."
    }
  },
  "4": {
    "roundId": 4,
    "roundName": "Bull-Trap Hồi Giả",
    "narrativeStage": "Dead-Cat Bounce (Hồi kỹ thuật)",
    "sentiment": {
      "label": "Hy Vọng Mong Manh",
      "score": 72,
      "color": "amber"
    },
    "marketSummary": {
      "referencePrice": 44730,
      "ceilingPrice": 47820,
      "floorPrice": 41600,
      "openPrice": 44730,
      "expectedClose": 44500,
      "statusBadge": "-0.5% HỒI GIẢ (BULL-TRAP)",
      "statusColor": "amber"
    },
    "tickSeries": [
      {
        "second": 1.5,
        "price": 44700,
        "volume": 24000,
        "candleState": {
          "open": 44730,
          "high": 44730,
          "low": 44700,
          "close": 44700
        }
      },
      {
        "second": 3,
        "price": 44700,
        "volume": 31500,
        "candleState": {
          "open": 44700,
          "high": 44700,
          "low": 44700,
          "close": 44700
        }
      },
      {
        "second": 4.5,
        "price": 44700,
        "volume": 39000,
        "candleState": {
          "open": 44700,
          "high": 44700,
          "low": 44700,
          "close": 44700
        }
      },
      {
        "second": 6,
        "price": 44700,
        "volume": 46500,
        "candleState": {
          "open": 44700,
          "high": 44700,
          "low": 44700,
          "close": 44700
        }
      },
      {
        "second": 7.5,
        "price": 44700,
        "volume": 54000,
        "candleState": {
          "open": 44700,
          "high": 44700,
          "low": 44700,
          "close": 44700
        }
      },
      {
        "second": 9,
        "price": 44700,
        "volume": 61500,
        "candleState": {
          "open": 44700,
          "high": 44700,
          "low": 44700,
          "close": 44700
        }
      },
      {
        "second": 10.5,
        "price": 44700,
        "volume": 69000,
        "candleState": {
          "open": 44700,
          "high": 44700,
          "low": 44700,
          "close": 44700
        }
      },
      {
        "second": 12,
        "price": 44650,
        "volume": 76500,
        "candleState": {
          "open": 44700,
          "high": 44700,
          "low": 44650,
          "close": 44650
        }
      },
      {
        "second": 13.5,
        "price": 44650,
        "volume": 84000,
        "candleState": {
          "open": 44650,
          "high": 44650,
          "low": 44650,
          "close": 44650
        }
      },
      {
        "second": 15,
        "price": 44650,
        "volume": 91500,
        "candleState": {
          "open": 44650,
          "high": 44650,
          "low": 44650,
          "close": 44650
        }
      },
      {
        "second": 16.5,
        "price": 44650,
        "volume": 99000,
        "candleState": {
          "open": 44650,
          "high": 44650,
          "low": 44650,
          "close": 44650
        }
      },
      {
        "second": 18,
        "price": 44650,
        "volume": 106500,
        "candleState": {
          "open": 44650,
          "high": 44650,
          "low": 44650,
          "close": 44650
        }
      },
      {
        "second": 19.5,
        "price": 44650,
        "volume": 114000,
        "candleState": {
          "open": 44650,
          "high": 44650,
          "low": 44650,
          "close": 44650
        }
      },
      {
        "second": 21,
        "price": 44650,
        "volume": 121500,
        "candleState": {
          "open": 44650,
          "high": 44650,
          "low": 44650,
          "close": 44650
        }
      },
      {
        "second": 22.5,
        "price": 44600,
        "volume": 129000,
        "candleState": {
          "open": 44650,
          "high": 44650,
          "low": 44600,
          "close": 44600
        }
      },
      {
        "second": 24,
        "price": 44600,
        "volume": 136500,
        "candleState": {
          "open": 44600,
          "high": 44600,
          "low": 44600,
          "close": 44600
        }
      },
      {
        "second": 25.5,
        "price": 44600,
        "volume": 144000,
        "candleState": {
          "open": 44600,
          "high": 44600,
          "low": 44600,
          "close": 44600
        }
      },
      {
        "second": 27,
        "price": 44600,
        "volume": 151500,
        "candleState": {
          "open": 44600,
          "high": 44600,
          "low": 44600,
          "close": 44600
        }
      },
      {
        "second": 28.5,
        "price": 44600,
        "volume": 159000,
        "candleState": {
          "open": 44600,
          "high": 44600,
          "low": 44600,
          "close": 44600
        }
      },
      {
        "second": 30,
        "price": 44550,
        "volume": 166500,
        "candleState": {
          "open": 44600,
          "high": 44600,
          "low": 44550,
          "close": 44550
        }
      },
      {
        "second": 31.5,
        "price": 44550,
        "volume": 174000,
        "candleState": {
          "open": 44550,
          "high": 44550,
          "low": 44550,
          "close": 44550
        }
      },
      {
        "second": 33,
        "price": 44550,
        "volume": 181500,
        "candleState": {
          "open": 44550,
          "high": 44550,
          "low": 44550,
          "close": 44550
        }
      },
      {
        "second": 34.5,
        "price": 44550,
        "volume": 189000,
        "candleState": {
          "open": 44550,
          "high": 44550,
          "low": 44550,
          "close": 44550
        }
      },
      {
        "second": 36,
        "price": 44550,
        "volume": 196500,
        "candleState": {
          "open": 44550,
          "high": 44550,
          "low": 44550,
          "close": 44550
        }
      },
      {
        "second": 37.5,
        "price": 44550,
        "volume": 204000,
        "candleState": {
          "open": 44550,
          "high": 44550,
          "low": 44550,
          "close": 44550
        }
      },
      {
        "second": 39,
        "price": 44550,
        "volume": 211500,
        "candleState": {
          "open": 44550,
          "high": 44550,
          "low": 44550,
          "close": 44550
        }
      },
      {
        "second": 40.5,
        "price": 44500,
        "volume": 219000,
        "candleState": {
          "open": 44550,
          "high": 44550,
          "low": 44500,
          "close": 44500
        }
      },
      {
        "second": 42,
        "price": 44500,
        "volume": 226500,
        "candleState": {
          "open": 44500,
          "high": 44500,
          "low": 44500,
          "close": 44500
        }
      },
      {
        "second": 43.5,
        "price": 44500,
        "volume": 234000,
        "candleState": {
          "open": 44500,
          "high": 44500,
          "low": 44500,
          "close": 44500
        }
      },
      {
        "second": 45,
        "price": 44500,
        "volume": 241500,
        "candleState": {
          "open": 44500,
          "high": 44500,
          "low": 44500,
          "close": 44500
        }
      }
    ],
    "matchingTape": [
      {
        "id": "tape-4-0",
        "timeSecond": 3,
        "second": 3,
        "shares": 1000,
        "price": 44730,
        "side": "BUY",
        "text": "↑ +20,000 CP @ 43,100 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-4-1",
        "timeSecond": 6.5,
        "second": 6.5,
        "shares": 1500,
        "price": 44730,
        "side": "BUY",
        "text": "↑ +18,000 CP @ 43,400 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-4-2",
        "timeSecond": 10,
        "second": 10,
        "shares": 2000,
        "price": 44730,
        "side": "BUY",
        "text": "↑ +25,000 CP @ 43,700 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-4-3",
        "timeSecond": 13.5,
        "second": 13.5,
        "shares": 2500,
        "price": 44730,
        "side": "BUY",
        "text": "↑ +32,000 CP @ 44,000 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-4-4",
        "timeSecond": 17,
        "second": 17,
        "shares": 3000,
        "price": 44730,
        "side": "BUY",
        "text": "↑ +45,000 CP @ 44,300 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-4-5",
        "timeSecond": 20.5,
        "second": 20.5,
        "shares": 3500,
        "price": 44730,
        "side": "BUY",
        "text": "↑ +50,000 CP @ 44,500 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-4-6",
        "timeSecond": 24,
        "second": 24,
        "shares": 4000,
        "price": 44730,
        "side": "SELL",
        "text": "↓ -28,000 CP @ 44,350 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-4-7",
        "timeSecond": 27.5,
        "second": 27.5,
        "shares": 4500,
        "price": 44730,
        "side": "SELL",
        "text": "↓ -35,000 CP @ 44,200 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-4-8",
        "timeSecond": 31,
        "second": 31,
        "shares": 5000,
        "price": 44730,
        "side": "BUY",
        "text": "↑ +22,000 CP @ 44,400 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-4-9",
        "timeSecond": 34.5,
        "second": 34.5,
        "shares": 5500,
        "price": 44730,
        "side": "BUY",
        "text": "↑ +18,000 CP @ 44,500 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-4-10",
        "timeSecond": 38,
        "second": 38,
        "shares": 6000,
        "price": 44730,
        "side": "SELL",
        "text": "↓ -30,000 CP @ 44,300 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-4-11",
        "timeSecond": 41.5,
        "second": 41.5,
        "shares": 6500,
        "price": 44730,
        "side": "SELL",
        "text": "↓ -25,000 CP @ 44,500 (SELL)",
        "prefix": "↓"
      }
    ],
    "hypeRoomFeed": [
      {
        "id": "chat-4-0",
        "round": 4,
        "second": 4,
        "sender": "KẹpHàng2026",
        "avatar": "KẸ",
        "avatarBg": "red",
        "badge": "VIP 3",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "4s trước",
        "message": "Hồi rồi anh em! Có khi đáy ngắn hạn ở đây."
      },
      {
        "id": "chat-4-1",
        "round": 4,
        "second": 10.2,
        "sender": "BullBear_VN",
        "avatar": "BU",
        "avatarBg": "violet",
        "badge": "Pro",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "10.2s trước",
        "message": "Cẩn thận dead-cat bounce, xanh không đồng nghĩa đảo trend."
      },
      {
        "id": "chat-4-2",
        "round": 4,
        "second": 16.4,
        "sender": "CáMậpQuận1",
        "avatar": "CÁ",
        "avatarBg": "cyan",
        "badge": "VIP 7",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "16.4s trước",
        "message": "44.5k là vùng cung, đừng đua."
      },
      {
        "id": "chat-4-3",
        "round": 4,
        "second": 22.6,
        "sender": "ChứngSĩTỉnh",
        "avatar": "CH",
        "avatarBg": "amber",
        "badge": "F0",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "22.6s trước",
        "message": "Mình vừa hòa vốn đã muốn bán 😅"
      },
      {
        "id": "chat-4-4",
        "round": 4,
        "second": 28.8,
        "sender": "RoomVIP5",
        "avatar": "RO",
        "avatarBg": "blue",
        "badge": "VIP 2",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "28.8s trước",
        "message": "Ai đang trung bình giá nhớ tính sức chịu đựng."
      },
      {
        "id": "chat-4-5",
        "round": 4,
        "second": 35,
        "sender": "Trader_Shark88",
        "avatar": "TR",
        "avatarBg": "amber",
        "badge": "VIP 5",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "35s trước",
        "message": "Có vẻ lực hồi yếu dần."
      },
      {
        "id": "chat-4-6",
        "round": 4,
        "second": 41.2,
        "sender": "F0MO_Hunter",
        "avatar": "F0",
        "avatarBg": "emerald",
        "badge": "F0",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "41.2s trước",
        "message": "Mini quiz chuẩn bài tâm lý luôn."
      }
    ],
    "breakingNews": {
      "badge": "TIN TÂM LÝ",
      "urgency": "1 phút trước",
      "headline": "Lực mua quay lại sau nhịp giảm sâu nhưng thanh khoản chưa xác nhận đảo chiều.",
      "summary": "Nhịp hồi có thể chỉ là dead-cat bounce nếu cầu không duy trì.",
      "impact": "Độ tích cực: Trung tính",
      "source": "Aura Financial Wire",
      "category": "TIN TÂM LÝ",
      "timestamp": "2 phút trước",
      "impactText": "Độ tích cực: Trung tính",
      "narrativeSummary": "Nhịp hồi có thể chỉ là dead-cat bounce nếu cầu không duy trì."
    },
    "trapOrQuiz": {
      "hasTrapOrQuiz": true,
      "triggerSecond": 30,
      "type": "MINI_QUIZ",
      "title": "Nhận diện Bull-Trap",
      "question": "Giá hồi từ vùng sàn nhưng thanh khoản suy yếu. Dấu hiệu nào phù hợp với dead-cat bounce?",
      "timeLimit": 10,
      "options": [
        {
          "id": "A",
          "text": "Mua mạnh vì giá xanh là tín hiệu đảo chiều chắc chắn."
        },
        {
          "id": "B",
          "text": "Giá hồi ngắn hạn nhưng không có lực cầu đủ mạnh để xác nhận đảo chiều."
        },
        {
          "id": "C",
          "text": "Bình quân giá bằng margin để tối đa hóa lợi nhuận hồi phục."
        }
      ],
      "correctOptionId": "B",
      "psychologicalBias": "Recency Bias & Confirmation Bias",
      "explanation": "Giá hồi ngắn hạn nhưng không có lực cầu đủ mạnh để xác nhận đảo chiều."
    }
  },
  "5": {
    "roundId": 5,
    "roundName": "Cắt Thanh Khoản / Múa Bên Trăng",
    "narrativeStage": "Liquidity Crisis (Khủng hoảng thanh khoản)",
    "sentiment": {
      "label": "Hoảng Loạn Cực Độ",
      "score": 98,
      "color": "red"
    },
    "marketSummary": {
      "referencePrice": 42150,
      "ceilingPrice": 45050,
      "floorPrice": 39200,
      "openPrice": 44500,
      "expectedClose": 39200,
      "statusBadge": "-12.0% SỤP ĐỔ (TRẮNG BÊN MUA)",
      "statusColor": "red"
    },
    "tickSeries": [
      {
        "second": 1.5,
        "price": 44200,
        "volume": 27500,
        "candleState": {
          "open": 44500,
          "high": 44500,
          "low": 44200,
          "close": 44200
        }
      },
      {
        "second": 3,
        "price": 44200,
        "volume": 35000,
        "candleState": {
          "open": 44200,
          "high": 44200,
          "low": 44200,
          "close": 44200
        }
      },
      {
        "second": 4.5,
        "price": 44100,
        "volume": 42500,
        "candleState": {
          "open": 44200,
          "high": 44200,
          "low": 44100,
          "close": 44100
        }
      },
      {
        "second": 6,
        "price": 43700,
        "volume": 50000,
        "candleState": {
          "open": 44100,
          "high": 44100,
          "low": 43700,
          "close": 43700
        }
      },
      {
        "second": 7.5,
        "price": 43500,
        "volume": 57500,
        "candleState": {
          "open": 43700,
          "high": 43700,
          "low": 43500,
          "close": 43500
        }
      },
      {
        "second": 9,
        "price": 43550,
        "volume": 65000,
        "candleState": {
          "open": 43500,
          "high": 43550,
          "low": 43500,
          "close": 43550
        }
      },
      {
        "second": 10.5,
        "price": 43350,
        "volume": 72500,
        "candleState": {
          "open": 43550,
          "high": 43550,
          "low": 43350,
          "close": 43350
        }
      },
      {
        "second": 12,
        "price": 42950,
        "volume": 80000,
        "candleState": {
          "open": 43350,
          "high": 43350,
          "low": 42950,
          "close": 42950
        }
      },
      {
        "second": 13.5,
        "price": 42900,
        "volume": 87500,
        "candleState": {
          "open": 42950,
          "high": 42950,
          "low": 42900,
          "close": 42900
        }
      },
      {
        "second": 15,
        "price": 42850,
        "volume": 95000,
        "candleState": {
          "open": 42900,
          "high": 42900,
          "low": 42850,
          "close": 42850
        }
      },
      {
        "second": 16.5,
        "price": 42550,
        "volume": 102500,
        "candleState": {
          "open": 42850,
          "high": 42850,
          "low": 42550,
          "close": 42550
        }
      },
      {
        "second": 18,
        "price": 42250,
        "volume": 110000,
        "candleState": {
          "open": 42550,
          "high": 42550,
          "low": 42250,
          "close": 42250
        }
      },
      {
        "second": 19.5,
        "price": 42250,
        "volume": 117500,
        "candleState": {
          "open": 42250,
          "high": 42250,
          "low": 42250,
          "close": 42250
        }
      },
      {
        "second": 21,
        "price": 42150,
        "volume": 125000,
        "candleState": {
          "open": 42250,
          "high": 42250,
          "low": 42150,
          "close": 42150
        }
      },
      {
        "second": 22.5,
        "price": 41800,
        "volume": 132500,
        "candleState": {
          "open": 42150,
          "high": 42150,
          "low": 41800,
          "close": 41800
        }
      },
      {
        "second": 24,
        "price": 41550,
        "volume": 140000,
        "candleState": {
          "open": 41800,
          "high": 41800,
          "low": 41550,
          "close": 41550
        }
      },
      {
        "second": 25.5,
        "price": 41600,
        "volume": 147500,
        "candleState": {
          "open": 41550,
          "high": 41600,
          "low": 41550,
          "close": 41600
        }
      },
      {
        "second": 27,
        "price": 41400,
        "volume": 155000,
        "candleState": {
          "open": 41600,
          "high": 41600,
          "low": 41400,
          "close": 41400
        }
      },
      {
        "second": 28.5,
        "price": 41050,
        "volume": 162500,
        "candleState": {
          "open": 41400,
          "high": 41400,
          "low": 41050,
          "close": 41050
        }
      },
      {
        "second": 30,
        "price": 40900,
        "volume": 170000,
        "candleState": {
          "open": 41050,
          "high": 41050,
          "low": 40900,
          "close": 40900
        }
      },
      {
        "second": 31.5,
        "price": 40900,
        "volume": 177500,
        "candleState": {
          "open": 40900,
          "high": 40900,
          "low": 40900,
          "close": 40900
        }
      },
      {
        "second": 33,
        "price": 40650,
        "volume": 185000,
        "candleState": {
          "open": 40900,
          "high": 40900,
          "low": 40650,
          "close": 40650
        }
      },
      {
        "second": 34.5,
        "price": 40300,
        "volume": 192500,
        "candleState": {
          "open": 40650,
          "high": 40650,
          "low": 40300,
          "close": 40300
        }
      },
      {
        "second": 36,
        "price": 40300,
        "volume": 200000,
        "candleState": {
          "open": 40300,
          "high": 40300,
          "low": 40300,
          "close": 40300
        }
      },
      {
        "second": 37.5,
        "price": 40200,
        "volume": 207500,
        "candleState": {
          "open": 40300,
          "high": 40300,
          "low": 40200,
          "close": 40200
        }
      },
      {
        "second": 39,
        "price": 39850,
        "volume": 215000,
        "candleState": {
          "open": 40200,
          "high": 40200,
          "low": 39850,
          "close": 39850
        }
      },
      {
        "second": 40.5,
        "price": 39600,
        "volume": 222500,
        "candleState": {
          "open": 39850,
          "high": 39850,
          "low": 39600,
          "close": 39600
        }
      },
      {
        "second": 42,
        "price": 39650,
        "volume": 230000,
        "candleState": {
          "open": 39600,
          "high": 39650,
          "low": 39600,
          "close": 39650
        }
      },
      {
        "second": 43.5,
        "price": 39450,
        "volume": 237500,
        "candleState": {
          "open": 39650,
          "high": 39650,
          "low": 39450,
          "close": 39450
        }
      },
      {
        "second": 45,
        "price": 39200,
        "volume": 245000,
        "candleState": {
          "open": 39450,
          "high": 39450,
          "low": 39200,
          "close": 39200
        }
      }
    ],
    "matchingTape": [
      {
        "id": "tape-5-0",
        "timeSecond": 3,
        "second": 3,
        "shares": 1000,
        "price": 44500,
        "side": "SELL",
        "text": "↓ -90,000 CP @ 43,800 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-5-1",
        "timeSecond": 6.5,
        "second": 6.5,
        "shares": 1500,
        "price": 44500,
        "side": "SELL",
        "text": "↓ -120,000 CP @ 43,000 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-5-2",
        "timeSecond": 10,
        "second": 10,
        "shares": 2000,
        "price": 44500,
        "side": "SELL",
        "text": "↓ -150,000 CP @ 42,200 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-5-3",
        "timeSecond": 13.5,
        "second": 13.5,
        "shares": 2500,
        "price": 44500,
        "side": "SELL",
        "text": "↓ -180,000 CP @ 41,500 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-5-4",
        "timeSecond": 17,
        "second": 17,
        "shares": 3000,
        "price": 44500,
        "side": "SELL",
        "text": "↓ -220,000 CP @ 40,800 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-5-5",
        "timeSecond": 20.5,
        "second": 20.5,
        "shares": 3500,
        "price": 44500,
        "side": "SELL",
        "text": "↓ -300,000 CP @ 40,100 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-5-6",
        "timeSecond": 24,
        "second": 24,
        "shares": 4000,
        "price": 44500,
        "side": "SELL",
        "text": "↓ -450,000 CP @ 39,600 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-5-7",
        "timeSecond": 27.5,
        "second": 27.5,
        "shares": 4500,
        "price": 44500,
        "side": "SELL",
        "text": "↓ -600,000 CP @ 39,200 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-5-8",
        "timeSecond": 31,
        "second": 31,
        "shares": 5000,
        "price": 44500,
        "side": "SELL",
        "text": "↓ -800,000 CP @ 39,200 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-5-9",
        "timeSecond": 34.5,
        "second": 34.5,
        "shares": 5500,
        "price": 44500,
        "side": "SELL",
        "text": "↓ -1,000,000 CP @ 39,200 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-5-10",
        "timeSecond": 38,
        "second": 38,
        "shares": 6000,
        "price": 44500,
        "side": "SELL",
        "text": "↓ -1,200,000 CP @ 39,200 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-5-11",
        "timeSecond": 41.5,
        "second": 41.5,
        "shares": 6500,
        "price": 44500,
        "side": "SELL",
        "text": "↓ -1,500,000 CP @ 39,200 (SELL)",
        "prefix": "↓"
      }
    ],
    "hypeRoomFeed": [
      {
        "id": "chat-5-0",
        "round": 5,
        "second": 4,
        "sender": "BullBear_VN",
        "avatar": "BU",
        "avatarBg": "violet",
        "badge": "Pro",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "4s trước",
        "message": "Trắng bên mua rồi... không thoát được thì sao?"
      },
      {
        "id": "chat-5-1",
        "round": 5,
        "second": 10.2,
        "sender": "CáMậpQuận1",
        "avatar": "CÁ",
        "avatarBg": "cyan",
        "badge": "VIP 7",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "10.2s trước",
        "message": "12.8M cổ xếp bán, nhìn mà lạnh gáy."
      },
      {
        "id": "chat-5-2",
        "round": 5,
        "second": 16.4,
        "sender": "ChứngSĩTỉnh",
        "avatar": "CH",
        "avatarBg": "amber",
        "badge": "F0",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "16.4s trước",
        "message": "Múa bên trăng đúng nghĩa."
      },
      {
        "id": "chat-5-3",
        "round": 5,
        "second": 22.6,
        "sender": "RoomVIP5",
        "avatar": "RO",
        "avatarBg": "blue",
        "badge": "VIP 2",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "22.6s trước",
        "message": "Sàn glitch hay tin xấu thật vậy?"
      },
      {
        "id": "chat-5-4",
        "round": 5,
        "second": 28.8,
        "sender": "Trader_Shark88",
        "avatar": "TR",
        "avatarBg": "amber",
        "badge": "VIP 5",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "28.8s trước",
        "message": "Sell bị khóa, giờ chỉ còn quản trị vị thế."
      },
      {
        "id": "chat-5-5",
        "round": 5,
        "second": 35,
        "sender": "F0MO_Hunter",
        "avatar": "F0",
        "avatarBg": "emerald",
        "badge": "F0",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "35s trước",
        "message": "Đừng hoảng loạn, chờ thanh khoản trở lại."
      },
      {
        "id": "chat-5-6",
        "round": 5,
        "second": 41.2,
        "sender": "NhaDauTuF0",
        "avatar": "NH",
        "avatarBg": "slate",
        "badge": "F0",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "41.2s trước",
        "message": "Ai dùng margin chắc đang call chéo rồi."
      }
    ],
    "breakingNews": {
      "badge": "CẢNH BÁO SÀN",
      "urgency": "20 giây trước",
      "headline": "Hệ thống giao dịch ghi nhận lỗi kỹ thuật và thanh khoản hai chiều suy giảm.",
      "summary": "Panic selling khiến bên bán chất lệnh, trong khi lệnh mua gần như biến mất.",
      "impact": "Độ tiêu cực: Cực cao",
      "source": "Aura Financial Wire",
      "category": "CẢNH BÁO SÀN",
      "timestamp": "2 phút trước",
      "impactText": "Độ tiêu cực: Cực cao",
      "narrativeSummary": "Panic selling khiến bên bán chất lệnh, trong khi lệnh mua gần như biến mất."
    },
    "trapOrQuiz": {
      "hasTrapOrQuiz": true,
      "triggerSecond": 30,
      "type": "TRAP_POPUP",
      "title": "Múa Bên Trăng",
      "question": "Sell button bị khóa trong lúc bên mua trắng. Hành động nào phù hợp nhất?",
      "timeLimit": 10,
      "options": [
        {
          "id": "A",
          "text": "Tiếp tục spam lệnh bán dù hệ thống đang báo lỗi."
        },
        {
          "id": "B",
          "text": "Không hoảng loạn tăng vị thế; chờ hệ thống và thanh khoản bình thường trở lại."
        },
        {
          "id": "C",
          "text": "Mua thêm thật nhanh vì giá giảm sâu luôn đồng nghĩa rẻ."
        }
      ],
      "correctOptionId": "B",
      "psychologicalBias": "Panic Selling & Loss Aversion",
      "explanation": "Không hoảng loạn tăng vị thế; chờ hệ thống và thanh khoản bình thường trở lại."
    },
    "specialMechanic": {
      "type": "SELL_BUTTON_BLOCKED",
      "fromSecond": 24,
      "toSecond": 45,
      "description": "Nút BÁN bị vô hiệu hoá (giãn sàn, 0 lệnh mua). Người chơi chỉ có thể xem lệnh chờ."
    }
  },
  "6": {
    "roundId": 6,
    "roundName": "Rung Lắc Khốc Liệt / Capitulation",
    "narrativeStage": "Capitulation (Đầu hàng)",
    "sentiment": {
      "label": "Tuyệt Vọng / Capitulation",
      "score": 100,
      "color": "red"
    },
    "marketSummary": {
      "referencePrice": 41720,
      "ceilingPrice": 44620,
      "floorPrice": 38800,
      "openPrice": 39200,
      "expectedClose": 38800,
      "statusBadge": "-1.0% CAPITULATION",
      "statusColor": "red"
    },
    "tickSeries": [
      {
        "second": 1.5,
        "price": 39200,
        "volume": 31000,
        "candleState": {
          "open": 39200,
          "high": 39200,
          "low": 39200,
          "close": 39200
        }
      },
      {
        "second": 3,
        "price": 39200,
        "volume": 38500,
        "candleState": {
          "open": 39200,
          "high": 39200,
          "low": 39200,
          "close": 39200
        }
      },
      {
        "second": 4.5,
        "price": 39150,
        "volume": 46000,
        "candleState": {
          "open": 39200,
          "high": 39200,
          "low": 39150,
          "close": 39150
        }
      },
      {
        "second": 6,
        "price": 39150,
        "volume": 53500,
        "candleState": {
          "open": 39150,
          "high": 39150,
          "low": 39150,
          "close": 39150
        }
      },
      {
        "second": 7.5,
        "price": 39150,
        "volume": 61000,
        "candleState": {
          "open": 39150,
          "high": 39150,
          "low": 39150,
          "close": 39150
        }
      },
      {
        "second": 9,
        "price": 39150,
        "volume": 68500,
        "candleState": {
          "open": 39150,
          "high": 39150,
          "low": 39150,
          "close": 39150
        }
      },
      {
        "second": 10.5,
        "price": 39100,
        "volume": 76000,
        "candleState": {
          "open": 39150,
          "high": 39150,
          "low": 39100,
          "close": 39100
        }
      },
      {
        "second": 12,
        "price": 39100,
        "volume": 83500,
        "candleState": {
          "open": 39100,
          "high": 39100,
          "low": 39100,
          "close": 39100
        }
      },
      {
        "second": 13.5,
        "price": 39100,
        "volume": 91000,
        "candleState": {
          "open": 39100,
          "high": 39100,
          "low": 39100,
          "close": 39100
        }
      },
      {
        "second": 15,
        "price": 39050,
        "volume": 98500,
        "candleState": {
          "open": 39100,
          "high": 39100,
          "low": 39050,
          "close": 39050
        }
      },
      {
        "second": 16.5,
        "price": 39050,
        "volume": 106000,
        "candleState": {
          "open": 39050,
          "high": 39050,
          "low": 39050,
          "close": 39050
        }
      },
      {
        "second": 18,
        "price": 39050,
        "volume": 113500,
        "candleState": {
          "open": 39050,
          "high": 39050,
          "low": 39050,
          "close": 39050
        }
      },
      {
        "second": 19.5,
        "price": 39050,
        "volume": 121000,
        "candleState": {
          "open": 39050,
          "high": 39050,
          "low": 39050,
          "close": 39050
        }
      },
      {
        "second": 21,
        "price": 39000,
        "volume": 128500,
        "candleState": {
          "open": 39050,
          "high": 39050,
          "low": 39000,
          "close": 39000
        }
      },
      {
        "second": 22.5,
        "price": 39000,
        "volume": 136000,
        "candleState": {
          "open": 39000,
          "high": 39000,
          "low": 39000,
          "close": 39000
        }
      },
      {
        "second": 24,
        "price": 39000,
        "volume": 143500,
        "candleState": {
          "open": 39000,
          "high": 39000,
          "low": 39000,
          "close": 39000
        }
      },
      {
        "second": 25.5,
        "price": 39000,
        "volume": 151000,
        "candleState": {
          "open": 39000,
          "high": 39000,
          "low": 39000,
          "close": 39000
        }
      },
      {
        "second": 27,
        "price": 38950,
        "volume": 158500,
        "candleState": {
          "open": 39000,
          "high": 39000,
          "low": 38950,
          "close": 38950
        }
      },
      {
        "second": 28.5,
        "price": 38950,
        "volume": 166000,
        "candleState": {
          "open": 38950,
          "high": 38950,
          "low": 38950,
          "close": 38950
        }
      },
      {
        "second": 30,
        "price": 38950,
        "volume": 173500,
        "candleState": {
          "open": 38950,
          "high": 38950,
          "low": 38950,
          "close": 38950
        }
      },
      {
        "second": 31.5,
        "price": 38950,
        "volume": 181000,
        "candleState": {
          "open": 38950,
          "high": 38950,
          "low": 38950,
          "close": 38950
        }
      },
      {
        "second": 33,
        "price": 38900,
        "volume": 188500,
        "candleState": {
          "open": 38950,
          "high": 38950,
          "low": 38900,
          "close": 38900
        }
      },
      {
        "second": 34.5,
        "price": 38900,
        "volume": 196000,
        "candleState": {
          "open": 38900,
          "high": 38900,
          "low": 38900,
          "close": 38900
        }
      },
      {
        "second": 36,
        "price": 38900,
        "volume": 203500,
        "candleState": {
          "open": 38900,
          "high": 38900,
          "low": 38900,
          "close": 38900
        }
      },
      {
        "second": 37.5,
        "price": 38850,
        "volume": 211000,
        "candleState": {
          "open": 38900,
          "high": 38900,
          "low": 38850,
          "close": 38850
        }
      },
      {
        "second": 39,
        "price": 38850,
        "volume": 218500,
        "candleState": {
          "open": 38850,
          "high": 38850,
          "low": 38850,
          "close": 38850
        }
      },
      {
        "second": 40.5,
        "price": 38850,
        "volume": 226000,
        "candleState": {
          "open": 38850,
          "high": 38850,
          "low": 38850,
          "close": 38850
        }
      },
      {
        "second": 42,
        "price": 38850,
        "volume": 233500,
        "candleState": {
          "open": 38850,
          "high": 38850,
          "low": 38850,
          "close": 38850
        }
      },
      {
        "second": 43.5,
        "price": 38800,
        "volume": 241000,
        "candleState": {
          "open": 38850,
          "high": 38850,
          "low": 38800,
          "close": 38800
        }
      },
      {
        "second": 45,
        "price": 38800,
        "volume": 248500,
        "candleState": {
          "open": 38800,
          "high": 38800,
          "low": 38800,
          "close": 38800
        }
      }
    ],
    "matchingTape": [
      {
        "id": "tape-6-0",
        "timeSecond": 3,
        "second": 3,
        "shares": 1000,
        "price": 39200,
        "side": "SELL",
        "text": "↓ -80,000 CP @ 39,100 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-6-1",
        "timeSecond": 6.5,
        "second": 6.5,
        "shares": 1500,
        "price": 39200,
        "side": "SELL",
        "text": "↓ -120,000 CP @ 39,000 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-6-2",
        "timeSecond": 10,
        "second": 10,
        "shares": 2000,
        "price": 39200,
        "side": "SELL",
        "text": "↓ -150,000 CP @ 38,900 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-6-3",
        "timeSecond": 13.5,
        "second": 13.5,
        "shares": 2500,
        "price": 39200,
        "side": "SELL",
        "text": "↓ -180,000 CP @ 38,800 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-6-4",
        "timeSecond": 17,
        "second": 17,
        "shares": 3000,
        "price": 39200,
        "side": "SELL",
        "text": "↓ -250,000 CP @ 38,800 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-6-5",
        "timeSecond": 20.5,
        "second": 20.5,
        "shares": 3500,
        "price": 39200,
        "side": "SELL",
        "text": "↓ -320,000 CP @ 38,800 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-6-6",
        "timeSecond": 24,
        "second": 24,
        "shares": 4000,
        "price": 39200,
        "side": "SELL",
        "text": "↓ -280,000 CP @ 38,800 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-6-7",
        "timeSecond": 27.5,
        "second": 27.5,
        "shares": 4500,
        "price": 39200,
        "side": "SELL",
        "text": "↓ -210,000 CP @ 38,800 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-6-8",
        "timeSecond": 31,
        "second": 31,
        "shares": 5000,
        "price": 39200,
        "side": "SELL",
        "text": "↓ -160,000 CP @ 38,800 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-6-9",
        "timeSecond": 34.5,
        "second": 34.5,
        "shares": 5500,
        "price": 39200,
        "side": "BUY",
        "text": "↑ +45,000 CP @ 38,850 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-6-10",
        "timeSecond": 38,
        "second": 38,
        "shares": 6000,
        "price": 39200,
        "side": "BUY",
        "text": "↑ +70,000 CP @ 38,800 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-6-11",
        "timeSecond": 41.5,
        "second": 41.5,
        "shares": 6500,
        "price": 39200,
        "side": "SELL",
        "text": "↓ -90,000 CP @ 38,800 (SELL)",
        "prefix": "↓"
      }
    ],
    "hypeRoomFeed": [
      {
        "id": "chat-6-0",
        "round": 6,
        "second": 4,
        "sender": "CáMậpQuận1",
        "avatar": "CÁ",
        "avatarBg": "cyan",
        "badge": "VIP 7",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "4s trước",
        "message": "Margin call dây chuyền bắt đầu rồi."
      },
      {
        "id": "chat-6-1",
        "round": 6,
        "second": 10.2,
        "sender": "ChứngSĩTỉnh",
        "avatar": "CH",
        "avatarBg": "amber",
        "badge": "F0",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "10.2s trước",
        "message": "Không còn muốn nhìn bảng điện nữa..."
      },
      {
        "id": "chat-6-2",
        "round": 6,
        "second": 16.4,
        "sender": "RoomVIP5",
        "avatar": "RO",
        "avatarBg": "blue",
        "badge": "VIP 2",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "16.4s trước",
        "message": "38.8k rồi, bên bán vẫn xả."
      },
      {
        "id": "chat-6-3",
        "round": 6,
        "second": 22.6,
        "sender": "Trader_Shark88",
        "avatar": "TR",
        "avatarBg": "amber",
        "badge": "VIP 5",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "22.6s trước",
        "message": "Stop-loss là kỷ luật, không phải thất bại."
      },
      {
        "id": "chat-6-4",
        "round": 6,
        "second": 28.8,
        "sender": "F0MO_Hunter",
        "avatar": "F0",
        "avatarBg": "emerald",
        "badge": "F0",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "28.8s trước",
        "message": "Ai còn sức mua thì cũng đừng bắt đáy mù quáng."
      },
      {
        "id": "chat-6-5",
        "round": 6,
        "second": 35,
        "sender": "NhaDauTuF0",
        "avatar": "NH",
        "avatarBg": "slate",
        "badge": "F0",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "35s trước",
        "message": "Capitulation có thể rất đau."
      },
      {
        "id": "chat-6-6",
        "round": 6,
        "second": 41.2,
        "sender": "KẹpHàng2026",
        "avatar": "KẸ",
        "avatarBg": "red",
        "badge": "VIP 3",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "41.2s trước",
        "message": "Mini quiz hỏi đúng tâm lý lúc này."
      }
    ],
    "breakingNews": {
      "badge": "CẢNH BÁO MARGIN",
      "urgency": "30 giây trước",
      "headline": "Nhiều tài khoản bị kích hoạt yêu cầu bổ sung tài sản đảm bảo.",
      "summary": "Lệnh giải chấp có thể tạo hiệu ứng domino và đẩy giá xuống nhanh hơn.",
      "impact": "Độ tiêu cực: Cực cao",
      "source": "Aura Financial Wire",
      "category": "CẢNH BÁO MARGIN",
      "timestamp": "2 phút trước",
      "impactText": "Độ tiêu cực: Cực cao",
      "narrativeSummary": "Lệnh giải chấp có thể tạo hiệu ứng domino và đẩy giá xuống nhanh hơn."
    },
    "trapOrQuiz": {
      "hasTrapOrQuiz": true,
      "triggerSecond": 30,
      "type": "MINI_QUIZ",
      "title": "Kỷ Luật Stop-Loss",
      "question": "Khi vị thế vượt ngưỡng rủi ro đã định, nguyên tắc nào cần ưu tiên?",
      "timeLimit": 10,
      "options": [
        {
          "id": "A",
          "text": "Mua đuổi/all-in vì sợ bỏ lỡ cơ hội."
        },
        {
          "id": "B",
          "text": "Tuân thủ stop-loss đã đặt trước thay vì nới ngưỡng vì hy vọng giá hồi."
        },
        {
          "id": "C",
          "text": "Vay thêm margin để tăng vị thế ngay lập tức."
        }
      ],
      "correctOptionId": "B",
      "psychologicalBias": "Loss Aversion & Sunk Cost Bias",
      "explanation": "Tuân thủ stop-loss đã đặt trước thay vì nới ngưỡng vì hy vọng giá hồi."
    },
    "specialMechanic": {
      "type": "MARGIN_CALL_CASCADE",
      "triggerSecond": 11,
      "description": "Tài khoản dùng đòn bẩy (đặc biệt FOMO Booster x5) có thể bị giải chấp bắt buộc khi giá xuống sâu."
    }
  },
  "7": {
    "roundId": 7,
    "roundName": "Phân Hóa & Hồi Phục",
    "narrativeStage": "Recovery (Hồi phục)",
    "sentiment": {
      "label": "Thận Trọng / Smart Money",
      "score": 64,
      "color": "amber"
    },
    "marketSummary": {
      "referencePrice": 38825,
      "ceilingPrice": 41500,
      "floorPrice": 36110,
      "openPrice": 38800,
      "expectedClose": 39600,
      "statusBadge": "+2.0% HỒI PHỤC (SMART MONEY)",
      "statusColor": "emerald"
    },
    "tickSeries": [
      {
        "second": 1.5,
        "price": 38850,
        "volume": 34500,
        "candleState": {
          "open": 38800,
          "high": 38850,
          "low": 38800,
          "close": 38850
        }
      },
      {
        "second": 3,
        "price": 38850,
        "volume": 42000,
        "candleState": {
          "open": 38850,
          "high": 38850,
          "low": 38850,
          "close": 38850
        }
      },
      {
        "second": 4.5,
        "price": 38850,
        "volume": 49500,
        "candleState": {
          "open": 38850,
          "high": 38850,
          "low": 38850,
          "close": 38850
        }
      },
      {
        "second": 6,
        "price": 38900,
        "volume": 57000,
        "candleState": {
          "open": 38850,
          "high": 38900,
          "low": 38850,
          "close": 38900
        }
      },
      {
        "second": 7.5,
        "price": 38950,
        "volume": 64500,
        "candleState": {
          "open": 38900,
          "high": 38950,
          "low": 38900,
          "close": 38950
        }
      },
      {
        "second": 9,
        "price": 38950,
        "volume": 72000,
        "candleState": {
          "open": 38950,
          "high": 38950,
          "low": 38950,
          "close": 38950
        }
      },
      {
        "second": 10.5,
        "price": 38950,
        "volume": 79500,
        "candleState": {
          "open": 38950,
          "high": 38950,
          "low": 38950,
          "close": 38950
        }
      },
      {
        "second": 12,
        "price": 39000,
        "volume": 87000,
        "candleState": {
          "open": 38950,
          "high": 39000,
          "low": 38950,
          "close": 39000
        }
      },
      {
        "second": 13.5,
        "price": 39050,
        "volume": 94500,
        "candleState": {
          "open": 39000,
          "high": 39050,
          "low": 39000,
          "close": 39050
        }
      },
      {
        "second": 15,
        "price": 39050,
        "volume": 102000,
        "candleState": {
          "open": 39050,
          "high": 39050,
          "low": 39050,
          "close": 39050
        }
      },
      {
        "second": 16.5,
        "price": 39100,
        "volume": 109500,
        "candleState": {
          "open": 39050,
          "high": 39100,
          "low": 39050,
          "close": 39100
        }
      },
      {
        "second": 18,
        "price": 39150,
        "volume": 117000,
        "candleState": {
          "open": 39100,
          "high": 39150,
          "low": 39100,
          "close": 39150
        }
      },
      {
        "second": 19.5,
        "price": 39150,
        "volume": 124500,
        "candleState": {
          "open": 39150,
          "high": 39150,
          "low": 39150,
          "close": 39150
        }
      },
      {
        "second": 21,
        "price": 39150,
        "volume": 132000,
        "candleState": {
          "open": 39150,
          "high": 39150,
          "low": 39150,
          "close": 39150
        }
      },
      {
        "second": 22.5,
        "price": 39200,
        "volume": 139500,
        "candleState": {
          "open": 39150,
          "high": 39200,
          "low": 39150,
          "close": 39200
        }
      },
      {
        "second": 24,
        "price": 39250,
        "volume": 147000,
        "candleState": {
          "open": 39200,
          "high": 39250,
          "low": 39200,
          "close": 39250
        }
      },
      {
        "second": 25.5,
        "price": 39250,
        "volume": 154500,
        "candleState": {
          "open": 39250,
          "high": 39250,
          "low": 39250,
          "close": 39250
        }
      },
      {
        "second": 27,
        "price": 39250,
        "volume": 162000,
        "candleState": {
          "open": 39250,
          "high": 39250,
          "low": 39250,
          "close": 39250
        }
      },
      {
        "second": 28.5,
        "price": 39300,
        "volume": 169500,
        "candleState": {
          "open": 39250,
          "high": 39300,
          "low": 39250,
          "close": 39300
        }
      },
      {
        "second": 30,
        "price": 39350,
        "volume": 177000,
        "candleState": {
          "open": 39300,
          "high": 39350,
          "low": 39300,
          "close": 39350
        }
      },
      {
        "second": 31.5,
        "price": 39350,
        "volume": 184500,
        "candleState": {
          "open": 39350,
          "high": 39350,
          "low": 39350,
          "close": 39350
        }
      },
      {
        "second": 33,
        "price": 39350,
        "volume": 192000,
        "candleState": {
          "open": 39350,
          "high": 39350,
          "low": 39350,
          "close": 39350
        }
      },
      {
        "second": 34.5,
        "price": 39400,
        "volume": 199500,
        "candleState": {
          "open": 39350,
          "high": 39400,
          "low": 39350,
          "close": 39400
        }
      },
      {
        "second": 36,
        "price": 39450,
        "volume": 207000,
        "candleState": {
          "open": 39400,
          "high": 39450,
          "low": 39400,
          "close": 39450
        }
      },
      {
        "second": 37.5,
        "price": 39450,
        "volume": 214500,
        "candleState": {
          "open": 39450,
          "high": 39450,
          "low": 39450,
          "close": 39450
        }
      },
      {
        "second": 39,
        "price": 39500,
        "volume": 222000,
        "candleState": {
          "open": 39450,
          "high": 39500,
          "low": 39450,
          "close": 39500
        }
      },
      {
        "second": 40.5,
        "price": 39550,
        "volume": 229500,
        "candleState": {
          "open": 39500,
          "high": 39550,
          "low": 39500,
          "close": 39550
        }
      },
      {
        "second": 42,
        "price": 39550,
        "volume": 237000,
        "candleState": {
          "open": 39550,
          "high": 39550,
          "low": 39550,
          "close": 39550
        }
      },
      {
        "second": 43.5,
        "price": 39550,
        "volume": 244500,
        "candleState": {
          "open": 39550,
          "high": 39550,
          "low": 39550,
          "close": 39550
        }
      },
      {
        "second": 45,
        "price": 39600,
        "volume": 252000,
        "candleState": {
          "open": 39550,
          "high": 39600,
          "low": 39550,
          "close": 39600
        }
      }
    ],
    "matchingTape": [
      {
        "id": "tape-7-0",
        "timeSecond": 3,
        "second": 3,
        "shares": 1000,
        "price": 38800,
        "side": "BUY",
        "text": "↑ +60,000 CP @ 38,900 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-7-1",
        "timeSecond": 6.5,
        "second": 6.5,
        "shares": 1500,
        "price": 38800,
        "side": "BUY",
        "text": "↑ +75,000 CP @ 39,000 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-7-2",
        "timeSecond": 10,
        "second": 10,
        "shares": 2000,
        "price": 38800,
        "side": "BUY",
        "text": "↑ +90,000 CP @ 39,100 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-7-3",
        "timeSecond": 13.5,
        "second": 13.5,
        "shares": 2500,
        "price": 38800,
        "side": "BUY",
        "text": "↑ +110,000 CP @ 39,200 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-7-4",
        "timeSecond": 17,
        "second": 17,
        "shares": 3000,
        "price": 38800,
        "side": "BUY",
        "text": "↑ +130,000 CP @ 39,300 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-7-5",
        "timeSecond": 20.5,
        "second": 20.5,
        "shares": 3500,
        "price": 38800,
        "side": "BUY",
        "text": "↑ +150,000 CP @ 39,400 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-7-6",
        "timeSecond": 24,
        "second": 24,
        "shares": 4000,
        "price": 38800,
        "side": "BUY",
        "text": "↑ +180,000 CP @ 39,500 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-7-7",
        "timeSecond": 27.5,
        "second": 27.5,
        "shares": 4500,
        "price": 38800,
        "side": "BUY",
        "text": "↑ +220,000 CP @ 39,600 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-7-8",
        "timeSecond": 31,
        "second": 31,
        "shares": 5000,
        "price": 38800,
        "side": "SELL",
        "text": "↓ -80,000 CP @ 39,550 (SELL)",
        "prefix": "↓"
      },
      {
        "id": "tape-7-9",
        "timeSecond": 34.5,
        "second": 34.5,
        "shares": 5500,
        "price": 38800,
        "side": "BUY",
        "text": "↑ +120,000 CP @ 39,600 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-7-10",
        "timeSecond": 38,
        "second": 38,
        "shares": 6000,
        "price": 38800,
        "side": "BUY",
        "text": "↑ +140,000 CP @ 39,600 (BUY)",
        "prefix": "↑"
      },
      {
        "id": "tape-7-11",
        "timeSecond": 41.5,
        "second": 41.5,
        "shares": 6500,
        "price": 38800,
        "side": "BUY",
        "text": "↑ +160,000 CP @ 39,600 (BUY)",
        "prefix": "↑"
      }
    ],
    "hypeRoomFeed": [
      {
        "id": "chat-7-0",
        "round": 7,
        "second": 4,
        "sender": "ChứngSĩTỉnh",
        "avatar": "CH",
        "avatarBg": "amber",
        "badge": "F0",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "4s trước",
        "message": "Có dòng tiền lớn đang hấp thụ cung."
      },
      {
        "id": "chat-7-1",
        "round": 7,
        "second": 10.2,
        "sender": "RoomVIP5",
        "avatar": "RO",
        "avatarBg": "blue",
        "badge": "VIP 2",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "10.2s trước",
        "message": "Tin kiểm toán chính thức ra rồi, rumor trước đó sai."
      },
      {
        "id": "chat-7-2",
        "round": 7,
        "second": 16.4,
        "sender": "Trader_Shark88",
        "avatar": "TR",
        "avatarBg": "amber",
        "badge": "VIP 5",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "16.4s trước",
        "message": "Smart money vào từ từ, không cần đuổi giá."
      },
      {
        "id": "chat-7-3",
        "round": 7,
        "second": 22.6,
        "sender": "F0MO_Hunter",
        "avatar": "F0",
        "avatarBg": "emerald",
        "badge": "F0",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "22.6s trước",
        "message": "39.6k giữ được rồi, thanh khoản cải thiện."
      },
      {
        "id": "chat-7-4",
        "round": 7,
        "second": 28.8,
        "sender": "NhaDauTuF0",
        "avatar": "NH",
        "avatarBg": "slate",
        "badge": "F0",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "28.8s trước",
        "message": "Sau cú call chéo, room im hẳn."
      },
      {
        "id": "chat-7-5",
        "round": 7,
        "second": 35,
        "sender": "KẹpHàng2026",
        "avatar": "KẸ",
        "avatarBg": "red",
        "badge": "VIP 3",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "35s trước",
        "message": "Hồi phục không có nghĩa quay lại đỉnh ngay."
      },
      {
        "id": "chat-7-6",
        "round": 7,
        "second": 41.2,
        "sender": "BullBear_VN",
        "avatar": "BU",
        "avatarBg": "violet",
        "badge": "Pro",
        "badgeColor": "bg-slate-100 text-slate-800",
        "time": "41.2s trước",
        "message": "Kết game rồi, xem NAV và bias của từng người."
      }
    ],
    "breakingNews": {
      "badge": "TIN DOANH NGHIỆP",
      "urgency": "15 giây trước",
      "headline": "Báo cáo tài chính đã kiểm toán chính thức bác bỏ các tin đồn tiêu cực trước đó.",
      "summary": "Kết quả cho thấy các chỉ tiêu trọng yếu phù hợp với công bố và củng cố niềm tin thị trường.",
      "impact": "Độ tích cực: Cao",
      "source": "Aura Financial Wire",
      "category": "TIN DOANH NGHIỆP",
      "timestamp": "2 phút trước",
      "impactText": "Độ tích cực: Cao",
      "narrativeSummary": "Kết quả cho thấy các chỉ tiêu trọng yếu phù hợp với công bố và củng cố niềm tin thị trường."
    },
    "trapOrQuiz": {
      "hasTrapOrQuiz": true,
      "triggerSecond": 30,
      "type": "MINI_QUIZ",
      "title": "Phân Hóa & Hồi Phục",
      "question": "Tin đồn đã được bác bỏ nhưng giá mới hồi nhẹ. Điều gì cần tránh?",
      "timeLimit": 10,
      "options": [
        {
          "id": "A",
          "text": "Mua đuổi/all-in vì sợ bỏ lỡ cơ hội."
        },
        {
          "id": "B",
          "text": "Không kết luận xu hướng dài hạn chỉ từ một phiên hồi; đánh giá lại thanh khoản, định giá và rủi ro."
        },
        {
          "id": "C",
          "text": "Vay thêm margin để tăng vị thế ngay lập tức."
        }
      ],
      "correctOptionId": "B",
      "psychologicalBias": "Confirmation Bias & Recency Bias",
      "explanation": "Không kết luận xu hướng dài hạn chỉ từ một phiên hồi; đánh giá lại thanh khoản, định giá và rủi ro."
    }
  }
};

// Additional situational question bank for replaying
export const MAP1_EXTRA_QUIZ_BANK: Map1QuizItem[] = [
  {
    hasTrapOrQuiz: true,
    triggerSecond: 30,
    type: "TRAP_POPUP",
    title: "Bẫy Bắt Đáy Dao Rơi",
    question: "Cổ phiếu giảm sàn phiên thứ 2 liên tiếp với khối lượng dư bán lớn. Hành động đúng đắn là gì?",
    timeLimit: 10,
    options: [
      { id: "A", text: "Vào bắt đáy ngay vì giá đã quá rẻ so với đỉnh." },
      { id: "B", text: "Đứng ngoài quan sát, chờ tín hiệu cân bằng cung cầu và thanh khoản hấp thụ." },
      { id: "C", text: "Dùng Margin x5 để trung bình giá xuống nhanh gỡ hòa." }
    ],
    correctOptionId: "B",
    psychologicalBias: "Catching Falling Knife / Anchoring Bias",
    explanation: "Bắt đáy khi cổ phiếu đang mất thanh khoản giống như bắt dao rơi. Chỉ giải ngân khi có vùng cân bằng."
  },
  {
    hasTrapOrQuiz: true,
    triggerSecond: 30,
    type: "TRAP_POPUP",
    title: "Bẫy Đòn Bẩy Quá Mức",
    question: "Tài khoản đang âm 15% do biến động thị trường. Bạn có nên tăng đòn bẩy Margin lên x5?",
    timeLimit: 10,
    options: [
      { id: "A", text: "Tuyệt đối không tăng margin khi vị thế đang lỗ; tuân thủ ngưỡng cắt lỗ kỷ luật." },
      { id: "B", text: "Tăng x5 để một nhịp hồi nhẹ là lấy lại vốn ngay." },
      { id: "C", text: "Bán hết cổ phiếu cơ bản để mua thêm mã đầu cơ gỡ lỗ." }
    ],
    correctOptionId: "A",
    psychologicalBias: "Loss Aversion / Martingale Trap",
    explanation: "Gấp thếp đòn bẩy khi đang thua lỗ là con đường nhanh nhất dẫn tới cháy tài khoản (Stop-Out)."
  },
  {
    hasTrapOrQuiz: true,
    triggerSecond: 30,
    type: "MINI_QUIZ",
    title: "Kỷ Luật Cắt Lỗ Chủ Động",
    question: "Nguyên tắc quản trị rủi ro cơ bản khi một vị thế chạm ngưỡng lỗ -7% là gì?",
    timeLimit: 10,
    options: [
      { id: "A", text: "Tiếp tục giữ vì tin rằng cổ phiếu tốt kiểu gì cũng sẽ tăng trở lại." },
      { id: "B", text: "Chủ động cắt lỗ 50% hoặc toàn bộ để bảo toàn vốn và kiểm soát tâm lý." },
      { id: "C", text: "Xóa app không theo dõi bảng điện nữa." }
    ],
    correctOptionId: "B",
    psychologicalBias: "Disposition Effect",
    explanation: "Cắt lỗ chủ động bảo vệ 93% vốn còn lại để tìm kiếm cơ hội thị trường tốt hơn."
  }
];
