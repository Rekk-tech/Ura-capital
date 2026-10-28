# Tasks: FEAT-090 Platform Commercial Hardening & Production Convergence

**Feature**: FEAT-090  
**Status**: IMPLEMENTED (100% COMPLETE - 24/24 TASKS VERIFIED)  

---

## Phase 1: Workspace Hygiene & Disaster Recovery Tools (F1, F2, FR-001..FR-004)
- [x] T001 Xóa vĩnh viễn file nhạy cảm `accoun_admin.txt` và dọn sạch các thư mục tạm rác `.tmp/`, `tmp/`, `scratch/`, `ci_job_*.log`, `test.log` per F1, FR-001
- [x] T002 Cập nhật file `.gitignore` bổ sung các mẫu chặn an toàn cho file mật khẩu, file log và vault backup per FR-002
- [x] T003 Cập nhật file `.env.example` đầy đủ 100% tất cả các biến môi trường cấu hình thực tế per FR-003
- [x] T004 Xây dựng bộ công cụ sao lưu bí mật `.env` mã hóa AES-256 (`scripts/export-secrets.ps1`, `scripts/export-secrets.sh`) per F2, FR-004
- [x] T005 Xây dựng script cài đặt môi trường tự động 1 lệnh cho máy tính mới (`scripts/setup-machine.ps1`, `scripts/setup-machine.sh`) per F2, FR-004

## Phase 2: 2-Step OTP Authentication Flow (F3, FR-005..FR-007)
- [x] T006 Xây dựng email service cơ chế kép (`apps/api/src/infrastructure/email/email.service.ts`) hỗ trợ SMTP thực tế và console logger fallback per FR-005, Clarification Q1
- [x] T007 Xây dựng OTP service với Redis 5-phút TTL (`apps/api/src/modules/auth/otp.service.ts`) đảm bảo không tạo user rác vào PostgreSQL per F3, FR-005
- [x] T008 Triển khai endpoint `POST /api/auth/register/request-otp` và `POST /api/auth/register/verify-otp` trong `registration.controller.ts` & `registration.route.ts` per FR-005, FR-006
- [x] T009 Cập nhật giao diện Đăng ký (`RegisterPage.tsx`) hỗ trợ bước 2 nhập OTP 6 số với đồng hồ đếm ngược và nút gửi lại mã per FR-007
- [x] T010 Viết unit tests kiểm thử luồng đăng ký 2 bước OTP và xử lý mã hết hạn trong `apps/api/tests/unit/registration-otp.test.ts` per FR-005, FR-006

## Phase 3: Simulation Game Polish & Map 2 Access Protection (F4..F7, FR-008..FR-011)
- [x] T011 Nâng cấp biểu đồ nến `FomoPriceChart.tsx` với nhịp micro-tick 1.5s sống động, hiệu ứng co giãn râu nến và nhấp nháy giá thị trường per F4, FR-008
- [x] T012 Khắc phục message streaming engine trong `FomoNewsFeed.tsx` để tin nhắn tự động bắn mới liên tục và mượt mà per F5, FR-009
- [x] T013 Nâng cấp giao diện modal câu hỏi bẫy tâm lý `FomoTrapQuizModal.tsx` với kích thước lớn, chữ to rõ, phím tắt A/B/C và 1/2/3 nổi bật per F5, FR-009
- [x] T014 Xây dựng route guard và điều kiện kiểm tra hoàn thành Map 1 tại `ProRoomPage.tsx` và `MapSelectionView.tsx`, gỡ bỏ nút lách luật trong modal hướng dẫn per F6, FR-010, Clarification Q2
- [x] T015 Sửa logic tính toán và hiển thị chỉ số tài chính Quý 1 trong `ProRoomPage.tsx` và `ProMacroTopRibbon.tsx` (Alpha 0.00% và trạng thái chờ dữ liệu) per F7, FR-011

## Phase 4: Dashboard Overview & UI/UX Streamlining (F8, F9, FR-012..FR-013)
- [x] T016 Đồng bộ điểm XP động và cấp độ thực tế trong thẻ Hồ sơ thực chiến `DashboardHeader.tsx`, loại bỏ số liệu hardcode 200/500 XP per F8, FR-012
- [x] T017 Tinh giản thanh điều hướng `AppHeader.tsx` về 1 dòng duy nhất, gom nút AI vào widget nổi `AiCoachFab` với phím tắt `Alt + A` per F9, FR-013, Clarification Q3
- [x] T018 Mở rộng khung chat AI `AiCoachModal.tsx` lên 460px và xử lý các chip gợi ý tự xuống dòng không tạo thanh cuộn ngang màu xám per F9, FR-013, Clarification Q3
- [x] T019 Thay thế Bảng xếp hạng trùng lặp trên trang `CommunityFeedPage.tsx` bằng widget Chủ đề thảo luận sôi nổi per F9, FR-013, Clarification Q3

## Phase 5: Production VPS Docker Stack & Deployment Tools (F10, FR-014..FR-016)
- [x] T020 Xây dựng cấu hình `docker-compose.prod.yml` hoàn chỉnh tích hợp Postgres 16 (volume vĩnh viễn), Redis 7, Backend API, Web tĩnh và Caddy Reverse Proxy tự cấp SSL per F10, FR-014, Clarification Q4
- [x] T021 Xây dựng cấu hình Caddyfile hỗ trợ tự động gia hạn chứng chỉ HTTPS Let's Encrypt và proxy `/api/*` per FR-014
- [x] T022 Xây dựng script sao lưu cơ sở dữ liệu hàng ngày `scripts/backup-db.sh` per FR-015
- [x] T023 Soạn thảo tài liệu hướng dẫn triển khai VPS độc lập `docs/vps-deployment-guide.md` chi phí tối ưu ~100k/tháng per FR-016
- [x] T024 Chạy toàn bộ kiểm thử TypeScript và Unit test đảm bảo 0 regression per SC-006

