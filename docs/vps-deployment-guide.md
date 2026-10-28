# HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG AURA CAPITAL TRÊN MÁY CHỦ VPS ĐỘC LẬP
**Chi phí tối ưu: ~100.000 – 120.000 VNĐ/tháng • Hoạt động 24/7 • Dữ liệu lưu vĩnh viễn**

---

## 1. TẠI SAO CẦN CHUYỂN TỪ RENDER FREE SANG VPS?

| Tiêu chí | Render Free Tier (MVP) | VPS Độc Lập Docker Compose (Production) |
| :--- | :--- | :--- |
| **Cơ sở dữ liệu (PostgreSQL)** | Tự động **xóa sạch toàn bộ data sau 30 ngày** | Dữ liệu lưu trữ **vĩnh viễn** trên ổ cứng SSD/NVMe |
| **Độ trễ truy cập (Cold-start)** | Ngủ đông sau 15 phút. Người truy cập phải chờ **50 - 90 giây** | **Thức 24/7**. Phản hồi API dưới **20ms** |
| **Bộ nhớ đệm (Redis)** | Không có hoặc giới hạn gắt gao | Redis 7 chạy nội bộ, OTP 5 phút mượt mà |
| **SSL / HTTPS** | Phụ thuộc proxy bên ngoài | **Caddy Server tự động cấp chứng chỉ Let's Encrypt** |
| **Chi phí** | Miễn phí (nhưng rủi ro mất trắng dữ liệu) | **~100.000 – 130.000 VNĐ/tháng** |

---

## 2. LỰA CHỌN NHÀ CUNG CẤP VPS ĐỀ XUẤT

Bạn có thể đăng ký gói Cloud VPS thấp nhất (1 vCPU, 2GB RAM, 25-30GB NVMe SSD):
1. **Trong nước (Tốc độ tối ưu cho người dùng Việt Nam):**
   - **Vietnix** (Gói VPS Giá Rẻ / Cloud VPS: ~100k - 120k/tháng).
   - **TinoHost** (Gói Cloud VPS A: ~110k/tháng).
   - **AZDIGI** (Gói Pro VPS 1: ~120k/tháng).
2. **Quốc tế (Cấu hình cao, ổn định toàn cầu):**
   - **Hetzner Cloud** (Gói CAX11 / CX22: ~3.5 - 4 EUR/tháng).

*Hệ điều hành khuyến nghị: **Ubuntu 22.04 LTS** hoặc **Ubuntu 24.04 LTS**.*

---

## 3. CÁC BƯỚC THIẾT LẬP MÁY CHỦ MỚI (TỪ ĐẦU)

### Bước 3.1: Đăng nhập SSH vào máy chủ
```bash
ssh root@<IP_MÁY_CHỦ_CỦA_BẠN>
```

### Bước 3.2: Cập nhật hệ thống & Cài đặt Docker & Git
Chạy các lệnh sau:
```bash
# Cập nhật repository
apt update && apt upgrade -y

# Cài đặt các gói công cụ cần thiết
apt install -y git curl wget ufw openssl

# Cài đặt Docker & Docker Compose plugin chính thức
curl -fsSL https://get.docker.com | sh

# Kiểm tra phiên bản
docker --version
docker compose version
```

### Bước 3.3: Mở tường lửa (Firewall)
Chỉ mở các cổng cần thiết cho web và SSH:
```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable
```

---

## 4. CLONE MÃ NGUỒN & KHÔI PHỤC BIẾN MÔI TRƯỜNG (.ENV)

### Bước 4.1: Clone mã nguồn từ GitHub
```bash
git clone https://github.com/<your-username>/ura-capital.git /opt/aura-capital
cd /opt/aura-capital
```

### Bước 4.2: Khôi phục file cấu hình bí mật (.env)
Nếu bạn đã xuất kho bí mật mã hóa bằng script `scripts/export-secrets.ps1` ở máy cũ, bạn chỉ cần mang file `.env.vault` lên máy chủ và giải mã:
```bash
chmod +x scripts/*.sh
./scripts/setup-machine.sh
```
Nhập mật khẩu mã hóa vault của bạn. File `.env` chứa toàn bộ JWT Secret, mật khẩu DB, khóa Redis và cấu hình SMTP sẽ được khôi phục nguyên vẹn 100%!

*Nếu thiết lập thủ công, bạn copy từ `.env.example`:*
```bash
cp .env.example .env
nano .env
```
Cấu hình các thông số chính:
```ini
DOMAIN=auracapital.vn          # Tên miền của bạn (hoặc IP nếu chưa trỏ domain)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=MatKhauBaoMatDbCuaBan123!
POSTGRES_DB=aura_capital_prod
JWT_SECRET=ChuoiKhoaBaoMatCucKyDaiVaNgauNhienDungDeKyTokenJwt987654321
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=aura.notification@gmail.com
SMTP_PASS=mat_khau_ung_dung_app_password
EMAIL_FROM="Aura Capital <noreply@auracapital.vn>"
```

---

## 5. KHỞI CHẠY HỆ THỐNG VỚI DOCKER COMPOSE

Chạy lệnh build và khởi động toàn bộ stack 4 dịch vụ (Postgres, Redis, API Express, Web React + Caddy):
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Kiểm tra trạng thái các container:
```bash
docker compose -f docker-compose.prod.yml ps
```
Kết quả hiển thị:
```text
NAME                 IMAGE               COMMAND                  SERVICE      STATUS
aura-postgres-prod   postgres:16-alpine  "docker-entrypoint.s…"   postgres     Up (healthy)
aura-redis-prod      redis:7-alpine      "docker-entrypoint.s…"   redis        Up (healthy)
aura-api-prod        aura-capital-api    "sh -c 'npx prisma m…"   api          Up (healthy)
aura-caddy-prod      caddy:2-alpine      "caddy run --config …"   caddy        Up
```

Xem log hoạt động của API:
```bash
docker compose -f docker-compose.prod.yml logs -f api
```

---

## 6. THIẾT LẬP TỰ ĐỘNG SAO LƯU DATABASE HÀNG NGÀY (CRON JOB)

Để phòng tránh mọi rủi ro phần cứng máy chủ, hệ thống đi kèm script tự động nén và backup database mỗi đêm:

### Bước 6.1: Phân quyền thực thi cho script
```bash
chmod +x /opt/aura-capital/scripts/backup-db.sh
```

### Bước 6.2: Tạo thư mục lưu backup
```bash
mkdir -p /var/backups/aura-capital
```

### Bước 6.3: Đăng ký lịch chạy lúc 2:00 sáng mỗi ngày
Mở trình chỉnh sửa crontab:
```bash
crontab -e
```
Thêm dòng sau vào cuối file:
```cron
0 2 * * * cd /opt/aura-capital && ./scripts/backup-db.sh >> /var/log/aura-backup.log 2>&1
```
*Script sẽ tự động nén `gzip`, lưu bản ghi kèm thời gian và tự động dọn dẹp các bản backup cũ hơn 14 ngày để không làm đầy ổ đĩa.*

---

## 7. QUY TRÌNH CẬP NHẬT PHIÊN BẢN MỚI (CI/CD BẰNG TAY)

Khi bạn push code mới lên GitHub, để cập nhật lên máy chủ VPS chỉ cần 3 lệnh:
```bash
cd /opt/aura-capital
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```
Caddy và API sẽ tự động reload mà người dùng không bị gián đoạn phiên (Zero-Downtime Reload).

---

## 8. LỆNH BẢO TRÌ & XỬ LÝ SỰ CỐ NHANH

- **Khởi động lại toàn bộ hệ thống:**
  ```bash
  docker compose -f docker-compose.prod.yml restart
  ```
- **Xem dung lượng ổ cứng:**
  ```bash
  df -h
  docker system df
  ```
- **Dọn dẹp các image cũ để giải phóng dung lượng:**
  ```bash
  docker image prune -f
  ```
- **Khôi phục database từ file backup:**
  ```bash
  gunzip -c /var/backups/aura-capital/aura_db_backup_20261028_020000.sql.gz | docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres aura_capital_prod
  ```

