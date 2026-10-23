import React, { useState } from "react";
import { X, ShieldCheck, CheckCircle, AlertCircle, Lock, Award } from "lucide-react";
import { brokerApi } from "../../../api/broker.api";
import { BrokerRoomDto } from "@aura/shared";

interface RoomEnrollmentModalProps {
  isOpen: boolean;
  room: BrokerRoomDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const RoomEnrollmentModal: React.FC<RoomEnrollmentModalProps> = ({
  isOpen,
  room,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !room) return null;

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
  };

  const handleEnroll = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await brokerApi.enrollInRoom(room.id);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err?.message || "Thanh toán tham gia phòng thất bại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" data-testid="room-enrollment-modal">
      <div className="modal-content modal-md">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge bg-cyan-subtle">
              <Lock size={20} className="text-cyan" />
            </div>
            <div>
              <h2 className="modal-title">Tham Gia Phòng Đầu Tư Độc Quyền</h2>
              <p className="modal-subtitle">Thanh toán phí gia nhập 1 lần duy nhất</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        {isSuccess ? (
          <div className="modal-success-box text-center">
            <CheckCircle size={48} className="text-emerald" style={{ margin: "0 auto 1rem" }} />
            <h3>Ghi Danh Thành Công!</h3>
            <p className="text-muted">
              Bạn đã mở khóa toàn bộ quyền truy cập phòng <strong>{room.title}</strong>. Đang chuyển hướng vào phòng học...
            </p>
          </div>
        ) : (
          <div className="modal-enroll-body">
            {errorMessage && (
              <div className="alert-error-banner" role="alert">
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="enroll-summary-card">
              <span className="summary-badge">{room.investmentStyle}</span>
              <h3 className="summary-room-title">{room.title}</h3>
              <div className="summary-broker-info">
                <Award size={14} className="text-cyan" />
                <span>Chuyên gia: <strong>{room.brokerName}</strong> ({room.brokerFirm})</span>
              </div>
            </div>

            <div className="enroll-pricing-highlight">
              <div className="pricing-left">
                <span className="pricing-label">Phí tham gia 1 lần:</span>
                <span className="pricing-note">Sở hữu vĩnh viễn • Không trừ tiền định kỳ</span>
              </div>
              <div className="pricing-right">
                <span className="pricing-number">{formatVnd(room.entranceFeeVnd)}</span>
              </div>
            </div>

            <div className="aura-guarantee-strip">
              <ShieldCheck size={18} className="text-emerald" />
              <div>
                <strong>Bảo chứng độc lập bởi Aura Capital</strong>
                <p>Khoản phí được giữ trong cơ chế Escrow trung gian. Hoàn tiền 100% nếu phát hiện chuyên gia vi phạm chuẩn mực đạo đức hoặc phím hàng rác.</p>
              </div>
            </div>

            <div className="legal-disclaimer-box">
              <p>
                <strong>Tuyên bố pháp lý & Miễn trừ trách nhiệm:</strong> Mọi bài giảng, tài liệu định giá và bản tin nhận định trong phòng học được cung cấp nhằm mục đích đào tạo kiến thức và thảo luận học thuật; không cấu thành dịch vụ quản lý quỹ hay cam kết chia sẻ lợi nhuận theo pháp luật chứng khoán Việt Nam.
              </p>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isLoading}>
                Suy Nghĩ Thêm
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleEnroll}
                disabled={isLoading}
              >
                {isLoading ? "Đang Xử Lý..." : `Xác Nhận Tham Gia (${formatVnd(room.entranceFeeVnd)})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
