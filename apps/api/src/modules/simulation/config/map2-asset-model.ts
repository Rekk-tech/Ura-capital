export interface AssetModelDef {
  key: string;
  name: string;
  category: string;
  description: string;
  alpha: number;
  betaRate: number;
  betaInflation: number;
  betaGdp: number;
  sigma: number;
}

export interface QuarterModelDef {
  quarter: number;
  stage: string;
  stageKey: "BOOM" | "STAGFLATION" | "RECESSION" | "RECOVERY";
  rate: number;
  inflation: number;
  gdp: number;
  description: string;
}

export interface QuizOptionDef {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface DisciplinaryQuizDef {
  quarter: number;
  id: string;
  prompt: string;
  options: QuizOptionDef[];
}

export interface Map2AssetModel {
  initialCash: number;
  totalQuarters: number;
  benchmarkAnnualReturn: number;
  targetMaxDrawdown: number;
  assets: {
    EQ_GROWTH: AssetModelDef;
    EQ_VALUE: AssetModelDef;
    BOND: AssetModelDef;
    CASH: AssetModelDef;
  };
  quarters: QuarterModelDef[];
  quizzes: DisciplinaryQuizDef[];
}

export const map2AssetModel: Map2AssetModel = {
  initialCash: 100000000,
  totalQuarters: 12,
  benchmarkAnnualReturn: 0.085,
  targetMaxDrawdown: 0.15,
  assets: {
    EQ_GROWTH: {
      key: "EQ_GROWTH",
      name: "Cổ phiếu Tăng trưởng",
      category: "Equity",
      description: "Nhóm công nghệ, bán lẻ có P/E cao, độ nhạy cao với lãi suất.",
      alpha: 0.02,
      betaRate: -2.0,
      betaInflation: -0.8,
      betaGdp: 1.5,
      sigma: 0.03
    },
    EQ_VALUE: {
      key: "EQ_VALUE",
      name: "Cổ phiếu Giá trị / Phòng thủ",
      category: "Equity",
      description: "Nhóm năng lượng, tiện ích, cổ tức 8-10%/năm, P/E thấp, ít nợ.",
      alpha: 0.015,
      betaRate: -0.5,
      betaInflation: 0.3,
      betaGdp: 0.6,
      sigma: 0.015
    },
    BOND: {
      key: "BOND",
      name: "Trái phiếu Doanh nghiệp / Chính phủ",
      category: "Fixed Income",
      description: "Kỳ hạn 1 năm, lợi tức cố định 7.5%/năm, rủi ro vỡ nợ thấp.",
      alpha: 0.01875,
      betaRate: -1.0,
      betaInflation: -0.2,
      betaGdp: 0.1,
      sigma: 0.005
    },
    CASH: {
      key: "CASH",
      name: "Tiền gửi / Tiết kiệm linh hoạt",
      category: "Cash",
      description: "Lợi tức 4.0%/năm, an toàn thanh khoản tuyệt đối.",
      alpha: 0.01,
      betaRate: 0.3,
      betaInflation: 0.0,
      betaGdp: 0.0,
      sigma: 0.0
    }
  },
  quarters: [
    {
      quarter: 1,
      stage: "BÙNG NỔ",
      stageKey: "BOOM",
      rate: 5.0,
      inflation: 2.5,
      gdp: 7.5,
      description: "Kinh tế tăng trưởng mạnh, thanh khoản dồi dào, EQ_GROWTH bứt phá."
    },
    {
      quarter: 2,
      stage: "BÙNG NỔ",
      stageKey: "BOOM",
      rate: 5.0,
      inflation: 2.5,
      gdp: 7.5,
      description: "Đà tăng tiếp tục, lợi nhuận doanh nghiệp mở rộng quy mô."
    },
    {
      quarter: 3,
      stage: "BÙNG NỔ",
      stageKey: "BOOM",
      rate: 5.0,
      inflation: 2.5,
      gdp: 7.5,
      description: "Đỉnh điểm chu kỳ bùng nổ, xuất hiện dấu hiệu áp lực lạm phát tiềm ẩn."
    },
    {
      quarter: 4,
      stage: "ĐÌNH LẠM & SIẾT TIỀN TỆ",
      stageKey: "STAGFLATION",
      rate: 8.5,
      inflation: 6.0,
      gdp: 4.0,
      description: "NHNN tăng lãi suất điều hành mạnh mẽ dập tắt lạm phát, chi phí vốn tăng vọt."
    },
    {
      quarter: 5,
      stage: "ĐÌNH LẠM & SIẾT TIỀN TỆ",
      stageKey: "STAGFLATION",
      rate: 8.5,
      inflation: 6.0,
      gdp: 4.0,
      description: "Biên lợi nhuận ngành công nghệ co hẹp, dòng tiền dịch chuyển sang phòng thủ."
    },
    {
      quarter: 6,
      stage: "ĐÌNH LẠM & SIẾT TIỀN TỆ",
      stageKey: "STAGFLATION",
      rate: 8.5,
      inflation: 6.0,
      gdp: 4.0,
      description: "Thanh khoản thị trường chạm đáy ngắn hạn, áp lực siết chặt tiền tệ duy trì."
    },
    {
      quarter: 7,
      stage: "SUY THOÁI & TẠO ĐÁY",
      stageKey: "RECESSION",
      rate: 7.0,
      inflation: 4.0,
      gdp: 3.0,
      description: "Tăng trưởng kinh tế chậm lại, NHNN bắt đầu hạ nhẹ lãi suất hỗ trợ doanh nghiệp."
    },
    {
      quarter: 8,
      stage: "SUY THOÁI & TẠO ĐÁY",
      stageKey: "RECESSION",
      rate: 7.0,
      inflation: 4.0,
      gdp: 3.0,
      description: "Nhiều cổ phiếu cơ bản tốt bị bán tháo dưới giá trị sổ sách (P/B < 1)."
    },
    {
      quarter: 9,
      stage: "SUY THOÁI & TẠO ĐÁY",
      stageKey: "RECESSION",
      rate: 7.0,
      inflation: 4.0,
      gdp: 3.0,
      description: "Tín hiệu tạo đáy thị trường xuất hiện, cơ hội tích lũy tài sản chiến lược."
    },
    {
      quarter: 10,
      stage: "HỒI PHỤC & TÁI THIẾT",
      stageKey: "RECOVERY",
      rate: 6.0,
      inflation: 3.0,
      gdp: 6.0,
      description: "Lãi suất hạ nhiệt về 6.0%, lạm phát được kiểm soát, tăng trưởng kinh tế bật tăng."
    },
    {
      quarter: 11,
      stage: "HỒI PHỤC & TÁI THIẾT",
      stageKey: "RECOVERY",
      rate: 6.0,
      inflation: 3.0,
      gdp: 6.0,
      description: "Kết quả kinh doanh doanh nghiệp khởi sắc, thị trường chứng khoán vào pha tăng mới."
    },
    {
      quarter: 12,
      stage: "HỒI PHỤC & TÁI THIẾT",
      stageKey: "RECOVERY",
      rate: 6.0,
      inflation: 3.0,
      gdp: 6.0,
      description: "Kết thúc chu kỳ 3 năm (12 quý), gặt hái thành quả danh mục đầu tư giá trị."
    }
  ],
  quizzes: [
    {
      quarter: 2,
      id: "quiz-q2",
      prompt: "Doanh nghiệp bạn nắm giữ báo lợi nhuận quý giảm 5% do mở rộng nhà máy. Hành động phù hợp?",
      options: [
        { id: "A", text: "Bán tháo ngay lập tức vì lợi nhuận suy giảm", isCorrect: false },
        { id: "B", text: "Xem xét đây là đầu tư dài hạn cho tăng trưởng tương lai, không vội bán nếu nền tảng tài chính vẫn tốt", isCorrect: true },
        { id: "C", text: "Vay thêm margin mua gấp đôi để kéo lại khoản lỗ", isCorrect: false }
      ]
    },
    {
      quarter: 4,
      id: "quiz-q4",
      prompt: "Lãi suất vừa tăng mạnh từ 5.0% lên 8.5%, EQ_GROWTH trong danh mục giảm 12% trong 1 quý. Bạn nên?",
      options: [
        { id: "A", text: "Bán sạch toàn bộ danh mục chuyển hết sang tiền mặt trong hoảng loạn", isCorrect: false },
        { id: "B", text: "Đánh giá lại tỷ trọng theo khả năng chịu rủi ro, không bán tháo hoảng loạn; cân nhắc tăng dần EQ_VALUE/BOND", isCorrect: true },
        { id: "C", text: "Đổ 100% tiền bắt đáy tất tay cổ phiếu tăng trưởng đang giảm sâu", isCorrect: false }
      ]
    },
    {
      quarter: 6,
      id: "quiz-q6",
      prompt: "Một cổ phiếu phòng thủ trong danh mục có P/E thấp bất thường so với toàn ngành. Điều đầu tiên cần kiểm tra?",
      options: [
        { id: "A", text: "Mua ngay lập tức vì P/E thấp luôn đồng nghĩa với siêu món hời", isCorrect: false },
        { id: "B", text: "Kiểm tra lý do P/E thấp: lợi nhuận đột biến một lần hay doanh nghiệp thực sự bị định giá thấp bền vững", isCorrect: true },
        { id: "C", text: "Bỏ qua hoàn toàn vì cổ phiếu phòng thủ không mang lại siêu lợi nhuận", isCorrect: false }
      ]
    },
    {
      quarter: 8,
      id: "quiz-q8",
      prompt: "Thị trường vào giai đoạn suy thoái, nhiều cổ phiếu cơ bản tốt có định giá P/B < 1. Chiến lược hợp lý?",
      options: [
        { id: "A", text: "Dồn 100% vốn gom tất tay trong 1 phiên duy nhất", isCorrect: false },
        { id: "B", text: "Giải ngân từng phần (DCA) vào tài sản tốt bị định giá thấp, duy trì dự trữ tiền mặt kỷ luật", isCorrect: true },
        { id: "C", text: "Đợi thị trường tăng vượt đỉnh trở lại mới dám bắt đầu mua vào", isCorrect: false }
      ]
    },
    {
      quarter: 10,
      id: "quiz-q10",
      prompt: "Danh mục vừa hồi phục mạnh mẽ sau giai đoạn suy thoái, ghi nhận lãi 18% trong 1 quý. Bạn nên?",
      options: [
        { id: "A", text: "Vay thêm margin tối đa vì thị trường chắc chắn sẽ chỉ có tăng", isCorrect: false },
        { id: "B", text: "Chốt lời một phần theo kế hoạch đã đặt trước, tái cân bằng danh mục để kiểm soát rủi ro", isCorrect: true },
        { id: "C", text: "Bán hết toàn bộ tài sản vì nghĩ thị trường sắp sập ngay lập tức", isCorrect: false }
      ]
    },
    {
      quarter: 12,
      id: "quiz-q12",
      prompt: "Kết thúc chu kỳ 12 quý, danh mục có Max Drawdown 14% (dưới ngưỡng mục tiêu 15%). Bài học rút ra?",
      options: [
        { id: "A", text: "Chỉ có dự đoán chính xác đỉnh và đáy thị trường mới mang lại thành công", isCorrect: false },
        { id: "B", text: "Kỷ luật phân bổ và kiên nhẫn qua các chu kỳ vĩ mô giúp kiểm soát rủi ro tốt hơn dự đoán thời điểm thị trường", isCorrect: true },
        { id: "C", text: "Đầu tư dài hạn không quan trọng bằng việc lướt sóng T+", isCorrect: false }
      ]
    }
  ]
};
