# Implementation Plan: FEAT-090 Platform Commercial Hardening & Production Convergence

**Feature ID**: `FEAT-090`  
**Status**: APPROVED  
**Estimated Phases**: 5 Phases  

---

## 1. Technical Decisions & Architecture

### 1.1 Workspace Hygiene & Disaster Recovery
- File `accoun_admin.txt` bị xóa vĩnh viễn khỏi repository.
- Các thư mục tạm `.tmp/`, `tmp/`, `scratch/`, `ci_job_*.log`, `test.log` được xóa sạch.
- File `.gitignore` được bổ sung các mẫu chặn triệt để (`*.log`, `accoun_*.txt`, `.env.vault`).
- Cung cấp script PowerShell & Bash `scripts/export-secrets.ps1` dùng thuật toán mã hóa khóa cá nhân AES-256 để nén file `.env` thành `.env.vault` an toàn.
- Cung cấp script `scripts/setup-machine.ps1` giải mã và cài đặt dự án chỉ với 1 lệnh khi sang máy mới.

### 1.2 Two-Step OTP Authentication with Redis Temporary Storage
- **Architecture**:
  ```
  User Request Registration -> POST /api/auth/register/request-otp
    |-> Validate policy & check unique email
    |-> Generate crypto 6-digit OTP
    |-> SETEX auth:otp:register:<email> 300 JSON(data) in Redis (Zero DB writes!)
    |-> Send Email via SMTP (or Console log fallback in Dev)
  
  User Submits OTP -> POST /api/auth/register/verify-otp
    |-> GET auth:otp:register:<email> from Redis
    |-> Verify OTP match & expiry
    |-> TxRunner: create User + Credential + AuditRecord in PostgreSQL
    |-> DEL auth:otp:register:<email>
    |-> Issue JWT Access/Refresh tokens
  ```
- **Service Layer**:
  - `apps/api/src/infrastructure/email/email.service.ts`: Xử lý gửi thư qua `nodemailer` với SMTP hoặc console logger.
  - `apps/api/src/modules/auth/otp.service.ts`: Quản lý sinh mã OTP, lưu tạm và kiểm tra mã trong Redis.
  - Cập nhật `registration.controller.ts`, `registration.route.ts`, và `RegisterPage.tsx`.

### 1.3 Simulation Arena & UI/UX Polish
- **Map 1 (FOMO Arena)**:
  - `FomoPriceChart.tsx`: Bổ sung state micro-tick biến thiên râu nến và nhấp nháy giá hiện tại mỗi 1.5s.
  - `FomoNewsFeed.tsx`: Chuẩn hóa message streaming engine chạy độc lập và ổn định.
  - `FomoTrapQuizModal.tsx`: Mở rộng kích thước dialog, cỡ chữ to rõ, phím tắt A/B/C và 1/2/3 nổi bật.
- **Map 2 (Pro Room)**:
  - `MapSelectionView.tsx`: Gỡ bỏ nút vào Map 2 trong modal hướng dẫn nếu chưa hoàn thành Map 1; kiểm tra `canPlayMap2` và trạng thái `MAP1_COMPLETED`.
  - `ProRoomPage.tsx`: Bổ sung kiểm tra điều kiện truy cập, điều hướng về `/simulation` nếu chưa mở khóa.
  - Sửa logic Quý 1: `alpha = 0.00` và hiển thị `Đang chờ phân bổ Quý 1`.
- **Dashboard & Header & AI Chat**:
  - `DashboardHeader.tsx`: Kết nối động `gamificationState.xp` và `gamificationState.nextLevelXp`, xóa hardcode 200/500 XP.
  - `AppHeader.tsx`: Giữ 8 tab cốt lõi, loại bỏ tab `/ai` khỏi navigation bar; điều hướng AI thông qua nút nổi `AiCoachFab` và phím tắt `Alt + A`.
  - `AiCoachModal.tsx`: Điều chỉnh CSS `.ai-coach-dialog-docked` lên chiều rộng 460px; chip gợi ý wrap tự nhiên không cuộn ngang.
  - `CommunityFeedPage.tsx`: Thay thế widget Leaderboard bằng `TrendingTopicsWidget`.

### 1.4 Production VPS Docker Compose Stack
- File `docker-compose.prod.yml`:
  - `postgres`: Image `postgres:16-alpine`, volume `postgres_prod_data:/var/lib/postgresql/data`.
  - `redis`: Image `redis:7-alpine`, volume `redis_prod_data:/data`.
  - `api`: Multi-stage Dockerfile chạy production build của `@aura/api`.
  - `caddy`: Image `caddy:alpine`, volume `caddy_data` và `caddy_config`, tự động cấp phát SSL qua Let's Encrypt và reverse proxy đến API và static Web.
- File `scripts/backup-db.sh`: Script cronjob tự động sao lưu Postgres hàng ngày.

### 1.5 Strict Email OTP Verification & Zero-Mock Architecture (FEAT-090-OTP-STRICT)
- **Elimination of Mock Codes**:
  - Xóa bỏ hoàn toàn mã demo `123456` và `999999` khỏi `otp.service.ts`.
  - Mọi yêu cầu xác minh OTP phải khớp 100% với mã số ngẫu nhiên lưu trong Redis (`parsed.otp === trimmedOtp`).
  - Gỡ bỏ hoàn toàn dòng chữ gợi ý mã demo `123456` khỏi giao diện `RegisterPage.tsx`.
- **Cloud-Resilient SMTP Transport**:
  - Cấu hình Nodemailer Transport với `pool: true`, `maxConnections: 3`, `maxMessages: 100` để duy trì kết nối SSL/TLS sẵn sàng, giảm độ trễ gửi email.
  - Tăng timeout gửi thư lên chuẩn điện toán đám mây (`connectionTimeout: 10000`, `greetingTimeout: 10000`, `socketTimeout: 15000`) nhằm loại bỏ triệt để lỗi timeout sớm trên Render.
  - Chuẩn hóa việc đọc biến môi trường SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) loại trừ khoảng trắng hoặc dấu nháy thừa.
  - Áp dụng nguyên tắc **Fail-Closed**: Trong môi trường có cấu hình SMTP thực tế, nếu gửi email thất bại, hệ thống lập tức xóa bản ghi tạm trong Redis và trả về HTTP 503 thông báo lỗi cụ thể cho người dùng, tuyệt đối không tạo trạng thái thành công ảo.
- **Render Cloud Blueprint Alignment**:
  - Khai báo các biến `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` với thuộc tính `sync: false` trong `render.yaml` để Blueprint quản lý đồng bộ mà không ghi đè credential.

---

## 2. Phased Rollout Plan

- **Phase 1**: Workspace Cleanup, Secret Vault Script & Machine Setup
- **Phase 2**: 2-Step OTP Authentication Flow (Backend & Frontend)
- **Phase 3**: Simulation Game Polish (Map 1 Live Ticks, Hype Room, Trap Modal, Map 2 Access Guard & Q1 Alpha)
- **Phase 4**: Overview Dashboard, Header & Community Sidebar Polish
- **Phase 5**: VPS Docker Compose Orchestration, Automated Backup & Documentation
- **Phase 6**: Render Cloud Production Convergence & Registration Reliability
- **Phase 7**: Strict Email OTP Verification & Zero-Mock Enforcement (FEAT-090-OTP-STRICT)

