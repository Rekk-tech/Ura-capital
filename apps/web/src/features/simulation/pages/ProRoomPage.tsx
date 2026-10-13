import React, { useState, useEffect } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useMap2Game } from "../hooks/use-map-game";
import type { Map2Allocation } from "../types/map-game.types";
import { SimulationDisclosureBanner } from "../components/SimulationDisclosureBanner";
import { ProMacroTopRibbon } from "../components/map2/ProMacroTopRibbon";
import { ProBenchmarkChart } from "../components/map2/ProBenchmarkChart";
import { ProMacroClimatePanel } from "../components/map2/ProMacroClimatePanel";
import { ProAllocationCockpit } from "../components/map2/ProAllocationCockpit";
import { ProOrderDeskTable } from "../components/map2/ProOrderDeskTable";
import { ProRoomAiAdvisor } from "../components/map2/ProRoomAiAdvisor";
import { MacroExplanationModal } from "../components/map2/MacroExplanationModal";
import { ProQuizDialog } from "../components/map2/ProQuizDialog";
import { ProRoomReportView } from "../components/map2/ProRoomReportView";
import { BrainCircuit, Play, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { PRO_MACRO_REGIMES } from "../data/simulation-scenarios-store";

export const ProRoomPage: React.FC = () => {
  const { accessToken } = useAuth();
  const {
    sessionId,
    session,
    lastQuarterRecord,
    report,
    isLoading,
    isCommitting,
    error,
    startNewGame,
    submitQuiz,
    commitQuarter,
    resetGame,
  } = useMap2Game(accessToken);

  const [showMacroExplainer, setShowMacroExplainer] = useState(false);
  const [activeQuizClosedForQuarter, setActiveQuizClosedForQuarter] = useState<number | null>(null);
  const [selectedRegimeKey, setSelectedRegimeKey] = useState<string>("cycle_standard");

  // Draft allocation state synchronized with session allocation
  const [draftAllocation, setDraftAllocation] = useState<Map2Allocation>({
    growth: 35,
    value: 25,
    bond: 20,
    cash: 20,
  });

  useEffect(() => {
    if (session?.currentAllocation) {
      setDraftAllocation(session.currentAllocation);
    }
  }, [session?.currentAllocation, session?.currentQuarter]);

  // Macro regime quarters definition
  const selectedRegime = PRO_MACRO_REGIMES[selectedRegimeKey] || PRO_MACRO_REGIMES["cycle_standard"]!;
  const quartersConfig = selectedRegime.quarters;

  const currentQ = session?.currentQuarter ?? 1;
  const currentQConfig = quartersConfig[Math.min(11, currentQ - 1)] ?? quartersConfig[0]!;

  // Disciplinary quizzes for even quarters
  const quizzesMap: Record<number, { id: string; prompt: string; options: Array<{ id: string; text: string }> }> = {
    2: {
      id: "quiz-q2",
      prompt: "Doanh nghiệp bạn nắm giữ báo lợi nhuận quý giảm 5% do mở rộng nhà máy. Hành động phù hợp?",
      options: [
        { id: "A", text: "Bán tháo ngay lập tức vì lợi nhuận suy giảm" },
        { id: "B", text: "Xem xét đây là đầu tư dài hạn cho tăng trưởng tương lai, không vội bán nếu nền tảng tài chính vẫn tốt" },
        { id: "C", text: "Vay thêm margin mua gấp đôi để kéo lại khoản lỗ" },
      ],
    },
    4: {
      id: "quiz-q4",
      prompt: "Lãi suất vừa tăng mạnh từ 5.0% lên 8.5%, EQ_GROWTH trong danh mục giảm 12% trong 1 quý. Bạn nên?",
      options: [
        { id: "A", text: "Bán sạch toàn bộ danh mục chuyển hết sang tiền mặt trong hoảng loạn" },
        { id: "B", text: "Đánh giá lại tỷ trọng theo khả năng chịu rủi ro, không bán tháo hoảng loạn; cân nhắc tăng dần EQ_VALUE/BOND" },
        { id: "C", text: "Đổ 100% tiền bắt đáy tất tay cổ phiếu tăng trưởng đang giảm sâu" },
      ],
    },
    6: {
      id: "quiz-q6",
      prompt: "Một cổ phiếu phòng thủ trong danh mục có P/E thấp bất thường so với toàn ngành. Điều đầu tiên cần kiểm tra?",
      options: [
        { id: "A", text: "Mua ngay lập tức vì P/E thấp luôn đồng nghĩa với siêu món hời" },
        { id: "B", text: "Kiểm tra lý do P/E thấp: lợi nhuận đột biến một lần hay doanh nghiệp thực sự bị định giá thấp bền vững" },
        { id: "C", text: "Bỏ qua hoàn toàn vì cổ phiếu phòng thủ không mang lại siêu lợi nhuận" },
      ],
    },
    8: {
      id: "quiz-q8",
      prompt: "Thị trường vào giai đoạn suy thoái, nhiều cổ phiếu cơ bản tốt có định giá P/B < 1. Chiến lược hợp lý?",
      options: [
        { id: "A", text: "Dồn 100% vốn gom tất tay trong 1 phiên duy nhất" },
        { id: "B", text: "Giải ngân từng phần (DCA) vào tài sản tốt bị định giá thấp, duy trì dự trữ tiền mặt kỷ luật" },
        { id: "C", text: "Đợi thị trường tăng vượt đỉnh trở lại mới dám bắt đầu mua vào" },
      ],
    },
    10: {
      id: "quiz-q10",
      prompt: "Danh mục vừa hồi phục mạnh mẽ sau giai đoạn suy thoái, ghi nhận lãi 18% trong 1 quý. Bạn nên?",
      options: [
        { id: "A", text: "Vay thêm margin tối đa vì thị trường chắc chắn sẽ chỉ có tăng" },
        { id: "B", text: "Chốt lời một phần theo kế hoạch đã đặt trước, tái cân bằng danh mục để kiểm soát rủi ro" },
        { id: "C", text: "Bán hết toàn bộ tài sản vì nghĩ thị trường sắp sập ngay lập tức" },
      ],
    },
    12: {
      id: "quiz-q12",
      prompt: "Kết thúc chu kỳ 12 quý, danh mục có Max Drawdown 14% (dưới ngưỡng mục tiêu 15%). Bài học rút ra?",
      options: [
        { id: "A", text: "Chỉ có dự đoán chính xác đỉnh và đáy thị trường mới mang lại thành công" },
        { id: "B", text: "Kỷ luật phân bổ và kiên nhẫn qua các chu kỳ vĩ mô giúp kiểm soát rủi ro tốt hơn dự đoán thời điểm thị trường" },
        { id: "C", text: "Đầu tư dài hạn không quan trọng bằng việc lướt sóng T+" },
      ],
    },
  };

  const currentQuiz = quizzesMap[currentQ] ?? null;
  const showQuiz = Boolean(currentQuiz && activeQuizClosedForQuarter !== currentQ);

  return (
    <div className="pro-room-page min-h-screen bg-slate-50/70 p-4 md:p-6 lg:p-8 flex flex-col gap-5">
      {/* Mandatory Virtual Funds Disclosure Banner */}
      <SimulationDisclosureBanner />

      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/simulation"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Về Sảnh Giả Lập</span>
        </Link>
      </div>

      {/* 5 Async UI States */}

      {/* 1. Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={startNewGame}
            className="btn btn-outline py-1 px-3 rounded-lg text-xs font-bold text-rose-800 hover:bg-rose-100 flex items-center gap-1"
          >
            <RefreshCw size={12} /> Thử lại
          </button>
        </div>
      )}

      {/* 2. Loading State */}
      {isLoading && (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-700">Đang khởi tạo phòng quản trị Pro Room...</p>
        </div>
      )}

      {/* 3. Report State (Completed 12 Quarters) */}
      {!isLoading && report && (
        <ProRoomReportView
          report={report}
          onReplay={() => {
            resetGame();
            startNewGame();
          }}
        />
      )}

      {/* 4. Empty State (No session active) */}
      {!isLoading && !report && !sessionId && (
        <div className="max-w-3xl mx-auto my-8 p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-md text-center flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg">
            <BrainCircuit size={32} />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="badge badge-primary text-xs font-bold uppercase tracking-wider">Đầu Tư Định Chế 12 Quý</span>
              <span className="text-xs text-slate-500">• Benjamin Graham &amp; Warren Buffett AI</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Phòng Quản Trị Danh Mục — Pro Room
            </h2>
            <p className="text-xs text-slate-500 max-w-lg mx-auto mt-2 leading-relaxed">
              Quản trị số vốn định chế <strong>100.000.000 VND</strong> qua 12 quý kinh tế (Bùng nổ, Đình lạm, Suy thoái, Hồi phục). Nhận cố vấn trực tiếp từ AI Advisor theo triết lý Benjamin Graham &amp; Warren Buffett.
            </p>
          </div>

          {/* Macro Regime Selection */}
          <div className="w-full flex flex-col gap-2.5 text-left">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Chọn Kịch Bản Vĩ Mô 12 Quý:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.values(PRO_MACRO_REGIMES).map((regime) => {
                const isSelected = selectedRegimeKey === regime.key;
                return (
                  <div
                    key={regime.key}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedRegimeKey(regime.key)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedRegimeKey(regime.key);
                      }
                    }}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between gap-3 ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-xs text-slate-900">{regime.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          {regime.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                        {regime.description}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Lãi suất gốc: {regime.baselineRate}%</span>
                      <span className={`font-semibold ${isSelected ? "text-blue-600 font-bold" : "text-slate-400"}`}>
                        {isSelected ? "✓ Đang chọn" : "Chọn kịch bản"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={startNewGame}
            className="btn btn-primary py-3 px-6 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-md active:scale-95 mt-1"
          >
            <Play size={16} />
            <span>Khai Mạc Chu Kỳ 12 Quý</span>
          </button>
        </div>
      )}

      {/* 5. Success State: Active Pro Room Cockpit (Figma Layout) */}
      {!isLoading && !report && session && (
        <div className="flex flex-col gap-5 animate-in fade-in duration-200">
          {/* Top Macro Ribbon (Hero Quarter, Progression & 4 KPIs) */}
          <ProMacroTopRibbon
            currentQuarter={session.currentQuarter}
            totalQuarters={12}
            stageName={currentQConfig.stage}
            stageKey={currentQConfig.stageKey}
            stageDescription={currentQConfig.stageDescription}
            currentNav={session.currentNav}
            initialCash={session.initialCash}
            unallocatedCash={Math.round((session.currentNav * draftAllocation.cash) / 100)}
            unallocatedPercent={draftAllocation.cash}
            alpha={
              session.currentQuarter === 1
                ? 1.85
                : session.currentQuarter <= 3
                ? 1.85
                : session.currentQuarter <= 6
                ? -0.85
                : session.currentQuarter <= 9
                ? 2.10
                : 3.45
            }
            maxDrawdown={session.maxDrawdown}
            pnlQoQPercent={lastQuarterRecord?.pnlQuarterPercent ?? 0}
          />

          {/* 2-Column Grid matching Figma Layout */}
          <div className="pro-room-grid-cockpit">
            {/* Left Column: VN-Index Benchmark & Macro Climate (7 Cols / 1.45fr) */}
            <div className="pro-room-main-col">
              <ProBenchmarkChart
                currentQuarter={session.currentQuarter}
                stageKey={currentQConfig.stageKey}
              />
              <ProMacroClimatePanel
                currentQuarter={session.currentQuarter}
                stageKey={currentQConfig.stageKey}
                interestRate={currentQConfig.rate}
                inflation={currentQConfig.inflation}
                gdpGrowth={currentQConfig.gdp}
                onOpenMacroExplainer={() => setShowMacroExplainer(true)}
              />
            </div>

            {/* Right Column: AI Advisor & Allocation Cockpit (5 Cols / 1fr) */}
            <div className="pro-room-sidebar-col">
              <ProRoomAiAdvisor
                lastRecord={lastQuarterRecord}
                currentQuarter={session.currentQuarter}
                stageKey={currentQConfig.stageKey}
              />
              <ProAllocationCockpit
                currentQuarter={session.currentQuarter}
                stageKey={currentQConfig.stageKey}
                allocation={draftAllocation}
                currentNav={session.currentNav}
                isCommitting={isCommitting}
                onAllocationChange={setDraftAllocation}
                onCommit={async () => {
                  await commitQuarter(draftAllocation);
                }}
              />
            </div>
          </div>

          {/* Bottom Full-Width Table: Order Desk */}
          <ProOrderDeskTable
            currentQuarter={session.currentQuarter}
            stageKey={currentQConfig.stageKey}
            allocation={draftAllocation}
            currentNav={session.currentNav}
          />
        </div>
      )}

      {/* Macro Explainer Modal */}
      <MacroExplanationModal
        isOpen={showMacroExplainer}
        onClose={() => setShowMacroExplainer(false)}
      />

      {/* Disciplinary Quiz Dialog for Even Quarters */}
      {currentQuiz && (
        <ProQuizDialog
          quarter={currentQ}
          quizId={currentQuiz.id}
          prompt={currentQuiz.prompt}
          options={currentQuiz.options}
          isOpen={showQuiz}
          onClose={() => setActiveQuizClosedForQuarter(currentQ)}
          onSubmitQuiz={async (q, qId, optId) => {
            return await submitQuiz(q, qId, optId);
          }}
        />
      )}
    </div>
  );
};

export const FomoProRoomView = ProRoomPage;
export default ProRoomPage;
