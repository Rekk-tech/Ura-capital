/**
 * Realistic Simulation Scenarios & Macro Regimes Store
 * FEAT-087: Multi-scenario realistic simulation datasets for Map 1 (FOMO Arena) and Map 2 (Pro Room)
 */

export interface FomoScenarioDefinition {
  key: string;
  ticker: string;
  codeTag: string;
  name: string;
  category: "PENNY_SPECULATION" | "REAL_ESTATE_DEBT" | "TECH_BLUECHIP";
  badge: string;
  badgeColor: string;
  difficulty: "Trung Bình" | "Khốc Liệt" | "Nâng Cao";
  difficultyColor: string;
  featureSubtitle: string;
  description: string;
  historicalContext: string;
  initialPrice: number;
  expectedVolatility: string;
  metricPills: Array<{ label: string; value: string; isDanger?: boolean; isSuccess?: boolean }>;
  chartMeta: {
    modelName: string;
    performanceStat: string;
    statColor: "orange" | "red" | "green";
    annotation: string;
    annotationPos: { x: number; y: number };
    pathD: string;
    areaD: string;
    strokeColor: string;
    fillGradient: { id: string; stopColor: string };
  };
  roundNarratives: Record<
    number,
    {
      roundName: string;
      stage: string;
      headline: string;
      category: string;
      impact: string;
      narrative: string;
      expectedPriceChange: number;
      chatSnippets: Array<{ sender: string; message: string; role?: string }>;
    }
  >;
}

export const FOMO_SCENARIOS: Record<string, FomoScenarioDefinition> = {
  vix_pump: {
    key: "vix_pump",
    ticker: "$VIX_PUMP",
    codeTag: "SVIX_PUMP",
    name: "Sóng Đầu Cơ Penny & Bẫy Kéo Xả ATO",
    category: "PENNY_SPECULATION",
    badge: "Bẫy Thanh Khoản",
    badgeColor: "amber",
    difficulty: "Trung Bình",
    difficultyColor: "amber",
    featureSubtitle: "• Bẫy Margin Call x2",
    description: "Thao túng tâm lý F0 đua lệnh trần ATO, đội lái kích hoạt bẫy margin x2 tại đỉnh rồi xả hàng tắt thanh khoản. Thử thách phản xạ cắt lỗ ngay trong 3 vòng đầu!",
    historicalContext: "Mô phỏng đợt sóng đầu cơ penny và các đội nhóm hô hào kéo xả kinh điển trên thị trường chứng khoán Việt Nam.",
    initialPrice: 10000,
    expectedVolatility: "Biên độ ±7% kịch trần kịch sàn",
    metricPills: [
      { label: "Biên độ", value: "±7% kịch trần kịch sàn" },
      { label: "Rung lắc", value: "Cực Cao" },
      { label: "Đòn bẩy", value: "Max 1:2" },
    ],
    chartMeta: {
      modelName: "Mô hình nến: Bơm - Xả",
      performanceStat: "+18.4% -> -24%",
      statColor: "orange",
      annotation: "Bẫy đỉnh Vòng 4",
      annotationPos: { x: 138, y: 14 },
      pathD: "M 10 46 C 45 46, 75 38, 105 28 C 120 22, 130 14, 138 14 C 146 14, 155 30, 168 45 C 176 52, 185 54, 195 54",
      areaD: "M 10 46 C 45 46, 75 38, 105 28 C 120 22, 130 14, 138 14 C 146 14, 155 30, 168 45 C 176 52, 185 54, 195 54 L 195 62 L 10 62 Z",
      strokeColor: "#2563eb",
      fillGradient: { id: "grad_vix", stopColor: "#3b82f6" },
    },
    roundNarratives: {
      1: {
        roundName: "Khởi Động Tích Luỹ",
        stage: "Accumulation",
        headline: "Tin đồn: Doanh nghiệp chuẩn bị thâu tóm dự án trọng điểm, đối tác ngoại tham gia.",
        category: "TIN ĐỒN THỊ TRƯỜNG",
        impact: "Dòng tiền đầu cơ rục rịch",
        narrative: "Khối lượng khớp lệnh tăng đột biến sau chuỗi ngày cạn kiệt, các nhóm kín bắt đầu rỉ tai nhau.",
        expectedPriceChange: 3.0,
        chatSnippets: [
          { sender: "SharkVn", message: "Kèo này x2 tài khoản nhẹ nhàng nhé anh em!", role: "VIP Broker" },
          { sender: "TraderF0", message: "Có tin gì mà nay lệnh vào to thế các bác?" },
          { sender: "AlphaLeader", message: "Vào sớm gom chân sóng, chậm chân là chỉ còn ăn bô!" },
        ],
      },
      2: {
        roundName: "FOMO Peak — Bẫy Trần ATO",
        stage: "Euphoria Peak",
        headline: "Dư mua giá trần hơn 5 triệu cổ phiếu, lệnh MP quét sạch bảng điện trong 15 giây.",
        category: "SỰ KIỆN GIAO DỊCH",
        impact: "Hưng phấn tột độ",
        narrative: "Nhỏ lẻ tranh nhau đặt lệnh trần ATO bằng mọi giá, đội lái kích hoạt bẫy tâm lý sợ bỏ lỡ.",
        expectedPriceChange: 6.9,
        chatSnippets: [
          { sender: "AlphaWhale", message: "Múc cật lực! Trần 5 cây liên tiếp không cần chỉnh!", role: "Đội Lái" },
          { sender: "StockFan", message: "Tím lịm tìm sim! Đã full margin rồi anh em!" },
          { sender: "BrokerTop1", message: "Khách hàng ai chưa có hàng thì kê giá trần ngay nhé." },
        ],
      },
      3: {
        roundName: "Bẫy Margin — Rơi Tự Do",
        stage: "Distribution Drop",
        headline: "Lực bán chủ động bất ngờ đổ ra hơn 10 triệu cổ phiếu, giá quay đầu giảm sàn.",
        category: "CẢNH BÁO PHÂN PHỐI",
        impact: "Cú sốc đảo chiều",
        narrative: "Đội lái xả hàng phân phối quyết liệt. Màn hình kích hoạt bẫy mời gọi kích hoạt margin x2 bắt đáy.",
        expectedPriceChange: -7.0,
        chatSnippets: [
          { sender: "PanicTrader", message: "Chuyện gì thế này? Đang trần sao lăn ra sàn vậy?!" },
          { sender: "CaptainHold", message: "Rung cây dọa khỉ thôi, gom thêm giá sàn trung bình giá ngay!", role: "Kẹp Hàng" },
          { sender: "BrokerTop1", message: "Ai kẹp hàng mở thêm margin để kéo giá vốn về sát đáy nhé." },
        ],
      },
      4: {
        roundName: "Bull-trap — Hồi Kỹ Thuật Giả Tạo",
        stage: "Technical Bounce",
        headline: "Chủ tịch đăng đàn phát biểu trấn an: Hoạt động kinh doanh hoàn toàn bình thường.",
        category: "TRẤN AN CÔNG LUẬN",
        impact: "Bẫy tăng giá hồi phục",
        narrative: "Giá hồi xanh nhẹ 4% nhưng khối lượng khớp lệnh teo tóp, biểu hiện rõ nét của bẫy Bull-trap.",
        expectedPriceChange: 4.0,
        chatSnippets: [
          { sender: "BullRider", message: "Thấy chưa, chỉnh xong rồi! Lên tàu tiếp anh em ơi!" },
          { sender: "QuickTrader", message: "Bắt đáy hôm qua nay lãi ngay 5%, siêu nhân là có thật!" },
          { sender: "DisciplinedTrader", message: "Vol hồi thấp bất thường, cẩn thận đây là Bull-trap kinh điển.", role: "Chuyên Gia" },
        ],
      },
      5: {
        roundName: "Cắt Thanh Khoản — Nghẽn Lệnh Trắng Mua",
        stage: "Liquidity Freeze",
        headline: "Trắng bên mua! Hơn 15 triệu cổ phiếu chất bán sàn không có người mua.",
        category: "KHỦNG HOẢNG THANH KHOẢN",
        impact: "Mất thanh khoản hoàn toàn",
        narrative: "Lệnh bán thị trường bị nghẽn, bảng điện đóng băng, nhà đầu tư kẹt vốn không thể thoát lệnh.",
        expectedPriceChange: -7.0,
        chatSnippets: [
          { sender: "TraderF0", message: "Cứu em với! Sao bấm bán MP cả tiếng không khớp được một cổ?" },
          { sender: "Hopeless", message: "Xếp hàng 10 triệu cổ sàn rồi, tắt app đi ngủ thôi..." },
          { sender: "MarginCallBot", message: "Hệ thống cảnh báo: Tài khoản của bạn chạm ngưỡng Call Margin." },
        ],
      },
      6: {
        roundName: "Rửa Phèn — Bán Tháo Hoảng Loạn",
        stage: "Capitulation",
        headline: "Các công ty chứng khoán đồng loạt bán giải chấp bắt buộc để thu hồi nợ vay.",
        category: "FORCE SELL TOÀN DIỆN",
        impact: "Thanh lọc tài khoản",
        narrative: "Nhà đầu tư hoảng loạn tột cùng, cắt lỗ trong tuyệt vọng, rũ bỏ toàn bộ lượng margin yếu ớt.",
        expectedPriceChange: -1.0,
        chatSnippets: [
          { sender: "BurnedAccount", message: "Cháy sạch tài khoản rồi... Chia tay chứng khoán vĩnh viễn." },
          { sender: "DisciplinedTrader", message: "Ai giữ kỷ luật cắt lỗ sớm ở vòng 3 thì giờ đã bảo toàn 90% vốn." },
          { sender: "SmartMoney", message: "Bắt đầu xuất hiện lực cầu hấp thụ 500k cổ phiếu giá sàn của dòng tiền lớn." },
        ],
      },
      7: {
        roundName: "Phân Hoá & Tái Lập Trật Tự",
        stage: "Differentiation Rebound",
        headline: "Thị trường hấp thụ sạch lượng hàng giải chấp, thanh khoản trở lại mức cân bằng.",
        category: "CÂN BẰNG THỊ TRƯỜNG",
        impact: "Khép lại chu kỳ đầu cơ",
        narrative: "Cơn bão đầu cơ qua đi, bài học sinh tồn đọng lại cho những ai biết giữ nguyên tắc quản trị rủi ro.",
        expectedPriceChange: 2.1,
        chatSnippets: [
          { sender: "SurvivorTrader", message: "Hú vía! Còn giữ được vốn là bài học quý giá nhất cuộc đời đầu tư." },
          { sender: "ProMentor", message: "Đừng bao giờ trung bình giá xuống một cổ phiếu đầu cơ đang rơi sàn.", role: "Cố Vấn Aura" },
          { sender: "AlphaLeader", message: "Hẹn anh em ở chu kỳ sau, bài học quản trị vốn luôn đúng mọi thời đại." },
        ],
      },
    },
  },

  nvl_crash: {
    key: "nvl_crash",
    ticker: "$NVL_CRASH",
    codeTag: "SNVL_CRASH",
    name: "Đóng Băng Thanh Khoản BĐS & Khủng Hoảng Nợ",
    category: "REAL_ESTATE_DEBT",
    badge: "Khủng Hoảng Nợ",
    badgeColor: "rose",
    difficulty: "Khốc Liệt",
    difficultyColor: "rose",
    featureSubtitle: "• Bán Tháo Chuỗi Sàn",
    description: "Khủng hoảng dòng tiền trái phiếu đáo hạn, bán giải chấp chéo call margin toàn thị trường, chuỗi sàn liên hoàn. Kiểm tra kỷ luật \"tuyệt đối không bắt dao rơi\".",
    historicalContext: "Mô phỏng đợt khủng hoảng đóng băng thanh khoản bất động sản và sụp đổ đòn bẩy tài chính cuối năm 2022.",
    initialPrice: 75000,
    expectedVolatility: "Chuỗi 5 phiên sàn liên tiếp, call margin chéo",
    metricPills: [
      { label: "Quy mô", value: "Chuỗi 5 phiên sàn liên tiếp" },
      { label: "Rủi ro", value: "Call margin chéo" },
      { label: "Thanh khoản", value: "Tắt hẳn", isDanger: true },
    ],
    chartMeta: {
      modelName: "Mô hình: Rơi tự do",
      performanceStat: "-48.5%",
      statColor: "red",
      annotation: "Bẫy hồi Bull-trap tại Vòng 3",
      annotationPos: { x: 105, y: 40 },
      pathD: "M 10 18 C 30 20, 55 28, 75 44 C 85 50, 95 44, 105 40 C 115 36, 125 45, 140 52 C 160 58, 180 58, 195 58",
      areaD: "M 10 18 C 30 20, 55 28, 75 44 C 85 50, 95 44, 105 40 C 115 36, 125 45, 140 52 C 160 58, 180 58, 195 58 L 195 62 L 10 62 Z",
      strokeColor: "#ef4444",
      fillGradient: { id: "grad_nvl", stopColor: "#ef4444" },
    },
    roundNarratives: {
      1: {
        roundName: "Vết Rạn Dòng Tiền",
        stage: "Credit Tightening",
        headline: "Thắt chặt tín dụng bất động sản, lãi suất cho vay mua nhà nhảy vọt lên 14%/năm.",
        category: "CHÍNH SÁCH TIỀN TỆ",
        impact: "Dòng tiền bán hàng tắc nghẽn",
        narrative: "Thanh khoản bán lẻ bất động sản đóng băng, doanh nghiệp đối mặt áp lực dòng tiền ngắn hạn.",
        expectedPriceChange: -2.5,
        chatSnippets: [
          { sender: "BankAnalyst", message: "Room tín dụng cạn kiệt, các dự án lớn gặp khó khăn giải ngân." },
          { sender: "RealEstateFan", message: "Tài sản quỹ đất lớn như thế lo gì, giảm là cơ hội múc thêm!" },
        ],
      },
      2: {
        roundName: "Khủng Hoảng Trái Phiếu Đáo Hạn",
        stage: "Bond Liquidity Crunch",
        headline: "Doanh nghiệp công bố kế hoạch đàm phán gia hạn gói trái phiếu 5.000 tỷ đồng.",
        category: "ÁP LỰC NỢ VAY",
        impact: "Căng thẳng thanh khoản đỉnh điểm",
        narrative: "Nhà đầu tư cá nhân lo ngại rủi ro thanh toán nợ gốc, áp lực bán lan rộng khắp các diễn đàn.",
        expectedPriceChange: -7.0,
        chatSnippets: [
          { sender: "BondHolder", message: "Không thanh toán đúng hạn là vỡ nợ kỹ thuật rồi, bán tháo thôi!" },
          { sender: "PanicSeller", message: "Bán ngay kẻo ngày mai không còn ai mua!" },
        ],
      },
      3: {
        roundName: "Call Margin Chéo Toàn Diện",
        stage: "Cross-Margin Forced Selling",
        headline: "Cổ phiếu cổ đông lớn bị các công ty chứng khoán đồng loạt bán giải chấp.",
        category: "GIẢI CHẤP TOÀN BỘ",
        impact: "Mất thanh khoản diện rộng",
        narrative: "Chất bán sàn 40 triệu cổ phiếu. Các tài khoản dùng cổ phiếu này làm tài sản đảm bảo bị bán lan sang cổ phiếu khác.",
        expectedPriceChange: -7.0,
        chatSnippets: [
          { sender: "BrokerVN", message: "Tài khoản ai có mã này đều bị call margin chéo, nộp thêm tiền ngay!" },
          { sender: "TraderTrapped", message: "Kê lệnh sàn từ 8h sáng mà số thứ tự đến 20 triệu không khớp được." },
        ],
      },
      4: {
        roundName: "Bẫy Giải Cứu Hụt (False Rescue)",
        stage: "Failed Capitulation Bounce",
        headline: "Một phiên giao dịch kỷ lục 120 triệu cổ phiếu được 'giải cứu' quét sạch giá sàn.",
        category: "DÒNG TIỀN ĐỘT BIẾN",
        impact: "Bẫy bắt đáy giả tạo",
        narrative: "F0 ùa vào bắt đáy tưởng chừng đảo chiều, nhưng lực bán ngầm tiếp tục dội xuống vào cuối phiên.",
        expectedPriceChange: 3.5,
        chatSnippets: [
          { sender: "HeroTrader", message: "Đã có tay to giải cứu 100 triệu cổ sàn! Lên tàu nhân đôi tài khoản!" },
          { sender: "SeniorAnalyst", message: "Đây là trao tay giải chấp nội bộ, cầu tự nhiên không có, tuyệt đối không nhảy vào!", role: "Chuyên Gia" },
        ],
      },
      5: {
        roundName: "Tê Liệt Thanh Khoản Đợt 2",
        stage: "Secondary Freeze",
        headline: "Sau phiên khớp kỷ lục, cổ phiếu lập tức quay lại trạng thái trắng bên mua.",
        category: "SỤP ĐỔ NIỀM TIN",
        impact: "Đóng băng tài sản bắt đáy",
        narrative: "Toàn bộ lượng hàng bắt đáy ở phiên trước về tài khoản trong tình trạng lỗ ngay 14-20%.",
        expectedPriceChange: -7.0,
        chatSnippets: [
          { sender: "CryingTrader", message: "Bắt đáy hôm trước tưởng anh hùng, nay thành nạn nhân..." },
          { sender: "RiskManager", message: "Bài học số 1: Không bao giờ bắt dao rơi của doanh nghiệp mất thanh khoản nợ." },
        ],
      },
      6: {
        roundName: "Tái Cấu Trúc Toàn Diện",
        stage: "Debt Restructuring",
        headline: "Chính phủ ban hành nghị định tháo gỡ trái phiếu, ngân hàng hỗ trợ cơ cấu nợ.",
        category: "CHÍNH SÁCH HỖ TRỢ",
        impact: "Khởi đầu tái sinh",
        narrative: "Doanh nghiệp hoán đổi nợ bằng bất động sản, áp lực giải chấp dần về điểm dừng.",
        expectedPriceChange: 1.2,
        chatSnippets: [
          { sender: "MacroObserver", message: "Đáy thanh khoản đã được xác lập, nhưng thời gian phục hồi sẽ tính bằng năm." },
        ],
      },
      7: {
        roundName: "Cân Bằng Tại Vùng Giá Mới",
        stage: "New Baseline",
        headline: "Thanh khoản khớp lệnh bình thường trở lại tại nền giá chiết khấu 75% so với đỉnh.",
        category: "ỔN ĐỊNH BÌNH THƯỜNG",
        impact: "Định giá lại toàn diện",
        narrative: "Cổ phiếu định hình lại mặt bằng định giá mới phản ánh đúng rủi ro tài chính của doanh nghiệp.",
        expectedPriceChange: 2.8,
        chatSnippets: [
          { sender: "ValueSeeker", message: "Giờ chỉ dành cho nhà đầu tư kiên nhẫn nắm giữ dài hạn hiểu rõ cơ cấu tài sản." },
        ],
      },
    },
  },

  fpt_exp: {
    key: "fpt_exp",
    ticker: "$FPT_EXP",
    codeTag: "SFPT_EXP",
    name: "Siêu Cổ Phiếu Vượt Đỉnh ATH & Shakeout",
    category: "TECH_BLUECHIP",
    badge: "Bluechip Công Nghệ",
    badgeColor: "teal",
    difficulty: "Nâng Cao",
    difficultyColor: "teal",
    featureSubtitle: "• Breakout All-Time-High",
    description: "Hành trình tăng trưởng bền vững: Vượt qua cú rũ cung shakeout dữ dội trước khi bứt phá đỉnh lịch sử nhờ hợp đồng AI. Luyện kỹ năng gồng lãi (Trend Following).",
    historicalContext: "Mô phỏng hành trình tăng trưởng bền vững của các tập đoàn công nghệ hàng đầu VN30 khi bước vào kỷ nguyên số.",
    initialPrice: 95000,
    expectedVolatility: "Biến động tích lũy chặt chẽ, bứt phá xu hướng lớn",
    metricPills: [
      { label: "Chiến lược", value: "Tích lũy nền giá chặt" },
      { label: "Xu hướng", value: "Bứt phá xu hướng lớn" },
      { label: "Vol bùng nổ", value: "", isSuccess: true },
    ],
    chartMeta: {
      modelName: "Mô hình: Shakeout & Run",
      performanceStat: "+32.8%",
      statColor: "green",
      annotation: "Shakeout đáy rũ Vòng 3",
      annotationPos: { x: 90, y: 50 },
      pathD: "M 10 40 C 35 40, 55 42, 75 47 C 83 49, 90 51, 98 48 C 110 42, 130 28, 155 18 C 170 14, 185 14, 195 14",
      areaD: "M 10 40 C 35 40, 55 42, 75 47 C 83 49, 90 51, 98 48 C 110 42, 130 28, 155 18 C 170 14, 185 14, 195 14 L 195 62 L 10 62 Z",
      strokeColor: "#10b981",
      fillGradient: { id: "grad_fpt", stopColor: "#10b981" },
    },
    roundNarratives: {
      1: {
        roundName: "Nền Tích Luỹ Chặt Chẽ",
        stage: "Base Consolidation",
        headline: "Doanh nghiệp công bố tăng trưởng doanh thu công nghệ thông tin nước ngoài đạt +28% YoY.",
        category: "KẾT QUẢ KINH DOANH",
        impact: "Nền tảng cơ bản vững chắc",
        narrative: "Cổ phiếu đi ngang tích luỹ với biên độ hẹp, dòng tiền tổ chức mua rải đinh kiên trì.",
        expectedPriceChange: 1.2,
        chatSnippets: [
          { sender: "GrowthInvestor", message: "Doanh nghiệp xuất sắc, EPS tăng trưởng đều đặn 20% mỗi năm suốt thập kỷ." },
          { sender: "ImpatientTrader", message: "Cổ phiếu đi ngang chán quá, bán sang penny lướt sóng cho nhanh." },
        ],
      },
      2: {
        roundName: "Tin Đột Phá — Hợp Đồng AI Toàn Cầu",
        stage: "Catalyst Announcement",
        headline: "Ký kết thỏa thuận hợp tác chiến lược với tập đoàn bán dẫn hàng đầu xây dựng AI Factory.",
        category: "HỢP TÁC CHIẾN LƯỢC",
        impact: "Đột phá giá trị tương lai",
        narrative: "Thị trường bắt đầu định giá lại doanh nghiệp từ dịch vụ gia công sang cung cấp giải pháp AI toàn cầu.",
        expectedPriceChange: 4.8,
        chatSnippets: [
          { sender: "TechAnalyst", message: "P/E của FPT xứng đáng được tái định giá từ 18x lên 25x nhờ câu chuyện AI." },
          { sender: "InstitutionalFund", message: "Quỹ ngoại nâng mục tiêu nắm giữ thêm 15 triệu cổ phiếu." },
        ],
      },
      3: {
        roundName: "Cú Rũ Cung Shakeout Khốc Liệt",
        stage: "Institutional Shakeout",
        headline: "Thị trường chung điều chỉnh sâu 30 điểm, cổ phiếu bị đạp mạnh thủng đường hỗ trợ MA20.",
        category: "RŨ BỎ ĐU BÁM",
        impact: "Thử thách lòng kiên nhẫn",
        narrative: "Đội lái tổ chức tận dụng nhịp giảm của chỉ số để ép nhỏ lẻ non gan bán non trước thềm con sóng lớn.",
        expectedPriceChange: -4.5,
        chatSnippets: [
          { sender: "ScaredRetail", message: "Thủng MA20 rồi! Cổ phiếu tốt cũng phải bán cắt lỗ thôi!" },
          { sender: "AuraMentor", message: "Khối lượng bán chủ yếu từ nhỏ lẻ hoảng loạn, cơ bản doanh nghiệp không đổi. Đây là điểm mua tích luỹ.", role: "Cố Vấn Aura" },
        ],
      },
      4: {
        roundName: "Hấp Thụ Nguồn Cung Trôi Nổi",
        stage: "Absorption Stage",
        headline: "Khối ngoại gom ròng kỷ lục 350 tỷ đồng ngay trong phiên điều chỉnh giá đỏ.",
        category: "DÒNG TIỀN NGOẠI",
        impact: "Lực cầu tổ chức vững như bàn thạch",
        narrative: "Toàn bộ lượng hàng rũ bỏ được tay to gom sạch, giá nhanh chóng lấy lại mốc cân bằng.",
        expectedPriceChange: 3.2,
        chatSnippets: [
          { sender: "TraderF0", message: "Vừa bán cắt lỗ sáng nay xong thì chiều nó kéo xanh ngược, tức thật!" },
          { sender: "PatientHold", message: "Đầu tư vào doanh nghiệp giá trị thật thì không sợ rung lắc ngắn hạn." },
        ],
      },
      5: {
        roundName: "Bứt Phá Vượt Đỉnh Lịch Sử (ATH Breakout)",
        stage: "All-Time High Breakout",
        headline: "Vượt đỉnh lịch sử mọi thời đại kèm thanh khoản bùng nổ gấp 3 lần trung bình 20 phiên.",
        category: "VƯỢT ĐỈNH LỊCH SỬ",
        impact: "Bước vào bầu trời giá mới",
        narrative: "Không còn đỉnh kháng cự phía trước, cổ phiếu trở thành tâm điểm dẫn dắt toàn bộ chỉ số VN-Index.",
        expectedPriceChange: 6.5,
        chatSnippets: [
          { sender: "TechnicalMaster", message: "Mẫu hình VCP thu hẹp độ biến động hoàn hảo, điểm mua Pivot chuẩn sách giáo khoa!" },
          { sender: "ProudInvestor", message: "Kiên nhẫn giữ hàng qua cú shakeout vòng 3 giờ đã hái quả ngọt +20%!" },
        ],
      },
      6: {
        roundName: "Kiểm Định Lại Đỉnh Cũ (Pullback Test)",
        stage: "Healthy Retest",
        headline: "Áp lực chốt lời ngắn hạn xuất hiện, giá quay về kiểm định lại vùng đỉnh vừa vượt qua.",
        category: "KIỂM ĐỊNH LÀNH MẠNH",
        impact: "Củng cố nền giá mới",
        narrative: "Kiểm tra cung cầu kinh điển: Khối lượng cạn kiệt ở nhịp pullback chứng minh bên bán không còn muốn bán rẻ.",
        expectedPriceChange: -1.5,
        chatSnippets: [
          { sender: "ProTrader", message: "Pullback vol bé tí tẹo, đây là cơ hội gia tăng tỷ trọng cuối cùng trước nhịp tăng tốc." },
        ],
      },
      7: {
        roundName: "Mở Rộng Xu Hướng Tăng Bền Vững",
        stage: "Trend Expansion",
        headline: "Doanh nghiệp ký hợp đồng triển khai AI trị giá 100 triệu USD, xác nhận chu kỳ tăng trưởng mới.",
        category: "KỶ NGUYÊN MỚI",
        impact: "Tăng trưởng giá trị dài hạn",
        narrative: "Chứng minh triết lý Aura Capital: Lợi nhuận lớn nhất thuộc về những ai kiên định đầu tư vào giá trị thực.",
        expectedPriceChange: 4.0,
        chatSnippets: [
          { sender: "AuraMentor", message: "Chúc mừng các nhà đầu tư kiên định! Kỷ luật và sự thấu hiểu doanh nghiệp luôn chiến thắng cảm xúc FOMO ngắn hạn.", role: "Cố Vấn Aura" },
          { sender: "HappyLearner", message: "Cảm ơn Aura Capital đã rèn luyện cho em tư duy đầu tư thực chiến!" },
        ],
      },
    },
  },
};

/**
 * Map 2: Pro Room Macro Regimes
 */
export interface ProMacroRegimeDefinition {
  key: string;
  name: string;
  tagline: string;
  badge: string;
  badgeColor: string;
  description: string;
  baselineRate: number;
  baselineInflation: number;
  baselineGdp: number;
  quarters: Array<{
    quarter: number;
    stage: string;
    stageKey: "BOOM" | "STAGFLATION" | "RECESSION" | "RECOVERY";
    stageDescription: string;
    rate: number;
    inflation: number;
    gdp: number;
    usdVndRate: number;
    recommendedAsset: string;
    warningNote: string;
  }>;
}

export const PRO_MACRO_REGIMES: Record<string, ProMacroRegimeDefinition> = {
  cycle_standard: {
    key: "cycle_standard",
    name: "Chu Kỳ Kinh Tế Tiêu Chuẩn (2020 - 2026)",
    tagline: "Bùng Nổ Tiền Tệ → Đỉnh Lạm Phát → Suy Thoái → Chu Kỳ Mới",
    badge: "Chu Kỳ Chuẩn",
    badgeColor: "blue",
    description: "Kịch bản kinh tế vĩ mô 12 quý điển hình của thị trường mới nổi: Trải qua đủ 4 pha của chu kỳ kinh doanh.",
    baselineRate: 5.0,
    baselineInflation: 2.5,
    baselineGdp: 7.5,
    quarters: [
      { quarter: 1, stage: "BÙNG NỔ", stageKey: "BOOM", stageDescription: "Bơm tiền kích thích, tăng trưởng tín dụng mạnh", rate: 5.0, inflation: 2.5, gdp: 7.5, usdVndRate: 23200, recommendedAsset: "EQ_GROWTH", warningNote: "Giải ngân vốn chủ động, tối ưu lợi thế lãi suất thấp." },
      { quarter: 2, stage: "BÙNG NỔ", stageKey: "BOOM", stageDescription: "Thị trường hưng phấn, lợi nhuận doanh nghiệp tạo đỉnh", rate: 5.2, inflation: 3.0, gdp: 7.8, usdVndRate: 23400, recommendedAsset: "EQ_GROWTH", warningNote: "Duy trì tỷ trọng cổ phiếu cao, bắt đầu theo dõi lạm phát." },
      { quarter: 3, stage: "BÙNG NỔ", stageKey: "BOOM", stageDescription: "Cảnh báo quá nhiệt, giá nguyên vật liệu tăng cao", rate: 5.8, inflation: 4.2, gdp: 7.0, usdVndRate: 23650, recommendedAsset: "EQ_VALUE", warningNote: "Bắt đầu chốt lời một phần cổ phiếu tăng trưởng sang cổ phiếu phòng thủ." },
      { quarter: 4, stage: "ĐÌNH LẠM", stageKey: "STAGFLATION", stageDescription: "NHTW nâng lãi suất gấp để chặn lạm phát", rate: 8.5, inflation: 6.0, gdp: 4.5, usdVndRate: 24500, recommendedAsset: "BOND / CASH", warningNote: "Lãi suất tăng sốc ép định giá P/E thu hẹp. Tăng dự trữ tiền mặt." },
      { quarter: 5, stage: "ĐÌNH LẠM", stageKey: "STAGFLATION", stageDescription: "Áp lực thanh khoản hệ thống, tín dụng thắt chặt", rate: 8.8, inflation: 6.5, gdp: 4.0, usdVndRate: 24800, recommendedAsset: "CASH / BOND", warningNote: "Giữ tỷ trọng tiền mặt tối thiểu 30-40% để bảo toàn tài sản." },
      { quarter: 6, stage: "ĐÌNH LẠM", stageKey: "STAGFLATION", stageDescription: "Chi phí vốn đạt đỉnh, doanh nghiệp gồng nợ", rate: 9.0, inflation: 6.2, gdp: 3.8, usdVndRate: 25000, recommendedAsset: "EQ_VALUE", warningNote: "Tìm kiếm các doanh nghiệp không vay nợ, chia cổ tức tiền mặt đều đặn." },
      { quarter: 7, stage: "SUY THOÁI", stageKey: "RECESSION", stageDescription: "Tăng trưởng kinh tế chậm lại, thanh lý tài sản", rate: 7.5, inflation: 4.5, gdp: 3.2, usdVndRate: 24900, recommendedAsset: "BOND", warningNote: "Trái phiếu hưởng lợi khi lãi suất bắt đầu có xu hướng giảm." },
      { quarter: 8, stage: "SUY THOÁI", stageKey: "RECESSION", stageDescription: "Đáy tâm lý tiêu cực, định giá P/B toàn thị trường rẻ lịch sử", rate: 7.0, inflation: 3.8, gdp: 3.0, usdVndRate: 24700, recommendedAsset: "EQ_VALUE", warningNote: "Cơ hội gom tài sản giá trị chiết khấu sâu 50-70%." },
      { quarter: 9, stage: "SUY THOÁI", stageKey: "RECESSION", stageDescription: "Chính sách tiền tệ đảo chiều, cắt giảm lãi suất hỗ trợ", rate: 6.5, inflation: 3.2, gdp: 3.5, usdVndRate: 24500, recommendedAsset: "EQ_GROWTH", warningNote: "Bắt đầu nâng dần tỷ trọng cổ phiếu trước thềm phục hồi." },
      { quarter: 10, stage: "HỒI PHỤC", stageKey: "RECOVERY", stageDescription: "Dòng tiền tái hấp thụ, sản xuất kinh doanh phục hồi", rate: 6.0, inflation: 3.0, gdp: 6.0, usdVndRate: 24300, recommendedAsset: "EQ_GROWTH", warningNote: "Chu kỳ mới bắt đầu, cổ phiếu công nghệ và tiêu dùng bứt phá." },
      { quarter: 11, stage: "HỒI PHỤC", stageKey: "RECOVERY", stageDescription: "Lợi nhuận toàn thị trường tăng trưởng 2 con số", rate: 5.8, inflation: 3.1, gdp: 6.5, usdVndRate: 24200, recommendedAsset: "EQ_GROWTH", warningNote: "Duy trì danh mục tấn công có kiểm soát." },
      { quarter: 12, stage: "HỒI PHỤC", stageKey: "RECOVERY", stageDescription: "Kinh tế bước vào pha tăng trưởng tự nhiên bền vững", rate: 5.5, inflation: 3.0, gdp: 7.0, usdVndRate: 24100, recommendedAsset: "DANH MỤC CÂN BẰNG", warningNote: "Hoàn tất 12 quý với Alpha bền vững và Drawdown tối thiểu." },
    ],
  },

  stagflation_shock: {
    key: "stagflation_shock",
    name: "Cú Sốc Lạm Phát & Lãi Suất Neo Đỉnh (Stagflation Shock)",
    tagline: "CPI Phi Mã 9% → Lãi Suất 11% → Thử Thách Phòng Thủ Khắc Nghiệt",
    badge: "Khủng Hoảng Lạm Phát",
    badgeColor: "rose",
    description: "Thách thức bản lĩnh phân bổ tài sản khi cả cổ phiếu tăng trưởng lẫn trái phiếu đều chịu áp lực định giá giảm sâu.",
    baselineRate: 8.0,
    baselineInflation: 8.5,
    baselineGdp: 2.8,
    quarters: [
      { quarter: 1, stage: "ĐÌNH LẠM", stageKey: "STAGFLATION", stageDescription: "Cú sốc giá dầu và chuỗi cung ứng, CPI tăng vọt lên 7.8%", rate: 7.5, inflation: 7.8, gdp: 3.5, usdVndRate: 24600, recommendedAsset: "CASH", warningNote: "Giữ tỷ trọng tiền mặt tối đa, tránh xa cổ phiếu P/E cao." },
      { quarter: 2, stage: "ĐÌNH LẠM", stageKey: "STAGFLATION", stageDescription: "Lãi suất điều hành tăng lên 9.5%, thị trường chứng khoán giảm 25%", rate: 9.5, inflation: 8.9, gdp: 2.6, usdVndRate: 25200, recommendedAsset: "CASH / EQ_VALUE", warningNote: "Chỉ chọn cổ phiếu doanh nghiệp độc quyền định giá, chuyển chi phí sang khách hàng." },
      { quarter: 3, stage: "ĐÌNH LẠM", stageKey: "STAGFLATION", stageDescription: "Lãi suất neo đỉnh 10.5%, lợi nhuận biên toàn ngành bị bào mòn", rate: 10.5, inflation: 9.2, gdp: 2.0, usdVndRate: 25600, recommendedAsset: "CASH", warningNote: "Bảo toàn vốn là mục tiêu số 1, tránh bẫy bắt đáy sớm." },
      { quarter: 4, stage: "ĐÌNH LẠM", stageKey: "STAGFLATION", stageDescription: "Doanh nghiệp yếu kém tuyên bố phá sản tái cơ cấu", rate: 11.0, inflation: 8.5, gdp: 1.8, usdVndRate: 25800, recommendedAsset: "EQ_VALUE", warningNote: "Gom cổ phiếu các tập đoàn nắm giữ vị thế thống trị ngành." },
      { quarter: 5, stage: "SUY THOÁI", stageKey: "RECESSION", stageDescription: "Lạm phát bắt đầu hạ nhiệt do sức cầu cạn kiệt", rate: 10.0, inflation: 6.5, gdp: 1.5, usdVndRate: 25500, recommendedAsset: "BOND", warningNote: "Mua trái phiếu lãi suất cao neo giữ lợi suất hấp dẫn dài hạn." },
      { quarter: 6, stage: "SUY THOÁI", stageKey: "RECESSION", stageDescription: "Kinh tế chạm đáy suy thoái, lãi suất giảm về 8.5%", rate: 8.5, inflation: 5.0, gdp: 2.2, usdVndRate: 25100, recommendedAsset: "EQ_VALUE / BOND", warningNote: "Tăng dần tỷ trọng tài sản rủi ro có định giá hấp dẫn." },
      { quarter: 7, stage: "HỒI PHỤC", stageKey: "RECOVERY", stageDescription: "Chính sách tiền tệ nới lỏng trở lại", rate: 7.0, inflation: 4.0, gdp: 4.0, usdVndRate: 24700, recommendedAsset: "EQ_GROWTH", warningNote: "Đón đầu sự bứt phá của các cổ phiếu công nghệ sống sót qua khủng hoảng." },
      { quarter: 8, stage: "HỒI PHỤC", stageKey: "RECOVERY", stageDescription: "Phục hồi ổn định, lợi nhuận cải thiện", rate: 6.5, inflation: 3.5, gdp: 5.2, usdVndRate: 24500, recommendedAsset: "EQ_GROWTH", warningNote: "Tối ưu hóa lợi nhuận danh mục." },
      { quarter: 9, stage: "BÙNG NỔ", stageKey: "BOOM", stageDescription: "Chu kỳ tăng trưởng mới hình thành", rate: 6.0, inflation: 3.2, gdp: 6.5, usdVndRate: 24300, recommendedAsset: "EQ_GROWTH", warningNote: "Duy trì kỷ luật tái cân bằng danh mục định kỳ." },
      { quarter: 10, stage: "BÙNG NỔ", stageKey: "BOOM", stageDescription: "Dòng vốn nước ngoài quay trở lại mạnh mẽ", rate: 5.8, inflation: 3.0, gdp: 7.0, usdVndRate: 24100, recommendedAsset: "CÂN BẰNG", warningNote: "Khóa lợi nhuận vào tài sản an toàn." },
      { quarter: 11, stage: "BÙNG NỔ", stageKey: "BOOM", stageDescription: "Tăng trưởng đạt đỉnh", rate: 5.5, inflation: 3.2, gdp: 7.2, usdVndRate: 24000, recommendedAsset: "CÂN BẰNG", warningNote: "Cảnh giác với tín hiệu lạm phát chu kỳ tiếp theo." },
      { quarter: 12, stage: "ĐÌNH LẠM", stageKey: "STAGFLATION", stageDescription: "Áp lực lạm phát chu kỳ mới bắt đầu nhen nhóm", rate: 6.2, inflation: 4.5, gdp: 6.0, usdVndRate: 24200, recommendedAsset: "CASH / VALUE", warningNote: "Hoàn tất thử thách với năng lực quản trị rủi ro vượt trội." },
    ],
  },
};
