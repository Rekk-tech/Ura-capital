# Feature Specification: FEAT-088 Aura Broker Hub & Verified Creator Marketplace

**Feature ID**: `FEAT-088`  
**Created**: 2026-10-23  
**Status**: APPROVED  
**Target Delivery**: Phase 9 Production Hardening  
**Constitution Ref**: v1.1.0 (Principles VI, VII, VIII)

---

## 1. Executive Summary & Problem Statement

### 1.1 Problems Addressed (Nỗi đau thị trường chứng khoán Việt Nam)
1. **Ma trận room phím hàng tự phát, broker lừa đảo ("lùa gà")**:
   - Hàng triệu nhà đầu tư mới (F0) đang lạc lối giữa hàng nghìn nhóm Zalo, Telegram không kiểm duyệt. Môi giới thật giả lẫn lộn, lạm dụng hình ảnh photoshop lãi ảo, phím hàng rác đầu cơ và dẫn dụ vào các sàn phái sinh/forex quốc tế trái phép, gây thiệt hại tài chính nặng nề.
2. **Thiếu hạ tầng chuyên nghiệp cho Broker chân chính**:
   - Các chuyên gia phân tích và môi giới có chứng chỉ hành nghề của Ủy ban Chứng khoán Nhà nước (UBCKNN) bị đánh đồng với đối tượng lừa đảo, thiếu công cụ chuyên dụng để số hóa tài liệu bài giảng, quản lý thành viên văn minh, và tự động hóa thu học phí.
3. **Aura Capital - Creator Economy & Marketplace**:
   - Aura Capital đứng ra làm bên thứ ba độc lập xác thực danh tính (eKYC) và số hiệu CCHN của UBCKNN, cấp **Broker Credibility Passport**, cung cấp hạ tầng **Exclusive Room** khép kín, tích hợp bài tập thực chiến trên Simulation (Map 1/Map 2), và vận hành cơ chế dòng tiền 2 chiều bền vững (SaaS từ Broker + hoa hồng vé vào phòng từ User).

---

## 2. User Roles & Authority Matrix

| Role | Định danh | Trách nhiệm & Quyền hạn cốt lõi |
|---|---|---|
| `LEARNER` | Nhà Đầu Tư F0 | Khám phá Broker Hub, kiểm tra số CCHN UBCKNN & CTCK trực thuộc, thanh toán phí gia nhập 1 lần (One-Time Entrance Fee), học tập tài liệu độc quyền, bình luận chiến lược, làm bài tập mô phỏng, để lại đánh giá tín nhiệm (Verified Review). |
| `BROKER` | Chuyên Gia Xác Thực | Xuất bản Exclusive Room, phân phối bài giảng/tài liệu bài bản, nhận định thị trường, tạo kịch bản thực chiến mô phỏng, nhận 85%–90% doanh thu vé vào phòng. Trả phí SaaS hàng tháng theo bậc thang (Starter, Pro, Master). |
| `ADMIN` | Quản Trị / Tuân Thủ | Thẩm định hồ sơ Broker (kiểm tra đối chiếu số CCHN UBCKNN), quản lý tham số phí sàn (10%–15%) và gói SaaS, xử lý cảnh báo từ khóa vi phạm tuân thủ, đình chỉ phòng gian lận, ghi nhật ký kiểm toán bất biến. |

---

## 3. Functional Requirements (FR)

### FR-001: Broker Credibility Passport & eKYC Verification
- Hệ thống cho phép người dùng đăng ký nâng cấp thành đối tác Broker bằng cách nộp:
  - Họ và tên đầy đủ, số CCCD (eKYC).
  - Số hiệu Chứng chỉ hành nghề do UBCKNN cấp (bắt buộc định dạng hợp lệ).
  - Tên Công ty Chứng khoán trực thuộc (SSI, VPS, TCBS, VNDIRECT, HSC, MBS, VCI, Mirae Asset...).
  - Số năm kinh nghiệm & trường phái đầu tư (Phân tích cơ bản, Phân tích kỹ thuật, Đầu tư tăng trưởng, Cổ tức giá trị...).
  - Cam kết tuân thủ bộ quy tắc đạo đức hành nghề tài chính.
- Trạng thái hồ sơ: `PENDING_REVIEW` → `VERIFIED_ACTIVE` (do Admin duyệt) hoặc `REJECTED` / `SUSPENDED`.
- Hiển thị huy hiệu cấp bậc trên thẻ Broker:
  - `Certified Broker`: Đã qua kiểm duyệt eKYC & CCHN UBCKNN.
  - `Senior Partner`: Trên 3 năm kinh nghiệm và > 100 học viên.
  - `Institutional Mentor`: Chuyên gia kỳ cựu > 7 năm kinh nghiệm hoặc cấp quản trị CTCK.

### FR-002: Exclusive Room Creation & Content Management
- Broker đã xác thực được phép tạo 1 hoặc nhiều Exclusive Room với các thông tin:
  - Tên phòng, mô tả tôn chỉ đầu tư, trường phái, ảnh đại diện.
  - Mức phí gia nhập 1 lần (`entranceFee`: tối thiểu 200.000 VNĐ, tối đa 5.000.000 VNĐ, mặc định 500.000 VNĐ).
- Broker có thể xuất bản các tài nguyên trong phòng:
  - Bài giảng chuyên sâu / Video / Slide định giá.
  - Bản tin nhận định thị trường hàng ngày.
  - Kịch bản mô phỏng đính kèm: liên kết trực tiếp bài tập thực chiến FOMO Arena (Map 1) hoặc Macro Strategy (Map 2) của Aura Capital.

### FR-003: Learner Enrollment & One-Time Entrance Fee Escrow
- Học viên F0 duyệt danh bạ phòng tại `/broker-hub`. Khi nhấn tham gia:
  - Xem tóm tắt thông tin Broker, CCHN, chính sách bảo đảm của Aura Capital và tuyên bố miễn trừ trách nhiệm pháp lý.
  - Thanh toán phí gia nhập 1 lần duy nhất (không trừ tiền định kỳ theo tháng).
  - Hệ thống ghi nhận `RoomEnrollment`: phân bổ 10%–15% cho Aura Capital (Platform Take-Rate) và 85%–90% vào số dư ví của Broker.
  - Quyền truy cập vào phòng được mở khóa vĩnh viễn cho học viên.

### FR-004: Broker Tiered SaaS Infrastructure Subscription
- Broker chi trả phí hạ tầng định kỳ hàng tháng cho Aura Capital để duy trì vận hành "văn phòng ảo":
  - **Gói Starter (Khởi điểm)**: 199.000 VNĐ/tháng — Quản lý dưới 50 học viên, tối đa 5 bài giảng, 5GB lưu trữ.
  - **Gói Pro (Chuyên nghiệp)**: 499.000 VNĐ/tháng — Quản lý 50 đến 250 học viên, không giới hạn bài giảng, 20GB lưu trữ, ưu tiên xuất hiện.
  - **Gói Master (Tinh hoa)**: 999.000 VNĐ/tháng — Quản lý trên 250 học viên, băng thông cao, gắn nhãn nổi bật trang chủ.
- Khi gói SaaS hết hạn: Room chuyển sang trạng thái bảo lưu (`ARCHIVED_READ_ONLY`) — học viên cũ vẫn xem được tài liệu đã mua, nhưng Broker bị tạm khóa quyền đăng bài mới và tuyển học viên mới cho đến khi gia hạn.

### FR-005: Compliance Engine & Automated Safety Filter
- Bộ lọc từ khóa tự động quét 100% bài viết, tài liệu, và tin nhắn trong Room:
  - Cảnh báo và chặn các nội dung chứa từ khóa vi phạm: *"cam kết lãi 100%"*, *"chắc chắn ăn bằng lần"*, *"ủy thác đầu tư"* (trái phép), *"kéo vốn"*, *"sàn bao lỗ"*, *"forex/tiền ảo"* trái phép.
  - Nội dung bị gắn cờ được chuyển ngay vào Hàng đợi kiểm duyệt (`ComplianceQueue`) để Admin thẩm định.

### FR-006: Admin Verification & Governance Surface
- Bổ sung giao diện Quản lý Broker trong Admin Control Surface:
  - Bảng duyệt hồ sơ đăng ký Broker: Xem số CCHN, CTCK, bằng cấp, nút Phê duyệt / Từ chối.
  - Bảng quản lý phòng và doanh thu Marketplace (tổng phí thu, phần trăm chia sẻ).
  - Bảng xử lý cảnh báo tuân thủ: Cảnh cáo, hạ bậc huy hiệu hoặc phong tỏa phòng vi phạm.

---

## 4. Non-Functional Requirements (NFR)

- **NFR-001 (Server Authority & Security)**: Toàn bộ quá trình tính toán phí sàn (take-rate) và phân bổ doanh thu phải được thực thi máy chủ qua transaction database; tuyệt đối không tin cậy tham số số tiền do client gửi lên.
- **NFR-002 (Compliance & Legal Safety)**: Mọi trang phòng đầu tư bắt buộc hiển thị Disclaimer: *"Nội dung trong phòng nhằm mục đích đào tạo kiến thức và thảo luận học thuật, không cấu thành lời mời chào ủy thác quản lý tài sản hay cam kết lợi nhuận"*.
- **NFR-003 (Performance & Responsiveness)**: Thời gian tải trang `/broker-hub` dưới 500ms; bộ lọc trường phái và CTCK lọc tức thì phía client.
- **NFR-004 (Accessibility & UX Standards)**: Đạt chuẩn WCAG 2.1 AA, hỗ trợ đầy đủ phím bấm bàn phím, độ tương phản cao, Dark mode sang trọng với glassmorphism và huy hiệu xác thực.

---

## 5. Success Criteria & Definition of Done

- [ ] Danh bạ `/broker-hub` hiển thị trực quan các Broker đã xác thực và Exclusive Room.
- [ ] Quy trình đăng ký Broker tại `/broker-hub/register` nộp số CCHN UBCKNN thành công.
- [ ] Màn hình Quản trị Admin phê duyệt hồ sơ Broker và phân quyền `ROLE: BROKER`.
- [ ] Giao diện Exclusive Room `/broker-hub/rooms/:roomId` hiển thị tài liệu, bản tin, liên kết Simulation và hộp thoại tham gia.
- [ ] Luồng thanh toán phí gia nhập 1 lần hạch toán đúng tỷ lệ chia sẻ doanh thu (Aura 10-15% / Broker 85-90%).
- [ ] Bộ lọc tuân thủ tự động cảnh báo các từ khóa cam kết lợi nhuận lừa đảo.
