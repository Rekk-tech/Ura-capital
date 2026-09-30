export interface BotChatMessage {
  sender: string;
  message: string;
}

export interface TrapOption {
  id: string;
  label: string;
  isAggressive: boolean;
}

export interface TrapConfig {
  id: string;
  title: string;
  prompt: string;
  options: TrapOption[];
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizConfig {
  id: string;
  prompt: string;
  options: QuizOption[];
  rewardRewardText?: string;
}

export interface RoundConfig {
  roundNumber: number;
  name: string;
  priceChangePercent: number;
  estimatedClosePrice: number;
  news: string;
  botChat: BotChatMessage[];
  trap: TrapConfig | null;
  quiz: QuizConfig | null;
  hint?: string;
  dropAtSecond?: number;
  isLiquidityFreeze?: boolean;
}

export interface Map1GameConfig {
  symbol: string;
  initialCash: number;
  initialPrice: number;
  transactionFeeRate: number;
  marginInterestRatePerRound: number;
  stopOutNavThreshold: number;
  stopOutEquityRatioThreshold: number;
  totalRounds: number;
  roundDurationSeconds: number;
  phases: {
    news_and_trap: { startSec: number; endSec: number };
    trading_window: { startSec: number; endSec: number };
    trap_or_quiz: { startSec: number; endSec: number };
    ledger_update: { startSec: number; endSec: number };
  };
  fomoWeights: {
    w1_buyAtHigh: number;
    w2_allIn: number;
    w3_lastSeconds: number;
  };
  disciplineDeductions: {
    noStopLoss: number;
    marginDuringLoss: number;
    wrongQuiz: number;
  };
  rounds: RoundConfig[];
}

export const map1GameConfig: Map1GameConfig = {
  symbol: "$FOMO",
  initialCash: 10000000,
  initialPrice: 10000,
  transactionFeeRate: 0.0015,
  marginInterestRatePerRound: 0.001,
  stopOutNavThreshold: 5000000,
  stopOutEquityRatioThreshold: 0.2,
  totalRounds: 7,
  roundDurationSeconds: 45,
  phases: {
    news_and_trap: { startSec: 0, endSec: 10 },
    trading_window: { startSec: 10, endSec: 30 },
    trap_or_quiz: { startSec: 30, endSec: 40 },
    ledger_update: { startSec: 40, endSec: 45 }
  },
  fomoWeights: {
    w1_buyAtHigh: 0.5,
    w2_allIn: 0.3,
    w3_lastSeconds: 0.2
  },
  disciplineDeductions: {
    noStopLoss: 15,
    marginDuringLoss: 30,
    wrongQuiz: 10
  },
  rounds: [
    {
      roundNumber: 1,
      name: "Khởi Động",
      priceChangePercent: 3.0,
      estimatedClosePrice: 10300,
      news: "Công ty công bố ký kết biên bản ghi nhớ hợp tác chiến lược.",
      botChat: [
        { sender: "SharkVn", message: "Kèo này x2 tài khoản nhé anh em!" },
        { sender: "TraderF0", message: "Vào sớm ăn dày, không kịp tiếc lắm." }
      ],
      trap: null,
      quiz: null,
      hint: "Gợi ý: Sử dụng Quick Buy 25%, 50% hoặc 100% để tối ưu thao tác."
    },
    {
      roundNumber: 2,
      name: "FOMO Peak",
      priceChangePercent: 6.9,
      estimatedClosePrice: 11010,
      news: "Cổ đông lớn đăng ký gom thêm 5 triệu cổ phiếu.",
      botChat: [
        { sender: "AlphaWhale", message: "Múc nhanh còn kịp, mất hàng bây giờ!" },
        { sender: "StockFan", message: "Tím lịm tìm sim! Trần cứng rồi!" }
      ],
      trap: {
        id: "trap-r2-ato",
        title: "Dư mua trần kỷ lục!",
        prompt: "Cổ phiếu dư mua trần 2 triệu đơn vị. Bạn có muốn đặt lệnh mua quét (ATO/MP) bằng mọi giá?",
        options: [
          { id: "yes", label: "Có, mua quét ngay!", isAggressive: true },
          { id: "no", label: "Không, kiên nhẫn quan sát", isAggressive: false }
        ]
      },
      quiz: null
    },
    {
      roundNumber: 3,
      name: "Bẫy Margin",
      priceChangePercent: -7.0,
      dropAtSecond: 25,
      estimatedClosePrice: 10239,
      news: "Tin đồn: Cơ quan chức năng tiến hành thanh tra doanh nghiệp.",
      botChat: [
        { sender: "PanicSeller", message: "Ai xả vậy? Chạy mau!" },
        { sender: "CaptainHold", message: "Đội lái rung cây dọa khỉ thôi, gom thêm giá sàn đi!" }
      ],
      trap: {
        id: "trap-r3-margin",
        title: "Cơ hội bình quân giá!",
        prompt: "Giá đang rơi sàn! Kích hoạt đòn bẩy Margin x2 ngay để trung bình giá vốn?",
        options: [
          { id: "yes", label: "Mở Margin x2 mua bắt đáy", isAggressive: true },
          { id: "no", label: "Giữ kỷ luật, không dùng margin bắt dao rơi", isAggressive: false }
        ]
      },
      quiz: null
    },
    {
      roundNumber: 4,
      name: "Bull-trap",
      priceChangePercent: 4.0,
      estimatedClosePrice: 10649,
      news: "Chủ tịch đăng đàn phủ nhận toàn bộ tin đồn thất thiệt.",
      botChat: [
        { sender: "BullRider", message: "Thấy chưa, đáy rồi! Lên tàu!" },
        { sender: "QuickTrade", message: "Bắt đáy thành công ăn trọn cây hồi kỹ thuật!" }
      ],
      trap: null,
      quiz: {
        id: "quiz-r4",
        prompt: "Giá tăng lại sau phiên sàn nhưng khối lượng khớp lệnh thấp — đây là hiện tượng gì?",
        options: [
          { id: "A", text: "Tích luỹ bền vững chuẩn bị vượt đỉnh", isCorrect: false },
          { id: "B", text: "Bull-trap (bẫy tăng giá hồi kỹ thuật)", isCorrect: true },
          { id: "C", text: "Dòng tiền lớn gom hàng bí mật", isCorrect: false }
        ],
        rewardRewardText: "Nhận 1 lệnh bảo vệ Stop-loss miễn phí"
      }
    },
    {
      roundNumber: 5,
      name: "Cắt Thanh Khoản",
      priceChangePercent: -7.0,
      isLiquidityFreeze: true,
      estimatedClosePrice: 9903,
      news: "Sàn giao dịch nghẽn lệnh, lệnh bán giá thị trường không thể khớp.",
      botChat: [
        { sender: "TraderF0", message: "Cứu với! Sao bấm bán không được?" },
        { sender: "Hopeless", message: "Trắng bên mua rồi, xếp hàng bán giá sàn thôi!" }
      ],
      trap: {
        id: "trap-r5-liquidity",
        title: "Nghẽn lệnh hệ thống",
        prompt: "Lệnh bán thị trường bị khoá do trắng bên mua. Chỉ có thể đặt lệnh bán sàn MP xếp hàng.",
        options: [
          { id: "queue_floor", label: "Xếp hàng bán sàn", isAggressive: false },
          { id: "hold", label: "Tiếp tục ôm giữ", isAggressive: false }
        ]
      },
      quiz: null
    },
    {
      roundNumber: 6,
      name: "Rửa Phèn",
      priceChangePercent: -1.0,
      estimatedClosePrice: 9804,
      news: "Chuyên gia khuyến nghị nhà đầu tư giữ bình tĩnh, rà soát danh mục.",
      botChat: [
        { sender: "BurnedAccount", message: "Cháy tài khoản rồi, chia tay thị trường..." },
        { sender: "ExTrader", message: "Thôi bỏ chứng khoán đi làm việc khác." }
      ],
      trap: null,
      quiz: {
        id: "quiz-r6",
        prompt: "Khi tài khoản đang chịu khoản lỗ lớn, kỷ luật cốt lõi đầu tiên cần thực hiện là gì?",
        options: [
          { id: "A", text: "Nạp thêm tiền để gỡ gạc nhanh chóng", isCorrect: false },
          { id: "B", text: "Đo mức chịu lỗ & kích hoạt cắt lỗ định trước", isCorrect: true },
          { id: "C", text: "Tắt bảng điện bỏ mặc tài khoản", isCorrect: false }
        ]
      }
    },
    {
      roundNumber: 7,
      name: "Phân Hoá",
      priceChangePercent: 2.0,
      estimatedClosePrice: 10000,
      news: "Báo cáo tài chính quý xác nhận kết quả kinh doanh bình thường, thanh khoản phục hồi.",
      botChat: [
        { sender: "SmartMoney", message: "Dòng tiền tổ chức bắt đầu mua rải rác tài sản tốt." },
        { sender: "Survivor", message: "Hú vía, còn thở là còn gỡ!" }
      ],
      trap: null,
      quiz: null
    }
  ]
};
