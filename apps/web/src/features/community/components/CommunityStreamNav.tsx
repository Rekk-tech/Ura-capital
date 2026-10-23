import React from "react";
import {
  MessageSquare,
  Globe,
  FileText,
  ShieldCheck,
  GraduationCap,
  Building,
} from "lucide-react";

export type StreamCategoryId =
  | "ALL"
  | "MACRO"
  | "JOURNAL"
  | "PRO_ROOM"
  | "F0"
  | "INSTITUTIONAL";

interface StreamItem {
  id: StreamCategoryId;
  label: string;
  icon: React.ReactNode;
  count?: string;
  badge?: string;
}

interface CommunityStreamNavProps {
  activeStream: StreamCategoryId;
  onSelectStream: (id: StreamCategoryId) => void;
}

export const CommunityStreamNav: React.FC<CommunityStreamNavProps> = ({
  activeStream,
  onSelectStream,
}) => {
  const streams: StreamItem[] = [
    {
      id: "ALL",
      label: "Tất Cả Luồng",
      icon: <MessageSquare size={16} aria-hidden="true" />,
      count: "1.2k",
    },
    {
      id: "MACRO",
      label: "Phân Tích Vĩ Mô & Chu Kỳ",
      icon: <Globe size={16} aria-hidden="true" />,
      count: "342",
    },
    {
      id: "JOURNAL",
      label: "Nhật Ký Lệnh Giả Lập",
      icon: <FileText size={16} aria-hidden="true" />,
      count: "518",
    },
    {
      id: "PRO_ROOM",
      label: "Thảo Luận Pro Room",
      icon: <ShieldCheck size={16} aria-hidden="true" />,
      badge: "VIP",
    },
    {
      id: "F0",
      label: "Góc Học Viên F0",
      icon: <GraduationCap size={16} aria-hidden="true" />,
      count: "89",
    },
    {
      id: "INSTITUTIONAL",
      label: "Báo Cáo Định Chế",
      icon: <Building size={16} aria-hidden="true" />,
      count: "45",
    },
  ];

  return (
    <div className="community-stream-nav-card">
      <h3 className="stream-card-heading">
        LUỒNG THẢO LUẬN
      </h3>
      <nav className="stream-nav-list" aria-label="Luồng thảo luận cộng đồng">
        {streams.map((stream) => {
          const isActive = activeStream === stream.id;
          return (
            <button
              key={stream.id}
              type="button"
              onClick={() => onSelectStream(stream.id)}
              className={`stream-nav-item ${isActive ? "active" : ""}`}
            >
              <div className="stream-item-left">
                <span className="stream-item-icon">{stream.icon}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {stream.label}
                </span>
              </div>

              {stream.badge ? (
                <span className="stream-vip-badge">{stream.badge}</span>
              ) : stream.count ? (
                <span className="stream-count-pill">{stream.count}</span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
