// config.js - Cấu hình cho MISA Calendar Extension
// Được inject vào trang MISA trước content.js (xem manifest.json)

const MISA_CALENDAR_CONFIG = {
  // Label text của các field trên form MISA
  fieldLabels: {
    date: 'Ngày',
    startTime: 'Giờ bắt đầu',
    duration: 'Thời lượng (phút)'
  },
  defaultSummary: 'Phỏng vấn ứng viên',
  // Mapping: Tên phòng → Google Calendar Resource ID
  roomCalendarIds: {
    'Meeting room - Brazil': 'c_e538fc18198309709153fe1ba32a648c9bb5e81432b81d07e18dcfad44f8e7c4@group.calendar.google.com',
    'Meeting room - India': 'c_6b8458f4dc618789375d36a94144d1507a53eafcb9079b598ad2cefc652baed8@group.calendar.google.com',
    'Meeting room - Indonesia': 'c_a9f1be4f8fd8804280ec760affcd45b2953ccca8797d43528d8f49b63c9ccc3d@group.calendar.google.com'
  }
};
