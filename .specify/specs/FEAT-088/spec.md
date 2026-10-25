# Feature Specification: FEAT-088 Aura Broker Hub & Verified Creator Marketplace

**Feature ID**: `FEAT-088`  
**Created**: 2026-10-23  
**Status**: APPROVED  
**Target Delivery**: Phase 9 Production Hardening  
**Constitution Ref**: v1.2.0 (Principles VI, VII, VIII, IX, X)

---

## Clarifications

### Session 2026-10-25
- Q: Làm thế nào để hệ sinh thái Aura Capital (bao gồm Broker Hub) vận hành chặt chẽ, không chồng chéo quyền hạn và bảo vệ người học? → A: Áp dụng triệt để nguyên tắc Phân tách trách nhiệm (Segregation of Duties - SoD) với 5 Vai trò chuẩn (`GUEST`, `LEARNER`, `BROKER`, `MODERATOR`, `SYSTEM_ADMIN`) và 4 Nguyên tắc Logic cốt lõi (Tách biệt 2 luồng khóa học, 2 chốt chặn Broker, Bảo vệ chéo tài khoản, và Nhật ký kiểm toán bất biến).
- Q: Luồng trải nghiệm sau khi đăng nhập thành công (Post-Login) nên hiển thị bước xác nhận vai trò và phân quyền theo hình thức nào? → A: Màn hình riêng Role Gateway (/auth/role-gateway): Đăng nhập xong sẽ sang màn hình trang nhã hiển thị vai trò được cấp, ma trận quyền hạn SoD và nút chọn Không gian làm việc tương ứng (Học viên / Broker / Kiểm duyệt / Quản trị viên). Bỏ hoàn toàn bảng chọn vai trò gắn liền ở trang đăng nhập (Hình số 2) để trang login hoàn toàn sạch sẽ.

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

## 2. User Roles & Authority Matrix (5-Role Segregation of Duties)

| Role | Định danh | Trách nhiệm & Quyền hạn cốt lõi | Ràng buộc bảo mật & Tuân thủ |
|---|---|---|---|
| `GUEST` | Khách vãng lai | Xem trang chủ, xem danh mục khóa học, xem bảng tin cộng đồng (Read-only), xem hồ sơ tín nhiệm & CCHN của Broker. | Tuyệt đối không có quyền ghi; không thể tham gia học, đấu trường hoặc bình luận. |
| `LEARNER` | Nhà Đầu Tư F0 | Học khóa học Academy, thi đấu giả lập Map 1 & Map 2, quản lý danh mục ảo, đăng bài/bình luận/thả tim/báo cáo tại Diễn đàn, mua vé vào Broker Room và chấm điểm Review xác thực. | Mặc định sau khi xác thực OTP. Không được tạo phòng, không được phím hàng hay lôi kéo nạp tiền. |
| `BROKER` | Chuyên Gia Xác Thực | Kế thừa quyền LEARNER; tạo và quản trị Room riêng tại `/broker-hub`, xuất bản bài giảng/nhận định/chiến lược trong Room, tạo kịch bản thực chiến cho học viên Room, xem đối soát doanh thu Room. | Bắt buộc có CCHN UBCKNN + eKYC do SYSTEM_ADMIN duyệt; trả phí SaaS hàng tháng; chịu hậu kiểm của MODERATOR. Tuyệt đối không được sửa khóa học gốc `/academy`. |
| `MODERATOR` | Biên Tập & Kiểm Duyệt | Soạn thảo & cập nhật khóa học chính thống trên `/academy`; xử lý hàng đợi báo cáo cộng đồng; kiểm duyệt/gỡ bài giảng Broker vi phạm cam kết lợi nhuận; tạm khóa (mute) người dùng vi phạm tối đa 24h. | Không được thay đổi Role người dùng, không được can thiệp biểu phí gói cước sàn, không can thiệp số dư danh mục. |
| `SYSTEM_ADMIN` | Quản Trị Hệ Thống Tối Cao | Duyệt hồ sơ CCHN UBCKNN & cấp tích xanh BROKER; phân quyền Role (`LEARNER` ↔ `BROKER` ↔ `MODERATOR`); khóa/mở khóa toàn quyền tài khoản; giám sát & reset phiên giả lập treo; quản lý biểu phí sàn & SaaS; tra cứu Audit Log bất biến. | Không thể tự khóa (Suspend) hoặc tự hạ quyền của chính mình; mọi thao tác đều ghi log kiểm toán bất biến. |


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

### FR-007: Clean Authentication & Post-Login Role Gateway Screen
- **Trang Đăng Nhập (`/login`)**:
  - Giao diện form chuẩn mực tối giản: chỉ gồm trường nhập Email, Mật khẩu, hiển thị/ẩn mật khẩu, và nút Đăng Nhập.
  - Tuyệt đối không gắn các khối thẻ dev/seed role dày đặc gây tràn viền hoặc phá vỡ cấu trúc thẩm mỹ (đã loại bỏ hoàn toàn khối Hình số 2).
- **Màn hình Cổng Xác Nhận Vai Trò & Phân Quyền (`/auth/role-gateway`)**:
  - Sau khi đăng nhập thành công với tài khoản và mật khẩu thông thường, người dùng được điều hướng tới màn hình trung gian trang nhã này trước khi vào phân vùng chuyên biệt.
  - Hiển thị danh tính: Avatar, Email, Tên người dùng và Huy hiệu vai trò chính thống được cấp phát (`LEARNER`, `BROKER`, `MODERATOR`, `SYSTEM_ADMIN`).
  - Ma trận SoD & Giới hạn quyền hạn: Trình bày súc tích các phân vùng ĐƯỢC PHÉP và BỊ GIỚI HẠN trong phiên làm việc để người dùng nắm rõ trách nhiệm.
  - Bộ chọn Không gian làm việc (Workspace Selector): Đối với tài khoản có nhiều quyền hoặc tài khoản kiểm thử/quản trị, cho phép lựa chọn không gian đích muốn làm việc (Không gian Học viên F0, Phòng Broker Độc Quyền, Trung tâm Kiểm duyệt, Admin Console).
  - Nút bấm xác nhận mượt mà: "Vào Không Gian Làm Việc" đưa người dùng đến đúng URL đích tương ứng.

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
