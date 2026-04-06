# MISA Calendar Integration Extension

Chrome Extension để tích hợp MISA AMIS Tuyển dụng với Google Calendar.

## Cài đặt

1. Mở Chrome, vào `chrome://extensions/`.
2. Bật `Developer mode`.
3. Nhấn `Load unpacked`, chọn thư mục dự án này.
4. Thay `client_id` trong `manifest.json` bằng Google OAuth client ID thật.

## Sử dụng

1. Mở trang đặt lịch phỏng vấn trên MISA.
2. Extension sẽ thêm nút `Check & Book Calendar` trên trang.
3. Điền form trên MISA như bình thường.
4. Bấm nút để kiểm tra phòng và book phòng lên Google Calendar.
5. Nếu book được, tiếp tục `Submit` trên MISA để gửi email mẫu.

## Thông tin cần cập nhật sau

- `manifest.json`: đổi `client_id` thật.
- `config.js`: cập nhật selectors đúng với DOM form của MISA và mapping tên phòng sang calendar ID.
- `background.js`: nếu cần dùng API key riêng, có thể bổ sung sau.

## Cấu hình placeholder

- `config.js` có:
  - `selectors.room`: selector cho trường tên phòng.
  - `selectors.start`: selector cho giờ bắt đầu.
  - `selectors.end`: selector cho giờ kết thúc.
  - `selectors.summary`: selector cho tiêu đề sự kiện.
  - `roomCalendarIds`: mapping từ tên phòng hiển thị trên MISA sang calendar ID Google.

## Ghi chú

- Dự án này dùng placeholder để bạn bổ sung thông tin sau.
- Khi biết chính xác DOM MISA, chỉ cần sửa `config.js` và `manifest.json`.
