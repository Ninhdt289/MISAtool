# Nghiên cứu tính khả thi - Chrome Extension hỗ trợ HR đặt lịch phỏng vấn

> Ngày nghiên cứu: 03/04/2026

---

## 1. Bối cảnh & Vấn đề

Khi đặt lịch phỏng vấn, HR phải thao tác trên cả MISA AMIS Tuyển dụng lẫn Google Calendar:

- **MISA**: Có các mẫu email chuyên nghiệp (thư mời phỏng vấn, thông báo lịch thi tuyển...) gửi đến ứng viên + hội đồng phỏng vấn
- **Google Calendar**: Quản lý lịch và phòng họp (Room Resources) của công ty
- **Vấn đề**: HR phải book 2 lần, tốn thời gian, và không có cách kiểm tra phòng trùng lịch trước khi gửi email trên MISA

---

## 2. Khảo sát API MISA AMIS Tuyển dụng

| Phát hiện | Chi tiết |
|---|---|
| API cho lịch phỏng vấn | **Không có** - API tập trung vào kéo hồ sơ ứng viên từ Vietnamworks, TopCV |
| Tính năng đặt lịch | Có sẵn trên web, tự gửi email mẫu cho ứng viên + hội đồng |
| Tích hợp Google Calendar | **Không có** |

→ Không thể tích hợp trực tiếp qua API. Cần cách tiếp cận khác.

---

## 3. Giải pháp: Chrome Extension chạy trên trang MISA

### Flow hoạt động

```
HR điền form đặt lịch phỏng vấn trên MISA (chọn phòng, giờ, người PV)
        ↓
Extension inject thêm nút "Check & Book Calendar" trên trang MISA
        ↓
HR bấm nút → Extension đọc DOM (phòng, giờ, người PV)
        ↓
Check Google Calendar freebusy API
        ↓
  Phòng trùng → Cảnh báo: "⚠ Phòng 301 đã có người book lúc 14h-15h"
               → HR đổi phòng/giờ, bấm check lại
  Phòng trống → Book luôn Google Calendar (tạo event + reserve phòng)
               → Hiện xác nhận: "✓ Đã book phòng 301, 14h-15h"
        ↓
HR bấm submit trên MISA → MISA gửi email mẫu đến ứng viên + hội đồng
```

### Tại sao Google Calendar trước, MISA gửi mail sau

- **Đảm bảo phòng trống trước khi gửi email** → không bao giờ gửi mail sai phòng
- **HR chỉ thao tác trên MISA** → không thay đổi quy trình, chỉ thêm 1 bước bấm nút
- **MISA vẫn gửi email đúng mẫu** → giữ nguyên nội dung chuyên nghiệp
- **Nút "Check & Book" đóng vai trò gatekeeper** → HR không thể submit MISA khi chưa confirm phòng

### Đánh giá

| Tiêu chí | Đánh giá |
|---|---|
| Khả thi kỹ thuật | **8/10** |
| Giá trị mang lại | **Cao** - giải quyết cả 2 vấn đề (book 2 lần + trùng phòng) |
| Thời gian MVP | 1-2 tuần |
| Thay đổi quy trình HR | Không |
| Chi phí | Thấp (Google Calendar API miễn phí) |

---

## 4. Quyền cần xin

### Chrome Extension Permissions

```json
{
  "permissions": [
    "activeTab"
  ],
  "host_permissions": [
    "https://*.misa.vn/*",
    "https://www.googleapis.com/*"
  ]
}
```

- `activeTab`: Đọc DOM trang MISA đang mở (phòng, giờ, ngày)
- `host_permissions`: Gọi được tới MISA web và Google Calendar API

### Google Workspace (cần xin IT/Admin)

| Quyền | Ai cấp | Mục đích |
|---|---|---|
| Google Calendar API (`calendar.events`, `calendar.freebusy`) | Google Cloud Console | Đọc lịch phòng, tạo event |
| Truy cập Room Resources | **Google Workspace Admin** | Extension thấy được danh sách phòng họp |
| OAuth consent (internal app) | **Google Workspace Admin** | Cho phép extension đăng nhập bằng tài khoản công ty |

### MISA

**Không cần xin quyền gì.** Extension chỉ đọc DOM trên trình duyệt của HR, không gọi API MISA.

### Điều kiện tiên quyết

Công ty phải đã setup **Room Resources trên Google Workspace** (các phòng họp đã được tạo thành calendar resource). Nếu chưa có thì Admin cần vào Admin Console > Buildings & Resources > thêm phòng. Không tốn phí.

---

## 5. Bước tiếp theo

1. Xác nhận với IT/Admin: công ty đã có Room Resources trên Google Workspace chưa
2. Xin Admin approve OAuth app (internal) cho Chrome Extension
3. Khảo sát chi tiết cấu trúc DOM trang "Đặt lịch phỏng vấn" trên MISA web
4. Làm prototype để HR review trước khi code

---

## Nguồn tham khảo

- [AMIS Tuyển dụng - Đặt lịch phỏng vấn](https://helpamis.misa.vn/amis-tuyen-dung/kb/dat-lich-thi-tuyen-phong-van/)
- [Tài liệu tích hợp AMIS Tuyển dụng (PDF)](https://helpamis.misa.vn/amis-tuyen-dung/wp-content/uploads/2020/03/Tai-lieu-huong-dan-tich-hop-voi-AMIS-Tuyen-dung.pdf)
- [Theo dõi và quản lý lịch phỏng vấn](https://helpamis.misa.vn/amis-tuyen-dung/kb/theo-doi-va-quan-ly-toan-bo-lich-phong-van/)