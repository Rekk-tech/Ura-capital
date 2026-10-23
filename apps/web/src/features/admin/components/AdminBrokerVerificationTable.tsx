import React, { useState, useEffect } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { brokerApi } from "../../../api/broker.api";
import { BrokerProfileDto, ComplianceFlagDto } from "@aura/shared";

export const AdminBrokerVerificationTable: React.FC = () => {
  const [pendingBrokers, setPendingBrokers] = useState<BrokerProfileDto[]>([]);
  const [complianceFlags, setComplianceFlags] = useState<ComplianceFlagDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pending, flags] = await Promise.all([
        brokerApi.getPendingBrokers(),
        brokerApi.getComplianceFlags(),
      ]);
      setPendingBrokers(pending);
      setComplianceFlags(flags);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (brokerId: string) => {
    try {
      await brokerApi.verifyBroker(brokerId, { status: "VERIFIED_ACTIVE", badge: "CERTIFIED_BROKER" });
      setActionSuccessMessage("Đã phê duyệt thành công và cấp quyền ROLE: BROKER!");
      loadData();
      setTimeout(() => setActionSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(err?.message || "Lỗi phê duyệt hồ sơ");
    }
  };

  const handleReject = async (brokerId: string) => {
    const reason = window.prompt("Nhập lý do từ chối hồ sơ (ví dụ: Số CCHN không khớp dữ liệu UBCKNN):");
    if (!reason) return;
    try {
      await brokerApi.verifyBroker(brokerId, { status: "REJECTED", rejectionReason: reason });
      setActionSuccessMessage("Đã từ chối hồ sơ đối tác.");
      loadData();
      setTimeout(() => setActionSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(err?.message || "Lỗi từ chối hồ sơ");
    }
  };

  return (
    <div className="admin-broker-panel" data-testid="admin-broker-panel">
      <div className="admin-panel-header">
        <div>
          <h2 className="admin-section-title">Thẩm Định Hồ Sơ Đối Tác Broker & Kiểm Soát Tuân Thủ</h2>
          <p className="admin-section-desc">
            Xác thực số hiệu CCHN cấp bởi UBCKNN, cấp quyền xuất bản phòng đầu tư độc quyền và xử lý cảnh báo lừa đảo.
          </p>
        </div>
        <button type="button" className="btn btn-sm btn-ghost" onClick={loadData}>
          <RefreshCw size={14} style={{ marginRight: "4px" }} /> Làm mới
        </button>
      </div>

      {actionSuccessMessage && (
        <div className="alert-success-banner" style={{ margin: "1rem 0" }}>
          <CheckCircle size={16} />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Pending Broker Applications */}
      <div className="admin-card">
        <h3 className="card-inner-title">
          <ShieldCheck size={18} className="text-cyan" />
          Hồ Sơ Đăng Ký Chờ Thẩm Định ({pendingBrokers.length})
        </h3>

        {isLoading ? (
          <div className="text-center" style={{ padding: "2rem" }}>
            <div className="loading-spinner" />
          </div>
        ) : pendingBrokers.length > 0 ? (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Họ Tên & CCCD</th>
                  <th>Số CCHN UBCKNN</th>
                  <th>Công Ty Chứng Khoán</th>
                  <th>Kinh Nghiệm & Trường Phái</th>
                  <th>Thao Tác Thẩm Định</th>
                </tr>
              </thead>
              <tbody>
                {pendingBrokers.map((broker) => (
                  <tr key={broker.id}>
                    <td>
                      <strong>{broker.fullName}</strong>
                      <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                        CCCD: {broker.idCardNumberMasked}
                      </div>
                    </td>
                    <td>
                      <code className="license-code text-cyan">{broker.licenseNumber}</code>
                    </td>
                    <td>{broker.firmName}</td>
                    <td>
                      <div>{broker.experienceYears} năm</div>
                      <span className="badge badge-info">{broker.investmentStyle}</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-sm btn-emerald"
                          onClick={() => handleApprove(broker.id)}
                          data-testid={`approve-broker-${broker.id}`}
                        >
                          <CheckCircle size={14} style={{ marginRight: "4px" }} /> Duyệt CCHN
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleReject(broker.id)}
                        >
                          <XCircle size={14} style={{ marginRight: "4px" }} /> Từ Chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-table-state text-center" style={{ padding: "2rem" }}>
            <CheckCircle size={32} className="text-emerald" style={{ margin: "0 auto 0.5rem" }} />
            <p className="text-muted">Không có hồ sơ Broker nào đang chờ thẩm định.</p>
          </div>
        )}
      </div>

      {/* Compliance Flags Queue */}
      <div className="admin-card" style={{ marginTop: "1.5rem" }}>
        <h3 className="card-inner-title">
          <AlertTriangle size={18} className="text-amber" />
          Cảnh Báo Tuân Thủ Tự Động (Compliance Scanner Flags) ({complianceFlags.length})
        </h3>

        {complianceFlags.length > 0 ? (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Thời Gian</th>
                  <th>Chuyên Gia</th>
                  <th>Từ Khóa Vi Phạm</th>
                  <th>Trích Đoạn Nội Dung Bị Bắt</th>
                  <th>Mức Độ</th>
                </tr>
              </thead>
              <tbody>
                {complianceFlags.map((flag) => (
                  <tr key={flag.id}>
                    <td>{new Date(flag.createdAt).toLocaleTimeString("vi-VN")}</td>
                    <td>{flag.brokerName}</td>
                    <td>
                      <span className="badge badge-danger">{flag.flaggedKeyword}</span>
                    </td>
                    <td>
                      <code style={{ fontSize: "0.85rem" }}>{flag.snippet}</code>
                    </td>
                    <td>
                      <span className="badge badge-warning">{flag.severity}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-table-state text-center" style={{ padding: "1.5rem" }}>
            <ShieldCheck size={28} className="text-emerald" style={{ margin: "0 auto 0.5rem" }} />
            <p className="text-muted">Hệ thống tuân thủ an toàn: Chưa phát hiện từ khóa lừa đảo hoặc cam kết lợi nhuận nào.</p>
          </div>
        )}
      </div>
    </div>
  );
};
