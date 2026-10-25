# Aura Capital — Hướng Dẫn Kiến Trúc & Nhiệm Vụ Chi Tiết Từng Tab Nền Tảng

> **Phiên bản tài liệu**: `v1.0.0 · Production Ready`  
> **Cập nhật lần cuối**: `2026-10-23`  
> **Nền tảng**: Hệ thống Đào tạo & Mô phỏng Đầu tư Tài chính Chuẩn Định Chế Aura Capital  

---

## 1. Giới Thiệu Tổng Quan Nền Tảng (Platform Overview)

**Aura Capital** là nền tảng công nghệ tài chính và giáo dục đầu tư (FinTech & EdTech) tiên phong, kết hợp giữa:
1. **Học viện đào tạo có cấu trúc (Aura Academy)**: Chuẩn hóa kiến thức tài chính vĩ mô, cổ phiếu, phái sinh và định giá tài sản.
2. **Đấu trường giao dịch mô phỏng (Trading Simulation)**: Hai đấu trường thực chiến *FOMO Arena* và *Macro Pro Room* với cơ chế khớp lệnh thời gian thực và bóc tách tâm lý đầu tư.
3. **Cố vấn trí tuệ nhân tạo (Aura Intelligence & CrediFin AI Advisor)**: Ứng dụng mô hình ngôn ngữ lớn chuyên sâu tài chính, hỗ trợ phản biện luận điểm và kiểm soát rủi ro 24/7.
4. **Mạng lưới sinh thái thực chiến (Community & Broker Hub)**: Kết nối học viên, chuyên gia đầu tư được cấp phép và cộng đồng nhà đầu tư kỷ luật.

Toàn bộ hệ thống vận hành theo nguyên lý **Server-Authoritative**, đảm bảo tính toàn vẹn dữ liệu, kiểm soát rủi ro độc lập và bảo mật đa tầng theo tiêu chuẩn Argon2id.

---

## 2. Bản Đồ Điều Hướng Cốt Lõi (Core Navigation Map)

Thanh điều hướng chính của Aura Capital (`AppHeader`) được tổ chức khoa học thành các Tab nghiệp vụ chuyên biệt:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [AC Logo] Aura Capital │ Trang Chủ │ Tổng Quan │ Khóa Học │ Đấu Trường │ Broker Hub │ Danh Mục │ Cộng Đồng │ ✨ Upgrade │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Nhiệm Vụ & Chức Năng Chi Tiết Từng Tab

### 1. Trang Chủ (`/` — Home / Landing Page)
* **Đường dẫn**: `/`
* **Đối tượng**: Mọi khách vãng lai, người học mới tìm hiểu và học viên quay trở lại.
* **Nhiệm vụ cốt lõi**:
  - **Giới thiệu tầm nhìn & nền tảng**: Trình bày triết lý giáo dục "Thực chiến không rủi ro vốn thật", minh bạch môi trường đào tạo và hệ sinh thái tài chính.
  - **Trưng bày 6 trụ cột năng lực cốt lõi (Core Capabilities)**:
    1. *Học Viện Aura Academy*: Lộ trình bài bản, Flashcard 3D và mini-quiz tự động.
    2. *Đấu Trường FOMO Arena (Map 1)*: 7 vòng thực chiến 45s tôi luyện tâm lý ngắn hạn.
    3. *Phòng Đầu Tư Vĩ Mô Pro Room (Map 2)*: Phân bổ tài sản dài hạn qua 12 quý kinh tế.
    4. *Cộng Đồng Nhà Đầu Tư*: Diễn đàn thảo luận tài chính & phản biện chiến lược.
    5. *Bảo Mật & Minh Bạch*: Hạch toán minh bạch thời gian thực và mã hóa chuẩn Argon2id.
    6. *Aura Intelligence*: Trợ lý AI đồng hành định hình kỷ luật giao dịch an toàn.
  - **Kêu gọi hành động (CTA)**: Nút "Bắt Đầu Ngay" dẫn tới Đăng Ký Tài Khoản hoặc Trải Nghiệm Khóa Học Miễn Phí.

---

### 2. Tổng Quan (`/dashboard` — Learner Dashboard)
* **Đường dẫn**: `/dashboard`
* **Yêu cầu đăng nhập**: Có (Học viên & Quản trị viên).
* **Nhiệm vụ cốt lõi**:
  - **Khoang điều khiển học viên (Gamification Cockpit)**:
    - Hiển thị Cấp độ Trader (`Trader Level`), Cấp bậc danh hiệu (`Học Giả Aura`, `Chiến Lược Gia Vĩ Mô`, v.v.).
    - Thanh tiến trình tích lũy điểm kinh nghiệm (`XP Progress Bar`).
    - Bộ sưu tập huy hiệu thành tích đạt được sau các vòng đấu trường (`Survivor Badge`, `VIP Patron`, v.v.).
  - **Tổng hợp tài sản & vị thế**: Widget tóm tắt giá trị danh mục, tỷ suất sinh lời tổng thể và tiền mặt khả dụng.
  - **Tiến độ học tập**: Theo dõi % hoàn thành các chặng khóa học tại Academy.
  - **Phím tắt điều hướng nhanh**: Lối tắt một chạm tới Đấu trường, Cộng đồng, Phân tích danh mục và Nâng cấp tài khoản.

---

### 3. Khóa Học (`/academy` — Aura Academy)
* **Đường dẫn**: `/academy`, `/academy/courses/:id`, `/academy/learning-path`
* **Nhiệm vụ cốt lõi**:
  - **Học viện kiến thức tài chính phân tầng**:
    - **Chặng 1 (Nền Tảng)**: Tư duy tài chính cá nhân, quản trị dòng tiền, chu kỳ kinh tế cơ bản.
    - **Chặng 2 (Cổ Phiếu & Phân Tích)**: Đọc hiểu báo cáo tài chính, định giá chiết khấu dòng tiền (DCF), P/E, P/B, phân tích kỹ thuật hành động giá.
    - **Chặng 3 (Phái Sinh & Hedging Phòng Thủ)**: Hợp đồng tương lai VN30, phòng hộ danh mục bằng vị thế Short, chiến lược tái cân bằng tài sản khi thị trường sụt giảm.
  - **Hình thức học tập vi mô (Interactive Micro-learning)**:
    - Thẻ bài học ngắn gọn, tập trung trọng tâm, tối ưu ghi nhớ.
    - Bộ thẻ thuật ngữ tương tác (`Flashcards`) lật mở nhanh.
    - Bài trắc nghiệm tình huống (`Interactive Quizzes`) kiểm tra khả năng ứng dụng thực tế.
    - Chứng chỉ số ghi nhận hoàn thành khóa học trên hồ sơ cá nhân.

---

### 4. Đấu Trường Giả Lập (`/simulation` — Trading Simulation)
* **Đường dẫn**: `/simulation`, `/simulation/fomo-arena`, `/simulation/pro-room`
* **Nhiệm vụ cốt lõi**:
  - **Môi trường rèn luyện thực chiến không rủi ro tài chính**: Cung cấp tài khoản vốn giả lập tiêu chuẩn 100.000.000 ₫ (có thể tùy biến lên 1 tỷ đồng với gói VIP).
  - **Hai Đấu Trường Độc Quyền**:
    1. **Map 1 — Đấu Trường FOMO (FOMO Arena)**:
       - Vượt qua 7 vòng giao dịch cân não mô phỏng chu kỳ biến động ngắn hạn.
       - Hệ thống tính toán chỉ số tâm lý `FOMO Index (0 - 100)` dựa trên tốc độ bấm lệnh, đu đỉnh, cắt lỗ trễ và đòn bẩy quá mức.
       - Cảnh báo bẫy tâm lý và chấm điểm kỷ luật sau trận đấu.
    2. **Map 2 — Phòng Thao Lược Vĩ Mô (Pro Room)**:
       - Thử thách 12 quý vĩ mô đối mặt với biến số lãi suất thực, lạm phát và suy thoái kinh tế.
       - Phân bổ danh mục đa lớp: Cổ phiếu tăng trưởng, Cổ tức phòng thủ, Trái phiếu, Tiền mặt, Vàng.
       - Đánh giá theo chuẩn quỹ định chế: Đo lường CAGR, Tỷ lệ Sharpe, Mức sụt giảm tối đa (`MDD`).
       - Cấp chứng chỉ chu kỳ hoàn thành: Ví dụ *Nhà đầu tư Phòng thủ (Defensive Investor)*.
  - **Sổ lệnh & Khớp lệnh tức thì**: Mua/bán cổ phiếu với loại lệnh Thị trường (Market) và Giới hạn (Limit), đảm bảo server-authoritative không bị gian lận điểm số.
  - **Bảng Xếp Hạng Nhà Đầu Tư (Leaderboard)**: Tôn vinh các nhà đầu tư đạt hiệu suất sinh lời cao nhất và kỷ luật rủi ro tốt nhất.

---

### 5. Broker Hub (`/broker` — Phòng Đầu Tư & Môi Giới Xác Thực)
* **Đường dẫn**: `/broker`, `/broker/rooms/:brokerId`
* **Nhiệm vụ cốt lõi**:
  - **Sàn giao lưu chuyên gia xác thực**: Nơi hội tụ các Broker chuyên nghiệp thuộc các công ty chứng khoán hàng đầu (VPS, SSI, TCBS, VNDIRECT, HSC...) đã được kiểm tra chứng chỉ hành nghề của Ủy ban Chứng khoán Nhà nước (UBCKNN).
  - **Phòng Đầu Tư Độc Quyền (Broker Rooms)**:
    - Học viên tiếp cận góc nhìn chiến lược, triết lý đầu tư chuyên sâu (Đầu tư giá trị, Cổ tức, Tăng trưởng, Sóng ngành).
    - Tham khảo các bài viết phân tích doanh nghiệp và danh mục mô phỏng của Broker.
  - **Đăng ký tư vấn 1-1 & Mở tài khoản thực tế**:
    - Cơ chế gửi yêu cầu liên hệ trực tiếp cho Broker yêu thích.
    - Hưởng các chương trình ưu đãi phí giao dịch và quà tặng độc quyền khi mở tài khoản chứng khoán đối tác thông qua Aura Capital.

---

### 6. Danh Mục (`/portfolio` — Portfolio Valuation & Analytics)
* **Đường dẫn**: `/portfolio`
* **Yêu cầu đăng nhập**: Có.
* **Nhiệm vụ cốt lõi**:
  - **Báo cáo định giá tài sản ròng (NAV)**: Phản ánh liên tục giá trị danh mục theo thị giá cổ phiếu giả lập.
  - **Biểu đồ phân bổ tỷ trọng tài sản**:
    - Phân bổ theo loại tài sản (Cổ phiếu, Tiền mặt).
    - Phân bổ theo nhóm ngành (Công nghệ thông tin, Ngân hàng, Bán lẻ, Thép, Bất động sản...).
  - **Chỉ số hiệu suất & rủi ro chuẩn mực**:
    - Tỷ suất sinh lời danh mục (`ROI %`).
    - Lợi nhuận danh mục hàng năm (`CAGR`).
    - Tỷ lệ sụt giảm tối đa (`Max Drawdown - MDD`).
    - Chỉ số đo lường hiệu quả sinh lời trên một đơn vị rủi ro (`Sharpe Ratio`).
  - **Sổ nhật ký giao dịch**: Liệt kê chi tiết mọi lệnh mua, lệnh bán, giá vốn, khối lượng và lãi/lỗ thực hiện.

---

### 7. Cộng Đồng (`/community` — Diễn Đàn Thảo Luận Tài Chính)
* **Đường dẫn**: `/community`, `/community/posts/:id`
* **Nhiệm vụ cốt lõi**:
  - **Diễn đàn tài chính đa chiều chuẩn Trading Hub**: Nơi học viên và chuyên gia trao đổi góc nhìn phân tích, nhật ký giao dịch và phản biện luận điểm.
  - **Bố cục 3 Cột Hiện Đại**:
    - **Cột Trái**:
      - Nút hành động gradient `+ Tạo Bài Viết Mới`.
      - Điều hướng **Luồng Thảo Luận**: *Tất cả bài viết*, *Khuyến nghị & Định giá*, *Vĩ mô & Thị trường*, *Phòng thủ & Cổ tức*, *Trải nghiệm thực chiến*, và luồng đặc quyền *Phòng VIP Pro Room*.
      - Widget chỉ số thị trường trực tiếp: **VN-INDEX** & **VN30** cập nhật liên tục.
    - **Cột Giữa**:
      - Bộ soạn thảo bài viết 3 tab (`Phân Tích & Luận Điểm`, `Lệnh Giao Dịch`, `Câu Hỏi`) kèm chèn nhanh mã cổ phiếu (`$FPT`, `$MWG`...), biểu đồ và bộ đếm 5000 ký tự.
      - Thanh lọc phân loại: `Mới Nhất`, `Sôi Nổi`, `Được Ghim`, `Theo Chủ Đề`.
      - Thẻ Báo cáo chu kỳ đã kiểm duyệt (`#PRO-ROOM-012`): Trưng bày hiệu suất danh mục 3 năm, chứng chỉ vàng và đánh giá từ Cố vấn AI CrediFin.
      - Dòng bảng tin bài viết cộng đồng kèm nhãn ticker biến động giá, số lượng tương tác thích/bình luận và nút tải thêm trang.
    - **Cột Phải**:
      - Thẻ **CrediFin AI Advisor**: Kích hoạt nhanh trợ lý AI Cố vấn 24/7.
      - **Bảng Xếp Hạng Top 5 Nhà Đầu Tư**: Hiển thị tỷ suất sinh lời, điểm XP và phân biệt rõ người dùng với nhãn `(Bạn)` màu xanh thương hiệu nổi bật.
      - **Mã Thảo Luận Sôi Nổi**: Lưới 2x2 các cổ phiếu đang thu hút lượng thảo luận cao nhất.
      - **Hội Thảo Masterclass PRO VIP**: Lịch hội thảo chuyên sâu và nút đăng ký giữ chỗ.

---

### 8. Gói Hội Viên & Nâng Cấp (`/subscription` — Upgrade & Membership Plans)
* **Đường dẫn**: `/subscription` (Truy cập nhanh qua nút **✨ Upgrade** trên Header)
* **Nhiệm vụ cốt lõi**:
  - **Minh bạch hóa quyền lợi & Phân hạng hội viên**: Xóa bỏ các bảng chẩn đoán kỹ thuật cũ, đưa ra bảng giá thương mại trực quan, sang trọng.
  - **Chuyển đổi chu kỳ thanh toán**:
    - Công tắc chuyển đổi linh hoạt **Theo Năm (Tiết kiệm 38% 🔥)** và **Theo Tháng**.
  - **Hai Thẻ Gói Dịch Vụ**:
    1. **Gói Tiêu Chuẩn (0 ₫ / Trọn đời)**:
       - Vốn thực chiến 100.000.000 ₫ cố định.
       - Không giới hạn Đấu Trường FOMO (Map 1).
       - 3 phiên / tháng Đấu Trường Pro Room (Map 2).
       - 10 câu hỏi / ngày với AI Aura Coach.
       - Mở khóa Chặng 1 & 2 Khóa học Cổ phiếu.
       - Nút hiển thị: *"Gói Đang Sử Dụng"*.
    2. **Gói Cao Cấp VIP (1.490.000 ₫/năm hoặc 199.000 ₫/tháng)**:
       - Tùy biến vốn danh mục lên tới 1.000.000.000 ₫.
       - Không giới hạn lượt chơi Đấu trường FOMO & 12 quý vĩ mô Pro Room.
       - Mở khóa 24/7 Aura AI Studio (Gemini Pro) chuyên sâu.
       - Bóc tách chi tiết tâm lý lệnh từng chu kỳ.
       - Mở khóa 100% Khóa học Academy (bao gồm Chặng 3 phái sinh & phòng hộ).
       - Tặng ngay **+500 XP** & Huy hiệu **VIP Patron vàng** danh giá trên Bảng Xếp Hạng.
  - **Bảng So Sánh Quyền Lợi Chi Tiết**: Ma trận so sánh trực quan 8 chỉ mục đặc quyền giữa 2 gói.

---

## 4. Các Phân Hệ Tiện Ích & Bổ Trợ (Auxiliary Modules)

| Phân hệ / Tính năng | Vị trí / Kích hoạt | Nhiệm vụ chính |
| :--- | :--- | :--- |
| **Trợ Lý AI Aura Coach** | Nút tròn nổi góc phải dưới màn hình (`AiCoachFab`) & `/ai` | Giải đáp thắc mắc tài chính, phản biện ý tưởng đầu tư, phân tích rủi ro danh mục 24/7. |
| **Hồ Sơ Cá Nhân (`/profile`)** | Menu Avatar góc trên bên phải | Cập nhật thông tin nhà đầu tư, trường phái đầu tư, tiến trình danh hiệu và kinh nghiệm XP. |
| **Cài Đặt Tài Khoản (`/account`)** | Menu Avatar góc trên bên phải | Quản lý thông tin đăng nhập, đổi mật khẩu mã hóa Argon2id và các phiên hoạt động. |
| **Bàn Quản Trị Hệ Thống (`/admin`)** | Dành cho `MODERATOR` (kiểm duyệt) & `SYSTEM_ADMIN` (toàn quyền) | Quản lý người dùng, duyệt CCHN Broker, kiểm duyệt nội dung, quản trị phiên giả lập và tra cứu Audit Log. |

---

## 5. Kiến Trúc 5 Vai Trò & Ma Trận Phân Quyền (RBAC & Segregation of Duties)

Để hệ sinh thái Aura Capital (bao gồm cả dịch vụ Broker Hub mới) vận hành chặt chẽ, minh bạch và không bị chồng chéo quyền hạn, hệ thống được phân chia thành **5 Vai trò (Roles)** theo nguyên tắc **Phân tách trách nhiệm (Segregation of Duties - SoD)**:

### 5.1. Định Nghĩa 5 Vai Trò Trong Hệ Sinh Thái

1. **GUEST (Khách vãng lai — Chưa đăng nhập)**:
   - Xem trang chủ, đọc giới thiệu danh mục khóa học, xem bảng tin cộng đồng ở chế độ chỉ đọc (Read-only), và xem danh sách hồ sơ uy tín của các Broker để tham khảo trước khi tạo tài khoản. Không có quyền ghi hoặc tích lũy dữ liệu.
2. **LEARNER (Học viên / Nhà đầu tư F0 — Mặc định sau khi xác thực OTP)**:
   - Học các khóa học trên Aura Academy, thi đấu giả lập tại Map 1 (FOMO Arena) và Map 2 (Pro Room), quản lý danh mục ảo, thảo luận trên Cộng đồng, đăng ký tham gia vào các Phòng tư vấn (Broker Room) và đánh giá (Review) chất lượng Broker.
3. **BROKER (Chuyên gia / Môi giới đã xác thực — Verified Creator)**:
   - Kế thừa toàn bộ quyền của LEARNER, đồng thời được cấp quyền mở và quản trị Phòng Đầu Tư Độc Quyền (Broker Room) của riêng mình trên Broker Hub.
   - Chỉ được đăng khóa học, tài liệu và bài nhận định bên trong phạm vi Room của chính mình (tuyệt đối không được sửa đổi các khóa học gốc trên Aura Academy của hệ thống). Được phép tạo kịch bản thực chiến riêng cho thành viên trong Room.
4. **MODERATOR (Biên tập viên Học thuật & Kiểm duyệt viên Nội dung)**:
   - Chịu trách nhiệm quản lý chất lượng chuyên môn: Soạn thảo và cập nhật các khóa học chính thống trên Aura Academy, xử lý các bài viết/bình luận bị gắn cờ báo cáo trên Cộng đồng, và kiểm duyệt nội dung bài giảng của Broker (chặn hành vi phím hàng rác, cam kết lợi nhuận sai quy định). Được quyền tạm khóa (mute) người dùng vi phạm tối đa 24h.
5. **SYSTEM_ADMIN (Quản trị viên Hệ thống Tối cao)**:
   - Nắm quyền quản trị vận hành, tài khoản, phân quyền vai trò (`LEARNER` ↔ `BROKER` ↔ `MODERATOR`), duyệt hồ sơ chứng chỉ hành nghề UBCKNN để cấp tích xanh cho BROKER, giám sát máy chủ giả lập, quản trị biểu phí gói cước sàn và tra cứu Nhật ký kiểm toán bất biến (Immutable Audit Logs).

---

### 5.2. Ma Trận Phân Quyền Chi Tiết Theo Từng Phân Hệ (RBAC Matrix)

| Nghiệp Vụ / Chức Năng Cụ Thể | GUEST | LEARNER | BROKER | MODERATOR | SYSTEM_ADMIN |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **1. Học Viện Chính Thống (`Aura Academy`)** | | | | | |
| Xem danh mục khóa học & đọc bài mở đầu | ✅ | ✅ | ✅ | ✅ | ✅ |
| Học toàn bộ bài, lật Flashcard, làm Quiz nhận XP | ❌ | ✅ | ✅ | ✅ | ✅ |
| Đăng mới / Chỉnh sửa khóa học gốc của hệ thống | ❌ | ❌ | ❌ | ✅ *(Chính)* | ✅ |
| **2. Phòng Chuyên Gia (`Broker Hub`)** | | | | | |
| Xem Hồ sơ tín nhiệm & Chứng chỉ của Broker | ✅ | ✅ | ✅ | ✅ | ✅ |
| Nộp hồ sơ (Chứng chỉ UBCKNN + eKYC) xin lên Broker | ❌ | ✅ | ➖ | ❌ | ❌ |
| Duyệt hồ sơ & Cấp tích xanh mở quyền BROKER | ❌ | ❌ | ❌ | ❌ | ✅ *(Duy nhất)* |
| Tạo Room riêng, đăng khóa học/nhận định trong Room | ❌ | ❌ | ✅ *(Room mình)* | ❌ | ❌ |
| Mua vé vào Room của Broker & chấm điểm Review | ❌ | ✅ | ✅ | ❌ | ❌ |
| Kiểm duyệt / Gỡ bài giảng Broker vi phạm quy chế | ❌ | ❌ | ❌ | ✅ *(Chính)* | ✅ |
| **3. Đấu Trường Giả Lập (`Map 1 & Map 2`)** | | | | | |
| Tham gia thi đấu Map 1 & mở khóa Map 2 | ❌ | ✅ | ✅ | ✅ | ✅ |
| Tạo kịch bản bài tập thực chiến cho học viên trong Room | ❌ | ❌ | ✅ | ✅ | ✅ |
| Giám sát phiên lỗi & Reset phiên bị treo (`/admin`) | ❌ | ❌ | ❌ | ❌ | ✅ *(Duy nhất)* |
| **4. Diễn Đàn Cộng Đồng (`/community`)** | | | | | |
| Xem bài thảo luận & Bảng xếp hạng | ✅ | ✅ | ✅ | ✅ | ✅ |
| Đăng bài viết, bình luận, thả tim & báo cáo (Report) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Xử lý hàng đợi báo cáo, ẩn bài/bình luận vi phạm | ❌ | ❌ | *(Chỉ trong Room mình)* | ✅ *(Toàn sàn)* | ✅ |
| **5. Quản Lý Tài Khoản & Hệ Thống (`/admin`)** | | | | | |
| Khóa / Mở khóa (Suspend / Activate) người dùng | ❌ | ❌ | ❌ | *(Tạm khóa 24h)* | ✅ *(Toàn quyền)* |
| Thay đổi Role (`LEARNER` ↔ `BROKER` ↔ `MODERATOR`) | ❌ | ❌ | ❌ | ❌ | ✅ *(Duy nhất)* |
| Quản lý gói cước, phí duy trì Room & đối soát doanh thu | ❌ | ❌ | *(Xem doanh thu Room)* | ❌ | ✅ *(Duy nhất)* |
| Xem Nhật ký Kiểm toán bất biến (`Immutable Audit Logs`) | ❌ | ❌ | ❌ | ❌ | ✅ *(Duy nhất)* |

---

## 6. Bốn Nguyên Tắc Logic Cốt Lõi Vận Hành Hệ Thống

1. **Tách Biệt Rạch Ròi 2 Luồng "Đăng Khóa Học"**:
   - **Khóa học tại tab Khóa Học (`/academy`)**: Giáo trình học thuật chuẩn mực của Aura Capital $\rightarrow$ Chỉ có `MODERATOR` và `SYSTEM_ADMIN` mới có quyền tạo/sửa.
   - **Khóa học tại tab Broker Hub (`/broker-hub`)**: Tài liệu, video và chiến lược riêng của từng chuyên gia $\rightarrow$ `BROKER` tự đăng trong Room của mình, chịu sự hậu kiểm của `MODERATOR`.
2. **Quy Trình 2 Chốt Chặn Đối Với BROKER (Chống "Lùa Gà")**:
   - **Chốt chặn 1 (Đầu vào — do `SYSTEM_ADMIN` nắm)**: Người dùng muốn mở Room thu phí bắt buộc phải nộp ảnh chụp Chứng chỉ hành nghề UBCKNN và giấy tờ tùy thân (eKYC). Chỉ khi `SYSTEM_ADMIN` duyệt thì tài khoản mới chuyển từ `LEARNER` sang `BROKER`.
   - **Chốt chặn 2 (Vận hành — do `MODERATOR` nắm)**: Mọi bài đăng, khóa học trong Room nếu bị học viên báo cáo vi phạm hoặc quét thấy từ khóa cam kết lãi 100%, lôi kéo nạp tiền ngoài luồng sẽ lập tức chuyển về tab Kiểm Duyệt của `MODERATOR` để xử lý ẩn bài hoặc đề xuất khóa Room.
3. **Quy Tắc Bảo Vệ Chéo Trong Quản Lý Tài Khoản (Account Governance)**:
   - `SYSTEM_ADMIN` không thể tự khóa (Suspend) hoặc tự hạ quyền của chính mình (chống self-lockout).
   - `MODERATOR` chỉ được quyền ẩn bài viết rác hoặc tạm khóa/cấm ngôn (mute) tài khoản spam tối đa 24 giờ, tuyệt đối không được can thiệp vào số dư danh mục hay phân quyền vai trò hệ thống.
4. **Mọi Thao Tác Quyền Lực Đều Phải Lưu Vết (Audit Log)**:
   - Bất kỳ khi nào `SYSTEM_ADMIN` duyệt một Broker mới, thay đổi trạng thái tài khoản, hoặc `MODERATOR` ẩn bài viết/khóa học, hệ thống tự động ghi 1 dòng bất biến vào bảng `AuditLog` (*Ai làm, làm lúc nào, tài nguyên nào, lý do là gì*).

---

## 7. Nhận Diện Thương Hiệu & Logo Mới (Brand Identity)

- **Biểu tượng Monogram AC**:
  - Chữ **A** (Aura Blue `#1D6FF2`): Biểu trưng cho sự vững chắc, chuẩn mực định chế, độ chính xác và tính bảo mật của nền tảng.
  - Chữ **C** (Capital Growth Green `#22C55E`): Biểu trưng cho tăng trưởng tài sản, alpha thị trường và sự thịnh vượng tài chính bền vững.
  - **Cấu trúc lồng ghép (Interlocking)**: Tạo thành một khối thống nhất, hiện đại, mang tính công nghệ tài chính cao, thay thế hoàn toàn chữ "A" dạng hình tròn cũ.

---

## 8. Tiêu Chuẩn Sản Phẩm Production (Production Standards)

1. **Loại bỏ nhãn thử nghiệm (MVP-free)**:
   - Toàn bộ nhãn `v0.9.0-mvp` được nâng cấp chính thức lên `Phiên bản v1.0.0 · Production`.
   - Các dòng ghi chú đơn giản được chuẩn hóa thành các tuyên bố bảo mật chuẩn tổ chức: *"Môi trường giả lập chuẩn tổ chức · Bảo mật máy chủ đa tầng"*.
2. **Kiểm soát chất lượng**:
   - `100%` TypeScript type-safety (0 compilation error).
   - `154+` bài kiểm thử tự động (Unit & Integration tests) luôn vượt qua `100%`.
   - Kiến trúc responsive mượt mà trên mọi kích thước màn hình từ điện thoại đến màn hình siêu rộng (Ultra-wide).

