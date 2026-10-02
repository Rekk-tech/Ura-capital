import React, { useEffect, useState } from "react";
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
import { Play, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export const FomoArenaPage: React.FC = () => {
  const { accessToken } = useAuth();
  const {
    sessionId,
    state,
    debrief,
    isLoading,
    isSubmittingOrder,
    error,
    tutorialCompleted,
    startNewGame,
    submitOrder,
    submitTrap,
    submitQuiz,
    completeTutorial,
    resetGame,
  } = useMap1Game(accessToken);

  const [showTutorial, setShowTutorial] = useState(!tutorialCompleted);
  const [activeTrapQuizClosedForRound, setActiveTrapQuizClosedForRound] = useState<number | null>(null);
  const [liveTickPrice, setLiveTickPrice] = useState<number | null>(null);

  // Trigger tutorial on initial view if not completed
  useEffect(() => {
    if (!tutorialCompleted && !sessionId) {
      setShowTutorial(true);
    }
  }, [tutorialCompleted, sessionId]);

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

      {/* 1. Nút Quay lại: Đặt riêng ở hàng trên cùng góc trái */}
      <div className="flex items-center">
        <Link
          to="/simulation"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Về Sảnh Giả Lập</span>
        </Link>
      </div>

      {/* 2. Banner Cảnh Báo (Disclaimer Card): Chỉ hiện ở sảnh chờ, ẩn hoàn toàn khi vào game */}
      {(!sessionId || !state) && (
        <div className="w-full mb-6">
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

      {/* 4. Thẻ Đấu Trường FOMO Arena (Empty State before starting game) */}
      {!isLoading && !debrief && !sessionId && (
        <div className="w-full bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight whitespace-nowrap">
              Đấu Trường Tâm Lý — FOMO Arena
            </h2>
            <p className="text-slate-600 max-w-3xl leading-relaxed text-base mt-2">
              Trải nghiệm cảm xúc mua đỉnh bán đáy trong 7 Vòng sinh tử đầy biến động. Học cách giữ vững kỷ luật, né bẫy Bull-trap và bảo toàn vốn sống sót.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={startNewGame}
              className="fomo-start-game-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.75rem",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontSize: "0.95rem",
                fontWeight: 700,
                borderRadius: "0.875rem",
                border: "none",
                boxShadow: "0 4px 12px 0 rgba(37, 99, 235, 0.3)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                minHeight: "44px",
              }}
            >
              <Play size={16} fill="currentColor" />
              <span>Bắt Đầu Vòng 1 Ngay</span>
            </button>
            <button
              type="button"
              onClick={() => setShowTutorial(true)}
              className="fomo-view-rules-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                backgroundColor: "#ffffff",
                color: "#334155",
                fontSize: "0.95rem",
                fontWeight: 600,
                borderRadius: "0.875rem",
                border: "1.5px solid #cbd5e1",
                cursor: "pointer",
                whiteSpace: "nowrap",
                minHeight: "44px",
              }}
            >
              <span>Xem Luật Chơi</span>
            </button>
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
        onClose={() => setShowTutorial(false)}
        onStartGame={() => {
          completeTutorial();
          setShowTutorial(false);
          if (!sessionId) {
            startNewGame();
          }
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
