import React from "react";
import type { Map1DebriefReport } from "../../types/map-game.types";
import { Award, AlertOctagon, CheckCircle2, TrendingUp, TrendingDown, ArrowRight, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FomoDebriefViewProps {
  report: Map1DebriefReport;
  onReplay: () => void;
}

export const FomoDebriefView: React.FC<FomoDebriefViewProps> = ({
  report,
  onReplay,
}) => {
  const navigate = useNavigate();
  const isSurvived = report.isSurvived || report.status === "completed_survived";

  return (
    <div className="fomo-debrief-view max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Hero Outcome Banner */}
      <div
        className={`p-6 rounded-2xl border shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 ${
          isSurvived
            ? "bg-gradient-to-r from-emerald-900 to-slate-900 text-white border-emerald-500/30"
            : "bg-gradient-to-r from-rose-950 to-slate-900 text-white border-rose-500/30"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`p-4 rounded-2xl flex-shrink-0 shadow-inner ${
              isSurvived ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
            }`}
          >
            {isSurvived ? <Award size={36} /> : <AlertOctagon size={36} />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  isSurvived ? "bg-emerald-500 text-slate-950" : "bg-rose-500 text-white"
                }`}
              >
                {isSurvived ? "SỐNG SÓT QUA BÃO FOMO" : "CHÁY TÀI KHOẢN (STOP-OUT)"}
              </span>
              {isSurvived && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-300 border border-blue-400/30">
                  ĐÃ MỞ KHÓA MAP 2
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              {isSurvived
                ? "Chúc mừng! Bạn đã kiên cường vượt qua 7 vòng giông bão."
                : "Tài khoản của bạn đã chạm ngưỡng cắt lỗ bắt buộc."}
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              {report.statusReason || "Kết thúc phiên giả lập tâm lý đầu tư Map 1."}
            </p>
          </div>
        </div>

        <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-white/10">
          <span className="text-xs text-slate-400">Tài sản ròng cuối cùng</span>
          <div className="text-2xl font-black font-mono">
            {report.finalNav.toLocaleString("vi-VN")} đ
          </div>
          <div
            className={`text-xs font-bold flex items-center gap-1 ${
              report.pnlPercent >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {report.pnlPercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{report.pnlPercent >= 0 ? `+${report.pnlPercent}%` : `${report.pnlPercent}%`}</span>
            <span className="text-slate-400 font-normal">({report.pnlAmount.toLocaleString("vi-VN")} đ)</span>
          </div>
        </div>
      </div>

      {/* Behavioral Metric Meters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* FOMO Score Card */}
        <div className="card-aura p-5 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                CHỈ SỐ TÂM LÝ
              </span>
              <h4 className="text-base font-bold text-slate-900">Điểm Số FOMO</h4>
            </div>
            <span className="text-2xl font-black font-mono text-amber-500">
              {report.fomoScore}/100
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                report.fomoScore > 60 ? "bg-rose-500" : report.fomoScore > 30 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, report.fomoScore))}%` }}
            />
          </div>

          <div className="text-xs text-slate-600">
            Đánh giá: <strong>{report.fomoClassification}</strong>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Đo lường tần suất mua đuổi khi tăng nóng, dồn lệnh 100% tiền và vào lệnh ở những giây chót.
            </p>
          </div>
        </div>

        {/* Discipline Score Card */}
        <div className="card-aura p-5 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                CHỈ SỐ BẢO VỆ VỐN
              </span>
              <h4 className="text-base font-bold text-slate-900">Điểm Kỷ Luật</h4>
            </div>
            <span className="text-2xl font-black font-mono text-blue-600">
              {report.disciplineScore}/100
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                report.disciplineScore >= 80 ? "bg-emerald-500" : report.disciplineScore >= 50 ? "bg-blue-500" : "bg-rose-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, report.disciplineScore))}%` }}
            />
          </div>

          <div className="text-xs text-slate-600">
            Đánh giá: <strong>{report.disciplineClassification}</strong>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Khởi điểm 100đ, bị trừ khi thiếu lệnh stop-loss, dùng margin bắt dao rơi hoặc trả lời sai câu hỏi quản trị rủi ro.
            </p>
          </div>
        </div>
      </div>

      {/* Top 3 Real Mistakes Breakdown */}
      <div className="card-aura p-5 rounded-xl border border-slate-200 bg-white shadow-sm">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
          Top 3 Sai Lầm Tâm Lý Đã Gặp Phải
        </h4>
        <div className="flex flex-col gap-2.5">
          {report.topMistakes && report.topMistakes.length > 0 ? (
            report.topMistakes.map((mistake, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs"
              >
                <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="text-slate-700 leading-relaxed font-medium">
                  {mistake}
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              Tuyệt vời! Bạn không mắc phải sai lầm tâm lý đáng kể nào trong phiên này.
            </div>
          )}
        </div>
      </div>

      {/* Badges and Call-to-Actions */}
      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isSurvived ? (
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={24} />
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700">
              <AlertOctagon size={24} />
            </div>
          )}
          <div>
            <h5 className="text-sm font-bold text-slate-900">
              {isSurvived ? "Huy hiệu Đạt Được: Survivor of FOMO Storm" : "Kinh nghiệm thực chiến quý giá"}
            </h5>
            <p className="text-xs text-slate-500">
              {isSurvived
                ? "Bạn đã đủ điều kiện tốt nghiệp Map 1 và mở khóa phòng chiến lược Pro Room."
                : "Thất bại trong giả lập là bài học rẻ nhất để bạn không mất tiền thật trên thị trường."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={onReplay}
            className="btn btn-outline py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-200 flex-1 md:flex-initial"
          >
            <RotateCcw size={14} />
            <span>Chơi Lại Map 1</span>
          </button>

          {isSurvived && (
            <button
              type="button"
              onClick={() => navigate("/simulation/map-2")}
              className="btn btn-primary py-2.5 px-5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 shadow-md flex-1 md:flex-initial"
            >
              <span>Vào Map 2: Pro Room</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
