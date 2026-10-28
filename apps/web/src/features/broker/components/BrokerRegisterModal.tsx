import React, { useState } from "react";
import { X, ShieldCheck, AlertCircle, CheckCircle } from "lucide-react";
import { brokerApi } from "../../../api/broker.api";
import { VIETNAMESE_SECURITIES_FIRMS, RegisterBrokerPayload } from "@aura/shared";

interface BrokerRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BrokerRegisterModal: React.FC<BrokerRegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState("");
  const [idCardNumber, setIdCardNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [firmName, setFirmName] = useState<string>(VIETNAMESE_SECURITIES_FIRMS[0]);
  const [experienceYears, setExperienceYears] = useState("3");
  const [investmentStyle, setInvestmentStyle] = useState("Tăng Trưởng (CANSLIM)");
  const [bio, setBio] = useState("");
  const [initialRoomTitle, setInitialRoomTitle] = useState("");
  const [initialRoomFeeVnd, setInitialRoomFeeVnd] = useState("500000");
  const [pledgeChecked, setPledgeChecked] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !licenseNumber.trim() || !firmName.trim()) {
      setErrorMessage("Vui lòng điền đầy đủ họ tên, số CCHN do UBCKNN cấp và chọn công ty chứng khoán.");
      return;
    }

    if (!pledgeChecked) {
      setErrorMessage("Bạn bắt buộc phải cam kết tuân thủ đạo đức nghề nghiệp và quy định của UBCKNN.");
      return;
    }

    setIsLoading(true);
    try {
      const payload: RegisterBrokerPayload = {
        fullName: fullName.trim().replace(/^V+u\s+/i, "Vũ "),
        idCardNumber: idCardNumber.trim(),
        licenseNumber: licenseNumber.trim(),
        firmName: firmName.trim(),
        experienceYears: parseInt(experienceYears, 10) || 1,
        investmentStyle: investmentStyle.trim(),
        bio: bio.trim(),
        initialRoomTitle: initialRoomTitle.trim() || undefined,
        initialRoomFeeVnd: parseInt(initialRoomFeeVnd, 10) || 500000,
      };

      await brokerApi.registerBroker(payload);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1800);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Đăng ký thất bại, vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" data-testid="broker-register-modal">
      <div className="modal-content modal-lg">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <ShieldCheck size={20} className="text-cyan" />
            </div>
            <div>
              <h2 className="modal-title">Đăng Ký Đối Tác Chuyên Gia (Broker Partner)</h2>
              <p className="modal-subtitle">Xác thực danh tính eKYC & Chứng chỉ hành nghề do UBCKNN cấp</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        {isSuccess ? (
          <div className="modal-success-box text-center">
            <CheckCircle size={48} className="text-emerald" style={{ margin: "0 auto 1rem" }} />
            <h3>Hồ Sơ Đã Được Tiếp Nhận!</h3>
            <p className="text-muted">
              Đội ngũ Tuân thủ & Thẩm định của Aura Capital sẽ đối chiếu số hiệu CCHN của bạn với cơ sở dữ liệu UBCKNN trong vòng 24h làm việc.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            {errorMessage && (
              <div className="alert-error-banner" role="alert">
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label" htmlFor="broker-fullname">
                  Họ và tên thật (theo CCCD) <span className="text-danger">*</span>
                </label>
                <input
                  id="broker-fullname"
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="broker-cccd">
                  Số CCCD / CMND (eKYC) <span className="text-danger">*</span>
                </label>
                <input
                  id="broker-cccd"
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: 07909988xxxx"
                  value={idCardNumber}
                  onChange={(e) => setIdCardNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label" htmlFor="broker-license">
                  Số hiệu CCHN do UBCKNN cấp <span className="text-danger">*</span>
                </label>
                <input
                  id="broker-license"
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: UBCKNN-CCHN-2022-8891"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  required
                />
                <span className="form-hint">Dùng để xác thực tính chính danh, chống giả mạo</span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="broker-firm">
                  Công ty Chứng khoán trực thuộc <span className="text-danger">*</span>
                </label>
                <select
                  id="broker-firm"
                  className="form-select"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                >
                  {VIETNAMESE_SECURITIES_FIRMS.map((firm) => (
                    <option key={firm} value={firm}>
                      {firm}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label" htmlFor="broker-exp">
                  Số năm kinh nghiệm chứng khoán
                </label>
                <input
                  id="broker-exp"
                  type="number"
                  min="1"
                  max="40"
                  className="form-input"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="broker-style">
                  Trường phái đầu tư chính
                </label>
                <select
                  id="broker-style"
                  className="form-select"
                  value={investmentStyle}
                  onChange={(e) => setInvestmentStyle(e.target.value)}
                >
                  <option value="Tăng Trưởng (CANSLIM)">Tăng Trưởng (CANSLIM / VCP)</option>
                  <option value="Phân Tích Kỹ Thuật (Price Action & VSA)">Phân Tích Kỹ Thuật (Price Action & VSA)</option>
                  <option value="Đầu Tư Giá Trị (Value & DCF)">Đầu Tư Giá Trị (Value & DCF)</option>
                  <option value="Phân Bổ Vĩ Mô & Cổ Tức">Phân Bổ Vĩ Mô & Cổ Tức Bền Vững</option>
                  <option value="Giao Dịch Phái Sinh Kỷ Luật">Giao Dịch Phái Sinh Kỷ Luật</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="broker-bio">
                Tóm tắt kinh nghiệm & Tôn chỉ đầu tư
              </label>
              <textarea
                id="broker-bio"
                className="form-textarea"
                rows={3}
                placeholder="Mô tả phong cách hỗ trợ nhà đầu tư, các cột mốc nổi bật trong sự nghiệp..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="form-divider" />

            <h4 className="form-subheading">Khởi Tạo Phòng Học Đầu Tư Đầu Tiên (Tùy chọn)</h4>
            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label" htmlFor="room-title">
                  Tên phòng đầu tư
                </label>
                <input
                  id="room-title"
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Alpha Growth Club"
                  value={initialRoomTitle}
                  onChange={(e) => setInitialRoomTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="room-fee">
                  Phí gia nhập 1 lần (VND)
                </label>
                <input
                  id="room-fee"
                  type="number"
                  step="50000"
                  min="200000"
                  max="5000000"
                  className="form-input"
                  value={initialRoomFeeVnd}
                  onChange={(e) => setInitialRoomFeeVnd(e.target.value)}
                />
                <span className="form-hint">Broker nhận 85%–90%, Aura giữ 10%–15% phí sàn</span>
              </div>
            </div>

            <div className="compliance-pledge-box">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={pledgeChecked}
                  onChange={(e) => setPledgeChecked(e.target.checked)}
                />
                <span className="pledge-text">
                  <strong>Cam kết đạo đức tài chính:</strong> Tôi cam đoan số CCHN trên là chính xác và thuộc quyền sở hữu của tôi. Tôi cam kết KHÔNG cam kết lợi nhuận 100%, KHÔNG nhận ủy thác đầu tư trái phép, KHÔNG lôi kéo sang các sàn tiền ảo/forex lừa đảo, và hoàn toàn chịu trách nhiệm trước pháp luật Việt Nam.
                </span>
              </label>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isLoading}>
                Hủy Bỏ
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || !pledgeChecked}
              >
                {isLoading ? "Đang Gửi Hồ Sơ..." : "Nộp Hồ Sơ Xác Thực"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
