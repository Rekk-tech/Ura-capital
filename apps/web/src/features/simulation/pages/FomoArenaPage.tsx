import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useMap1Game } from "../hooks/use-map-game";
import { SimulationDisclosureBanner } from "../components/SimulationDisclosureBanner";
import { FomoTimer } from "../components/map1/FomoTimer";
import { FomoNewsFeed } from "../components/map1/FomoNewsFeed";
import { FomoPriceChart } from "../components/map1/FomoPriceChart";
import { FomoOrderTicket } from "../components/map1/FomoOrderTicket";
import { FomoTrapQuizModal } from "../components/map1/FomoTrapQuizModal";
import { FomoTutorialModal } from "../components/map1/FomoTutorialModal";
import { FomoDebriefView } from "../components/map1/FomoDebriefView";
import { Flame, Play, HelpCircle, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
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
    <div className="fomo-arena-page min-h-screen bg-slate-50/70 p-4 md:p-6 lg:p-8 flex flex-col gap-5">
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

        <button
          type="button"
          onClick={() => setShowTutorial(true)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
        >
          <HelpCircle size={14} />
          <span>Hướng dẫn Round 0</span>
        </button>
      </div>

      {/* 5 Async UI States Handling */}

      {/* 1. Error State with Retry */}
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
          <p className="text-sm font-semibold text-slate-700">Đang khởi tạo đấu trường $FOMO Arena...</p>
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

      {/* 4. Empty State (No active game yet) */}
      {!isLoading && !debrief && !sessionId && (
        <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl bg-white border border-slate-200 shadow-md text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-lg">
            <Flame size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Đấu Trường Tâm Lý — FOMO Arena
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
              Trải nghiệm cảm xúc mua đỉnh bán đáy trong 7 Round biến động dữ dội. Học cách giữ vững kỷ luật, né bẫy Bull-trap và bảo toàn vốn sống sót.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={startNewGame}
              className="btn btn-primary py-3 px-6 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-md active:scale-95"
            >
              <Play size={16} />
              <span>Bắt Đầu Vòng 1 Ngay</span>
            </button>
            <button
              type="button"
              onClick={() => setShowTutorial(true)}
              className="btn btn-outline py-3 px-5 rounded-xl font-bold text-sm border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Xem Luật Chơi
            </button>
          </div>
        </div>
      )}

      {/* 5. Success State: Active In-Game Arena View */}
      {!isLoading && !debrief && state && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {/* Top Timer & Timeline */}
          <FomoTimer
            round={state.round}
            totalRounds={state.totalRounds}
            phase={state.phase}
            secondInRound={state.secondInRound}
            roundDurationSeconds={state.roundDurationSeconds}
            timeRemainingInPhase={state.timeRemainingInPhase}
          />

          {/* Main 2-Column Battleground */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column: Real-time Chart & Newsfeed (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <FomoPriceChart
                symbol="$FOMO"
                currentPrice={state.currentPrice}
                initialPrice={10000}
                priceChangePercent={state.priceChangePercent}
                pricePoints={state.pricePoints}
              />
              <FomoNewsFeed
                news={state.news}
                botChat={state.botChat}
                hint={state.roundConfig?.hint}
              />
            </div>

            {/* Right Column: Interactive Order Ticket (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <FomoOrderTicket
                phase={state.phase}
                cash={state.cash}
                shares={state.shares}
                marginUsed={state.marginUsed}
                nav={state.nav}
                currentPrice={state.currentPrice}
                canUseMargin={state.canUseMargin}
                freeStopLossAwarded={state.freeStopLossAwarded}
                isSubmitting={isSubmittingOrder}
                onSubmitOrder={submitOrder}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
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
