import React from "react";
import { Flame, Hash } from "lucide-react";

interface TopicItem {
  tag: string;
  category: string;
  postCount: string;
  isHot?: boolean;
}

export const TrendingTopicsWidget: React.FC = () => {
  const topics: TopicItem[] = [
    { tag: "#TamLyDauTu", category: "Tâm lý hành vi", postCount: "3.2k bài viết", isHot: true },
    { tag: "#QuanTriVon", category: "Kỷ luật quản trị rủi ro", postCount: "2.8k bài viết", isHot: true },
    { tag: "#DauTruongFOMO", category: "Chiến thuật Map 1", postCount: "2.4k bài viết" },
    { tag: "#PhanTichViMo", category: "Bàn chiến lược Map 2", postCount: "1.9k bài viết" },
    { tag: "#BaoCaoQ3", category: "Phân tích doanh nghiệp", postCount: "1.5k bài viết" },
  ];

  return (
    <div className="trending-tickers-card" style={{ padding: "1rem 1.15rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "0.65rem",
          borderBottom: "1px solid #F1F5F9",
          marginBottom: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
          <Flame size={15} style={{ color: "#EF4444" }} />
          <h4 style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "0.03em" }}>
            CHỦ ĐỀ THẢO LUẬN SÔI NỔI
          </h4>
        </div>
        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#1D6FF2" }}>Tuần này</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
        {topics.map((t) => (
          <div
            key={t.tag}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.45rem 0.6rem",
              borderRadius: "8px",
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Hash size={12} style={{ color: "#64748B", flexShrink: 0 }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0F172A" }}>
                  {t.tag.replace("#", "")}
                </span>
                {t.isHot && (
                  <span
                    style={{
                      fontSize: "0.6rem",
                      fontWeight: 800,
                      padding: "1px 5px",
                      borderRadius: "4px",
                      background: "#FEE2E2",
                      color: "#DC2626",
                    }}
                  >
                    HOT
                  </span>
                )}
              </div>
              <span style={{ fontSize: "0.68rem", color: "#64748B" }}>{t.category}</span>
            </div>

            <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#475569", flexShrink: 0 }}>
              {t.postCount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
