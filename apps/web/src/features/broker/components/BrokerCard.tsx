import React from "react";
import { ShieldCheck, Award, Star, Briefcase, TrendingUp } from "lucide-react";
import { BrokerProfileDto } from "@aura/shared";

interface BrokerCardProps {
  broker: BrokerProfileDto;
  onViewRooms?: (brokerId: string) => void;
}

export const BrokerCard: React.FC<BrokerCardProps> = ({ broker, onViewRooms }) => {
  const getBadgeDetails = (badge: string) => {
    switch (badge) {
      case "INSTITUTIONAL_MENTOR":
        return { label: "Institutional Mentor", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" };
      case "SENIOR_PARTNER":
        return { label: "Senior Partner", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.15)" };
      default:
        return { label: "Certified Broker", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" };
    }
  };

  const badgeInfo = getBadgeDetails(broker.badge);
  const brokerDisplayName = (broker.fullName || "Chuyên Gia").replace(/^V+u\s+/i, "Vũ ");

  return (
    <div className="broker-passport-card" data-testid={`broker-card-${broker.id}`}>
      <div className="broker-passport-header">
        <div className="broker-avatar-wrap">
          {broker.avatarUrl ? (
            <img src={broker.avatarUrl} alt={brokerDisplayName} className="broker-avatar-img" />
          ) : (
            <div className="broker-avatar-fallback">{brokerDisplayName.slice(0, 2).toUpperCase()}</div>
          )}
          <span className="broker-verified-dot" title="Đã qua kiểm duyệt eKYC & CCHN UBCKNN">
            <ShieldCheck size={14} />
          </span>
        </div>

        <div className="broker-header-info">
          <div className="broker-name-row">
            <h3 className="broker-name">{brokerDisplayName}</h3>
            <span
              className="broker-badge"
              style={{ color: badgeInfo.color, backgroundColor: badgeInfo.bg }}
            >
              <Award size={12} style={{ marginRight: "4px" }} />
              {badgeInfo.label}
            </span>
          </div>
          <p className="broker-firm">
            <Briefcase size={13} style={{ marginRight: "4px", opacity: 0.8 }} />
            {broker.firmName}
          </p>
        </div>
      </div>

      <div className="broker-license-strip" title="Số Chứng Chỉ Hành Nghề chứng khoán do UBCKNN cấp">
        <ShieldCheck size={14} className="text-cyan" />
        <span className="license-label">Số CCHN UBCKNN:</span>
        <code className="license-code">{broker.licenseNumber}</code>
      </div>

      <p className="broker-bio-text">{broker.bio}</p>

      <div className="broker-meta-tags">
        <span className="broker-tag">
          <TrendingUp size={12} />
          {broker.investmentStyle}
        </span>
        <span className="broker-tag">
          {broker.experienceYears} năm kinh nghiệm
        </span>
      </div>

      <div className="broker-footer-row">
        <div className="broker-rating-box">
          <Star size={14} fill="#f59e0b" color="#f59e0b" />
          <span className="rating-score">{broker.verifiedRating.toFixed(1)}</span>
          <span className="rating-count">({broker.reviewCount} đánh giá thật)</span>
        </div>

        {onViewRooms && (
          <button
            type="button"
            className="btn btn-sm btn-outline-cyan"
            onClick={() => onViewRooms(broker.id)}
          >
            Xem Phòng Học
          </button>
        )}
      </div>
    </div>
  );
};
