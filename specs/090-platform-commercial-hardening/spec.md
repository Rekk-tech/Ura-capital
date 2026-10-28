# Feature Specification: FEAT-090 Platform Commercial Hardening & Production Convergence

**Feature ID**: `FEAT-090`  
**Created**: 2026-10-28  
**Status**: APPROVED  
**Target Delivery**: Commercial Production Readiness  

---

## 1. Executive Summary & Context

Hệ thống Aura Capital hiện đang ở ranh giới giữa Bản thử nghiệm (MVP Demo trên Render) và Bản hoàn thiện sẵn sàng thương mại hóa (Production). Để sẵn sàng thương mại hóa và mở rộng cho cộng đồng nhà đầu tư thật, hệ thống cần giải quyết dứt điểm 4 nhóm vấn đề cốt lõi:
1. **Mã nguồn, Thư mục & Rủi ro Mất dữ liệu**: Dọn sạch rác, tiêu hủy file mật khẩu nhạy cảm, thiết lập quy trình sao lưu `.env` mã hóa an toàn và script tự động cài đặt 1 lệnh trên máy mới.
2. **Xác thực & Bảo mật Tài khoản (Auth & Registration)**: Chống đăng ký tài khoản ảo bằng quy trình xác thực email 2 bước (mã OTP 6 chữ số lưu tạm trong Redis 5 phút, giữ nguyên tắc không sửa Database khi chưa xác thực).
3. **Trải nghiệm Sản phẩm & Giao diện (UI/UX & Simulation)**:
   - *Map 1*: Biểu đồ nến sống động với nhịp micro-tick 1.5s; phòng chat Hype Room tự động đẩy tin; modal bẫy tâm lý to rõ, dễ đọc.
   - *Map 2*: Bịt lỗ hổng lách luật nhảy thẳng vào Map 2 khi chưa qua Map 1; sửa lỗi hiển thị chỉ số tài chính Quý 1 (Alpha 0.00% thay vì hardcode 1.85%).
   - *Dashboard & Header & AI Chat*: Đồng bộ điểm XP thực tế trên thẻ Hồ sơ thực chiến (loại bỏ hardcode 200 XP); tinh giản Header về 1 dòng duy nhất; mở rộng khung chat AI không bị cuộn xám; gỡ bỏ Bảng xếp hạng trùng lặp trên trang Cộng đồng.
4. **Hạ tầng Triển khai Độc lập**: Thay thế gói Render Free (vốn bị xóa DB sau 30 ngày và ngủ đông sau 15 phút) bằng cụm Docker Compose hoàn chỉnh chạy trên VPS độc lập (~100k/tháng) với Caddy tự cấp SSL/HTTPS và dữ liệu lưu vĩnh viễn.

---

## 2. Clarifications (/speckit-clarify)

### Session 2026-10-28

- **Q1: Cơ chế gửi mã OTP 6 chữ số qua Email (Dev vs Prod)?**  
  $\rightarrow$ **A: Option A (Chế độ Kép Tự Động - Dual-Mode)**: Sử dụng SMTP thực tế (Gmail/Resend/SendGrid) khi có biến môi trường SMTP; tự động fallback in mã OTP ra Terminal/Console log khi chạy Local/Dev/Test để không bị nghẽn quy trình lập trình và kiểm thử.
- **Q2: Xử lý người chơi chưa vượt qua Map 1 nhưng cố tình vào Map 2?**  
  $\rightarrow$ **A: Option A (Khóa cứng & Điều hướng kèm thông báo)**: Chặn đứng truy cập trực tiếp vào `/simulation/map-2`, tự động chuyển hướng về `/simulation` và hiển thị thông báo hướng dẫn hoàn thành Map 1; gỡ bỏ nút lách luật trong modal hướng dẫn.
- **Q3: Bố cục Header, Khung Chat AI và Cột bên phải trang Cộng đồng?**  
  $\rightarrow$ **A: Option A (Tinh giản toàn diện theo chuẩn Enterprise UX)**: Header 1 dòng duy nhất (truy cập AI qua nút nổi `AiCoachFab` + phím tắt `Alt + A`); khung chat AI mở rộng 460px với các chip gợi ý tự xuống dòng không có thanh cuộn xám; trang Cộng đồng thay thế Bảng xếp hạng trùng lặp bằng widget "Chủ Đề Thảo Luận Sôi Nổi & Quy Tắc Diễn Đàn".
- **Q4: Mô hình dịch vụ Docker Compose trên VPS độc lập?**  
  $\rightarrow$ **A: Option A (Cụm Docker trọn gói + Caddy SSL tự động)**: Chạy Postgres 16 (volume đĩa cứng vĩnh viễn), Redis 7, Backend API, Frontend Web và Caddy Reverse Proxy tự cấp phát SSL Let's Encrypt trên cùng 1 VPS, chi phí ~100k/tháng, uptime 24/7 vĩnh viễn, kèm script backup tự động hàng ngày `scripts/backup-db.sh`.
- **Q5: Quy trình quản lý bảo mật file `.env` và chuyển máy tính mới?**  
  $\rightarrow$ **A: Option A (Dọn rác triệt để + Vault Script mã hóa cá nhân)**: Tiêu hủy ngay `accoun_admin.txt` và các file tạm; cập nhật `.env.example` đầy đủ; cung cấp script `scripts/export-secrets.ps1` (mã hóa AES-256) và `scripts/setup-machine.ps1` (khôi phục và cài đặt 1 lệnh trên máy mới).

---

## 3. Functional Requirements (FR)

### Nhóm 1: Mã nguồn, Thư mục & Bảo Mật Secrets
- **FR-001**: Hệ thống MUST xóa bỏ hoàn toàn file nhạy cảm `accoun_admin.txt` và các file tạm `.tmp/`, `tmp/`, `scratch/`, `ci_job_...log`, `test.log`.
- **FR-002**: Hệ thống MUST cập nhật file `.gitignore` để đảm bảo không có file log, file tài khoản hay file credential nào vô tình bị đẩy lên Git.
- **FR-003**: Hệ thống MUST cập nhật `.env.example` đầy đủ 100% tất cả các biến môi trường thực tế (database, redis, jwt, auth, smtp, cors, gemini).
- **FR-004**: Cung cấp bộ công cụ sao lưu và cài đặt máy mới:
  - `scripts/export-secrets.ps1` (và `.sh`): Mã hóa file `.env` thành `.env.vault` với mật khẩu cá nhân.
  - `scripts/setup-machine.ps1` (và `.sh`): Giải mã `.env` và tự động cài đặt toàn bộ môi trường (npm install, prisma generate, migration, seed) chỉ với 1 lệnh duy nhất.

### Nhóm 2: Xác Thực & Chống Tài Khoản Ảo (2-Step Registration with OTP)
- **FR-005 (Yêu cầu mã OTP)**: Bổ sung endpoint `POST /api/auth/register/request-otp` nhận `{ email, password, displayName }`.
  - Validate email format và mật khẩu theo chính sách bảo mật (Argon2id policy).
  - Kiểm tra email đã tồn tại trong database hay chưa; nếu đã có thì trả về lỗi 409 Conflict.
  - Sinh mã OTP 6 chữ số ngẫu nhiên có độ entropy cao (`crypto.randomInt(100000, 999999)`).
  - Lưu mã OTP cùng thông tin đăng ký (hoặc hash mật khẩu) tạm thời vào Redis với key `auth:otp:register:<normalizedEmail>` và TTL chính xác **300 giây (5 phút)**.
  - Tuyệt đối KHÔNG ghi bất kỳ bản ghi nào vào PostgreSQL ở bước này (nguyên tắc Zero DB Pollution).
  - Gửi email chứa OTP qua SMTP service (nếu có cấu hình SMTP) hoặc in ra Console/Logger ở môi trường Local/Dev.
- **FR-006 (Xác thực OTP & Hoàn tất Đăng Ký)**: Bổ sung endpoint `POST /api/auth/register/verify-otp` nhận `{ email, otp }`.
  - Đọc dữ liệu từ Redis theo key `auth:otp:register:<normalizedEmail>`. Nếu không có hoặc hết hạn, trả về lỗi 400 Bad Request ("Mã OTP không hợp lệ hoặc đã hết hạn").
  - Nếu mã OTP khớp: Mở database transaction runner, tạo mới bản ghi User + Credential + Audit Log thành công, xóa key OTP khỏi Redis, và phát hành Access/Refresh Token trả về cho client.
- **FR-007 (Frontend OTP Form)**: Giao diện Đăng ký (`RegisterPage.tsx`) chuyển đổi mượt mà sang bước 2: nhập mã 6 số (6 ô input riêng biệt hoặc 1 ô định dạng số to rõ, có đồng hồ đếm ngược 5:00 và nút "Gửi lại mã").

### Nhóm 3: Trải Nghiệm Sản Phẩm & Giao Diện (UI/UX & Simulation)
- **FR-008 (Map 1 Live Ticking)**: Nâng cấp `FomoPriceChart.tsx` với hiệu ứng micro-tick sống động:
  - Cập nhật râu nến và thân nến của nến đang chạy theo chu kỳ 1.5 giây.
  - Hiển thị đường gióng giá hiện tại kèm hiệu ứng nhấp nháy xanh/đỏ theo nhịp khớp lệnh thị trường.
- **FR-009 (Map 1 Hype Room & Trap Quiz)**:
  - Khắc phục `FomoNewsFeed.tsx` để tin nhắn tự động bắn mới liên tục theo chu kỳ 3–6s, không bị đứng im khi nhận props.
  - Nâng cấp `FomoTrapQuizModal.tsx`: Tăng kích thước modal (`max-w-2xl`), tăng kích thước chữ, hiển thị phím tắt `1, 2, 3` / `A, B, C` nổi bật, phân chia rõ ràng câu hỏi bẫy tâm lý và giải thích cơ chế hành vi.
- **FR-010 (Map 2 Access Protection)**:
  - Xây dựng Route Guard và logic chặn cứng tại `ProRoomPage.tsx` và `MapSelectionView.tsx`: Chỉ cho phép người dùng đã hoàn thành Map 1 (hoặc tài khoản VIP/Broker) truy cập Map 2.
  - Gỡ bỏ hoàn toàn nút kích hoạt vào thẳng Map 2 trong modal hướng dẫn `briefingMap === "map2-pro"`.
  - Hiển thị thông báo hướng dẫn thân thiện khi người chơi chưa đủ điều kiện cố tình truy cập.
- **FR-011 (Map 2 Financial Indicators)**: Sửa logic tính toán và hiển thị tại Quý 1 trong `ProRoomPage.tsx` và `ProMacroTopRibbon.tsx`: Khi mới bắt đầu Quý 1 (chưa có quyết định đầu tư và chưa kết thúc quý), Alpha hiển thị `0.00%` (hoặc `--`) và trạng thái hiển thị `Đang chờ phân bổ Quý 1` thay vì hardcode 1.85% và Top 5% Cohort.
- **FR-012 (Dashboard Profile Card)**:
  - Loại bỏ hoàn toàn số liệu hardcode `200 / 500 XP (40%)` trong `DashboardHeader.tsx`. Đồng bộ 100% từ `gamificationState.xp` và `gamificationState.nextLevelXp`.
  - Tinh chỉnh CSS loại bỏ viền gradient nhân tạo thô cứng, sắp xếp layout linh hoạt không bị đè chữ ở độ phân giải nhỏ.
- **FR-013 (Header & AI Chat & Community Sidebar)**:
  - Tinh giản `AppHeader.tsx`: Giữ 8 tab cốt lõi trên 1 dòng duy nhất, truy cập AI qua nút nổi `AiCoachFab` + phím tắt `Alt + A`.
  - Mở rộng khung chat `AiCoachModal.tsx` lên 460px, các chip gợi ý tự xuống dòng không xuất hiện thanh cuộn ngang màu xám.
  - Trên `CommunityFeedPage.tsx`, thay thế `SimulationLeaderboard` bằng widget `TrendingTopicsWidget` ("Chủ Đề Thảo Luận Nóng").

### Nhóm 4: Hạ Tầng Triển Khai Độc Lập (VPS Docker Compose 24/7)
- **FR-014 (Production Docker Stack)**: Xây dựng file `docker-compose.prod.yml` gồm 4 service:
  - `postgres`: PostgreSQL 16 Alpine với volume mount cố định `postgres_prod_data`, lưu trữ vĩnh viễn.
  - `redis`: Redis 7 Alpine với volume `redis_prod_data`.
  - `api`: Node.js 20 production container, tự động chạy `prisma migrate deploy` khi khởi động.
  - `caddy`: Reverse proxy tự động cấp phát và gia hạn SSL Let's Encrypt, phân phối Frontend React tĩnh và proxy `/api/*` về backend API.
- **FR-015 (Automated Backup & Restore)**: Tạo script `scripts/backup-db.sh` xuất dữ liệu `pg_dump` nén gzip hàng ngày vào thư mục `/backups` trên máy chủ VPS.
- **FR-016 (Deployment Guide)**: Soạn thảo cẩm nang triển khai `docs/vps-deployment-guide.md` hướng dẫn từng bước từ khi mua VPS (~100k/tháng) đến khi trỏ domain và khởi chạy hệ thống 24/7.

---

## 4. Success Criteria (SC)

- **SC-001**: Workspace sạch 100%, không còn file nhạy cảm `accoun_admin.txt` hay log tạm; Git status hoàn toàn sạch sẽ.
- **SC-002**: 100% tài khoản đăng ký mới phải xác thực qua mã OTP 6 số gửi về email (hoặc in log trong dev); không có tài khoản rác trong cơ sở dữ liệu.
- **SC-003**: Người dùng chưa vượt qua Map 1 không thể truy cập Map 2 dưới bất kỳ hình thức nào.
- **SC-004**: Quý 1 của Map 2 hiển thị trung thực Alpha 0.00% và trạng thái chờ dữ liệu.
- **SC-005**: Header hiển thị chuẩn 1 dòng trên tất cả màn hình laptop $\ge 1024\text{px}$; Khung chat AI mở rộng không bị thanh cuộn ngang xám.
- **SC-006**: Toàn bộ unit tests và typecheck vượt qua với 0 lỗi (`npm test` và `tsc --noEmit` exit 0).
- **SC-007**: Hệ thống sẵn sàng khởi chạy trên bất kỳ máy chủ VPS nào chỉ bằng 1 lệnh `docker compose -f docker-compose.prod.yml up -d` với HTTPS tự động.

