import React, { useState } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useMap1Game } from "../hooks/use-map-game";
import { SimulationDisclosureBanner } from "../components/SimulationDisclosureBanner";
import { FomoTimer } from "../components/map1/FomoTimer";
import { FomoNewsCard, FomoHypeRoom } from "../components/map1/FomoNewsFeed";
import { FomoPriceChart } from "../components/map1/FomoPriceChart";
import { FomoOrderTicket } from "../components/map1/FomoOrderTicket";
import { FomoTrapQuizModal } from "../components/map1/FomoTrapQuizModal";
import { FomoTutorialModal } from "../components/map1/FomoTutorialModal";
import { FomoDebriefView } from "../components/map1/FomoDebriefView";
import { Play, ArrowLeft, RefreshCw, AlertTriangle, Check, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { FOMO_SCENARIOS, FomoScenarioDefinition } from "../data/simulation-scenarios-store";

export const FomoArenaPage: React.FC = () => {
  const { accessToken } = useAuth();
  const {
    sessionId,
    state,
    debrief,
    isLoading,
    isSubmittingOrder,
    error,
    startNewGame,
    submitOrder,
    submitTrap,
    submitQuiz,
    completeTutorial,
    resetGame,
  } = useMap1Game(accessToken);

  const [showTutorial, setShowTutorial] = useState(false);
  const [activeTrapQuizClosedForRound, setActiveTrapQuizClosedForRound] = useState<number | null>(null);
  const [liveTickPrice, setLiveTickPrice] = useState<number | null>(null);
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<string>("vix_pump");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");

  const selectedScenario: FomoScenarioDefinition =
    FOMO_SCENARIOS[selectedScenarioKey] ??
    (Object.values(FOMO_SCENARIOS)[0] as FomoScenarioDefinition);
  const filteredScenarios = Object.values(FOMO_SCENARIOS).filter((scen) => {
    if (difficultyFilter === "ALL") return true;
    return scen.difficulty === difficultyFilter;
  });

  // Determine if trap/quiz modal should pop up
  const isTrapOrQuizPhase = state?.phase === "trap_or_quiz";
  const hasTrapOrQuiz = Boolean(state?.trap || state?.quiz);
  const isModalOpen =
    Boolean(isTrapOrQuizPhase && hasTrapOrQuiz && activeTrapQuizClosedForRound !== state?.round);

  return (
    <div className="fomo-arena-page min-h-screen bg-slate-50/80 p-3 sm:p-5 md:p-6 lg:p-7 flex flex-col gap-4 relative">
      {/* Visual Tension Red Vignette Flash on Crash Rounds 3 & 5 */}
      {state && (state.round === 3 || state.round === 5) && (
        <div className="fixed inset-0 pointer-events-none z-30 fomo-vignette-active" aria-hidden="true" />
      )}

      {/* 1. Top Navigation Bar: Breadcrumb & Room ID Pill */}
      <div className="fomo-top-nav-row">
        <Link
          to="/simulation"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Về Sảnh Giả Lập</span>
        </Link>
        <div className="fomo-room-pill">
          ROOM_ID: ARENA-VN30-SIM-07
        </div>
      </div>

      {/* 2. Banner Cảnh Báo (Academic Sandbox Disclaimer): Chỉ hiện ở sảnh chờ, ẩn khi vào game */}
      {(!sessionId || !state) && (
        <div className="w-full">
          <SimulationDisclosureBanner />
        </div>
      )}

      {/* 5 Async UI States Handling */}

      {/* 1. Error State with Retry */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span className="font-semibold">{error}</span>
          </div>
          <button
            type="button"
            onClick={startNewGame}
            className="btn btn-outline py-1.5 px-3 rounded-xl text-xs font-bold text-rose-800 hover:bg-rose-100 flex items-center gap-1"
          >
            <RefreshCw size={12} /> Thử lại
          </button>
        </div>
      )}

      {/* 2. Loading State */}
      {isLoading && (
        <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-800">Đang khởi tạo đấu trường $FOMO Arena...</p>
        </div>
      )}

      {/* 3. Debrief State (Outcome reached) */}
      {!isLoading && debrief && (
        <FomoDebriefView
          report={debrief}
          onReplay={() => {
            resetGame();
            startNewGame();
          }}
        />
      )}

      {/* 4. Thẻ Đấu Trường FOMO Arena (Empty State before starting game with Scenario Selector) */}
      {!isLoading && !debrief && !sessionId && (
        <div className="w-full flex flex-col gap-6">
          {/* Hero Section */}
          <div className="fomo-arena-hero-wrap">
            <div className="fomo-arena-badges-row">
              <span className="fomo-badge-thunder">
                ⚡ MÔ PHỎNG THỰC CHIẾN 7 VÒNG
              </span>
              <span className="fomo-badge-real-market">
                100% Thị Trường Thật
              </span>
            </div>
            <h2 className="fomo-arena-title" aria-label="Đấu Trường Tâm Lý — FOMO Arena">
              <span className="sr-only">Đấu Trường Tâm Lý — FOMO Arena</span>
              <span aria-hidden="true">Đấu Trường Tâm Lý — </span>
              <span aria-hidden="true" className="fomo-title-cyan">FOMO Arena</span>
            </h2>
            <p className="fomo-arena-desc">
              Trải nghiệm cảm xúc mua đỉnh bán đáy trong 7 Vòng sinh tử đầy biến động. Rèn luyện phản xạ cắt lỗ, giữ vững kỷ luật tâm lý trước bẫy Bull-trap và bảo toàn vốn sống sót.
            </p>
          </div>

          {/* 4 Stat Metric Cards */}
          <div className="fomo-metrics-quad">
            <div className="fomo-metric-box">
              <span className="fomo-metric-header">VỐN CẤP KHỞI ĐIỂM</span>
              <div className="fomo-metric-main">
                <span>10.000.000</span>
                <span className="fomo-metric-unit">VND</span>
              </div>
            </div>

            <div className="fomo-metric-box">
              <span className="fomo-metric-header">THỜI LƯỢNG MỖI VÒNG</span>
              <div className="fomo-metric-main">
                <span>7 Vòng × 45 Giây</span>
              </div>
            </div>

            <div className="fomo-metric-box">
              <span className="fomo-metric-header">CHỈ TIÊU VƯỢT ẢI</span>
              <div className="fomo-metric-main fomo-metric-green">
                <span>ROI ≥ +5.0%</span>
              </div>
            </div>

            <div className="fomo-metric-box">
              <span className="fomo-metric-header">TỶ LỆ SỐNG SÓT F0</span>
              <div className="fomo-metric-main fomo-metric-red">
                <span>34.2%</span>
                <span className="fomo-metric-unit">toàn hệ thống</span>
              </div>
            </div>
          </div>

          {/* Scenario Selector Header & Filters */}
          <div className="fomo-scenario-selector-head">
            <div>
              <h3 className="fomo-scenario-head-title">
                CHỌN KỊCH BẢN THỊ TRƯỜNG MÔ PHỎNG:
              </h3>
              <p className="fomo-scenario-head-sub">
                Mỗi kịch bản đại diện cho một mô hình bẫy giá kinh điển của thị trường tài chính
              </p>
            </div>

            <div className="fomo-filter-tabs">
              <button
                type="button"
                onClick={() => setDifficultyFilter("ALL")}
                className={`fomo-filter-tab-btn ${
                  difficultyFilter === "ALL"
                    ? "fomo-filter-tab-active"
                    : "fomo-filter-tab-inactive"
                }`}
              >
                Tất Cả (3)
              </button>
              <button
                type="button"
                onClick={() => setDifficultyFilter("Trung Bình")}
                className={`fomo-filter-tab-btn ${
                  difficultyFilter === "Trung Bình"
                    ? "fomo-filter-tab-active"
                    : "fomo-filter-tab-inactive"
                }`}
              >
                Độ Khó: Trung Bình
              </button>
              <button
                type="button"
                onClick={() => setDifficultyFilter("Khốc Liệt")}
                className={`fomo-filter-tab-btn ${
                  difficultyFilter === "Khốc Liệt"
                    ? "fomo-filter-tab-active"
                    : "fomo-filter-tab-inactive"
                }`}
              >
                Khốc Liệt
              </button>
              <button
                type="button"
                onClick={() => setDifficultyFilter("Nâng Cao")}
                className={`fomo-filter-tab-btn ${
                  difficultyFilter === "Nâng Cao"
                    ? "fomo-filter-tab-active"
                    : "fomo-filter-tab-inactive"
                }`}
              >
                Nâng Cao
              </button>
            </div>
          </div>

          {/* 3 Horizontal Scenario Cards */}
          <div className="fomo-scenario-cards-list">
            {filteredScenarios.map((scen) => {
              const isSelected = selectedScenarioKey === scen.key;
              const diffColorClass =
                scen.difficulty === "Khốc Liệt"
                  ? "fomo-diff-rose"
                  : scen.difficulty === "Nâng Cao"
                  ? "fomo-diff-purple"
                  : "fomo-diff-amber";

              const statColorClass =
                scen.chartMeta.statColor === "red"
                  ? "fomo-chart-stat-red"
                  : scen.chartMeta.statColor === "green"
                  ? "fomo-chart-stat-green"
                  : "fomo-chart-stat-orange";

              return (
                <div
                  key={scen.key}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedScenarioKey(scen.key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedScenarioKey(scen.key);
                    }
                  }}
                  className={`fomo-scenario-card ${isSelected ? "fomo-scenario-card-active" : ""}`}
                >
                  {isSelected && (
                    <div className="fomo-selected-corner-badge">
                      <Check size={12} strokeWidth={3} />
                      <span>KỊCH BẢN ĐANG CHỌN</span>
                    </div>
                  )}

                  {/* Left: Info Column */}
                  <div className="fomo-card-left-info">
                    <div>
                      <div className="fomo-card-meta-row mb-1.5">
                        <span className="fomo-card-code-pill">{scen.codeTag}</span>
                        <span className={`fomo-card-difficulty-tag ${diffColorClass}`}>
                          {scen.difficulty}
                        </span>
                        <span className="fomo-card-feature-subtitle">
                          {scen.featureSubtitle}
                        </span>
                      </div>
                      <h4 className="fomo-card-title">{scen.name}</h4>
                      <p className="fomo-card-description mt-1">{scen.description}</p>
                    </div>

                    <div className="fomo-card-pills-row">
                      {scen.metricPills.map((pill, idx) => (
                        <span
                          key={idx}
                          className={`fomo-card-pill ${
                            pill.isDanger
                              ? "fomo-card-pill-danger"
                              : pill.isSuccess
                              ? "fomo-card-pill-success"
                              : ""
                          }`}
                        >
                          {pill.label}: {pill.value}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Center: Sparkline Mini Box */}
                  <div className="fomo-card-center-chart">
                    <div className="fomo-chart-header">
                      <span className="fomo-chart-model-label">
                        {scen.chartMeta.modelName}
                      </span>
                      <span className={statColorClass}>
                        {scen.chartMeta.performanceStat}
                      </span>
                    </div>

                    <div className="fomo-sparkline-svg-wrap">
                      <svg
                        className="fomo-sparkline-svg"
                        viewBox="0 0 200 65"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient
                            id={scen.chartMeta.fillGradient.id}
                            x1="0%"
                            y1="0%"
                            x2="0%"
                            y2="100%"
                          >
                            <stop
                              offset="0%"
                              stopColor={scen.chartMeta.fillGradient.stopColor}
                              stopOpacity="0.25"
                            />
                            <stop
                              offset="100%"
                              stopColor={scen.chartMeta.fillGradient.stopColor}
                              stopOpacity="0.0"
                            />
                          </linearGradient>
                        </defs>
                        <path
                          d={scen.chartMeta.areaD}
                          fill={`url(#${scen.chartMeta.fillGradient.id})`}
                        />
                        <path
                          d={scen.chartMeta.pathD}
                          fill="none"
                          stroke={scen.chartMeta.strokeColor}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <circle
                          cx={scen.chartMeta.annotationPos.x}
                          cy={scen.chartMeta.annotationPos.y}
                          r="3.5"
                          fill="#ffffff"
                          stroke={scen.chartMeta.strokeColor}
                          strokeWidth="2"
                        />
                      </svg>
                    </div>

                    <div className="fomo-chart-annotation-label">
                      {scen.chartMeta.annotation}
                    </div>
                  </div>

                  {/* Right: Action Column */}
                  <div className="fomo-card-right-action">
                    <span className="fomo-action-status-label">
                      {isSelected ? "Tình trạng" : "Sẵn sàng"}
                    </span>
                    <span className="fomo-action-status-val">
                      {isSelected ? "✓ Đã Kích Hoạt" : "Chưa chọn"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedScenarioKey(scen.key);
                      }}
                      className={
                        isSelected
                          ? "fomo-select-btn-active"
                          : "fomo-select-btn-inactive"
                      }
                    >
                      {isSelected ? (
                        <>
                          <Check size={13} strokeWidth={2.5} />
                          <span>Đang chọn</span>
                        </>
                      ) : (
                        <span>Chọn kịch bản</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Docked Bottom Battleground Action Bar */}
          <div className="fomo-docked-action-bar">
            <div className="fomo-docked-left">
              <div className="fomo-docked-status-tag">
                SẴN SÀNG THAM CHIẾN • VÒNG 1/7
              </div>
              <div className="fomo-docked-title-row">
                <span>Kịch bản:</span>
                <span className="fomo-docked-scenario-name">
                  {selectedScenario.name}
                </span>
              </div>
              <div className="fomo-docked-meta-sub">
                <span>⏱️ Thời gian mỗi vòng: 45s</span>
                <span>•</span>
                <span>💰 Vốn ban đầu: 10.000.000 đ</span>
                <span>•</span>
                <span>🎯 Chỉ tiêu: ROI &gt; 5%</span>
              </div>
            </div>

            <div className="fomo-docked-right-actions">
              <button
                type="button"
                onClick={() => setShowTutorial(true)}
                className="fomo-docked-rules-btn"
              >
                <BookOpen size={16} />
                <span>Xem Luật Chơi &amp; Tâm Lý</span>
              </button>
              <button
                type="button"
                onClick={startNewGame}
                className="fomo-docked-start-btn"
              >
                <Play size={16} fill="currentColor" />
                <span>Bắt Đầu Vòng 1 Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Success State: Active In-Game Arena View matching Figma 65% / 35% Cockpit */}
      {!isLoading && !debrief && state && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {/* Top Cockpit Header & Strict KPI Math */}
          <FomoTimer
            round={state.round}
            totalRounds={state.totalRounds}
            roundName={state.roundConfig?.name || `Giai Đoạn ${state.round}`}
            phase={state.phase}
            secondInRound={state.secondInRound}
            roundDurationSeconds={state.roundDurationSeconds}
            timeRemainingInPhase={state.timeRemainingInPhase}
            cash={state.cash}
            shares={state.shares}
            currentPrice={state.currentPrice}
            nav={state.nav}
            initialCash={10000000}
          />

          {/* Main Rigid 2-Column Battleground Grid (1fr / 390px) matching Figma */}
          {(() => {
            const activeDisplayPrice =
              state.round === 1 && state.currentPrice < 20000
                ? 46350
                : state.currentPrice || 46350;
            return (
              <div className="fomo-cockpit-grid">
                {/* Left Column (1fr): Candlestick Chart + Community VIP Hype Room */}
                <div className="fomo-col-left flex flex-col gap-4 min-w-0">
                  <FomoPriceChart
                    symbol="$FOMO / VIN"
                    currentPrice={activeDisplayPrice}
                    initialPrice={45000}
                    priceChangePercent={state.priceChangePercent ?? 3.0}
                    pricePoints={state.pricePoints}
                    round={state.round}
                    onTickPriceChange={(newPrice) => setLiveTickPrice(newPrice)}
                  />

                  <FomoHypeRoom botChat={state.botChat} round={state.round} />
                </div>

                {/* Right Column (390px): Breaking News Card + Fast Execution Desk */}
                <div className="fomo-col-right flex flex-col gap-4 min-w-0">
                  <FomoNewsCard
                    news={state.news}
                    hint={state.roundConfig?.hint}
                    round={state.round}
                  />

                  <FomoOrderTicket
                    phase={state.phase}
                    round={state.round}
                    cash={state.cash}
                    shares={state.shares}
                    marginUsed={state.marginUsed}
                    nav={state.nav}
                    currentPrice={liveTickPrice || activeDisplayPrice}
                    canUseMargin={state.canUseMargin}
                    freeStopLossAwarded={state.freeStopLossAwarded}
                    isSubmitting={isSubmittingOrder}
                    onSubmitOrder={submitOrder}
                  />
                </div>
              </div>
            );
          })()}

          {/* Subtle bottom disclaimer badge inside active game */}
          <div className="fomo-subtle-disclaimer mt-1">
            🛡️ Sàn đấu thực chiến giả lập • 100% vốn ảo
          </div>
        </div>
      )}

      {/* Interactive Modals */}
      <FomoTutorialModal
        isOpen={showTutorial}
        mode="lobby"
        onClose={() => {
          setShowTutorial(false);
          completeTutorial();
        }}
        onProceedToScenario={() => {
          setShowTutorial(false);
          completeTutorial();
        }}
      />

      {state && (
        <FomoTrapQuizModal
          round={state.round}
          trap={state.trap}
          quiz={state.quiz}
          isOpen={isModalOpen}
          onClose={() => setActiveTrapQuizClosedForRound(state.round)}
          onSubmitTrap={submitTrap}
          onSubmitQuiz={submitQuiz}
        />
      )}
    </div>
  );
};
