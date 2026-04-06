// content.js - Inject panel "Check & Book Calendar" vào trang MISA

function getMisaFieldByLabel(labelText) {
  const labels = document.querySelectorAll('label');
  for (const label of labels) {
    if (label.textContent.trim() === labelText) {
      // Tìm input gần nhất trong cùng parent container
      const container = label.closest('[class*="field"], [class*="item"], [class*="row"], [class*="col"]') || label.parentElement;
      const input = container ? container.querySelector('.dx-texteditor-input') : null;
      return input ? (input.value || input.textContent).trim() : null;
    }
  }
  return null;
}

function parseDateTime(dateStr, timeStr, durationMin) {
  // dateStr: dạng "06/04/2026" hoặc "2026-04-06" tuỳ MISA format
  // timeStr: dạng "14:00" hoặc "14h00"
  // durationMin: số phút (ví dụ 60)
  let date = dateStr;
  // Nếu format dd/mm/yyyy → chuyển sang yyyy-mm-dd
  if (dateStr && dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  const time = timeStr ? timeStr.replace('h', ':').replace('H', ':') : '09:00';
  const startDateTime = new Date(`${date}T${time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + (durationMin || 60) * 60000);
  return {
    start: startDateTime.toISOString(),
    end: endDateTime.toISOString()
  };
}

function showStatus(container, message, isError) {
  let status = container.querySelector('.misa-cal-status');
  if (!status) {
    status = document.createElement('div');
    status.className = 'misa-cal-status';
    status.style.cssText = 'margin-top: 8px; padding: 8px 12px; border-radius: 4px; font-size: 13px; word-break: break-word;';
    container.appendChild(status);
  }
  status.textContent = message;
  status.style.background = isError ? '#ffebee' : '#e8f5e9';
  status.style.color = isError ? '#c62828' : '#2e7d32';
}

function createPanel() {
  if (document.getElementById('misa-calendar-panel')) return;

  const config = typeof MISA_CALENDAR_CONFIG !== 'undefined' ? MISA_CALENDAR_CONFIG : {};
  const labels = config.fieldLabels || { date: 'Ngày', startTime: 'Giờ bắt đầu', duration: 'Thời lượng (phút)' };
  const roomMap = config.roomCalendarIds || {};
  const roomNames = Object.keys(roomMap);

  const panel = document.createElement('div');
  panel.id = 'misa-calendar-panel';
  panel.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 10000; background: white; border: 2px solid #2e7d32; border-radius: 8px; padding: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); font-family: sans-serif; min-width: 240px;';

  // Title
  const title = document.createElement('div');
  title.textContent = 'Google Calendar - Book phòng';
  title.style.cssText = 'font-weight: bold; margin-bottom: 10px; font-size: 14px;';
  panel.appendChild(title);

  // Dropdown chọn phòng
  const roomLabel = document.createElement('label');
  roomLabel.textContent = 'Chọn phòng họp:';
  roomLabel.style.cssText = 'font-size: 12px; color: #555; display: block; margin-bottom: 4px;';
  panel.appendChild(roomLabel);

  const roomSelect = document.createElement('select');
  roomSelect.id = 'misa-cal-room-select';
  roomSelect.style.cssText = 'width: 100%; padding: 6px 8px; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 10px; font-size: 13px;';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '-- Chọn phòng --';
  roomSelect.appendChild(defaultOption);
  roomNames.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    roomSelect.appendChild(option);
  });
  panel.appendChild(roomSelect);

  // Hiển thị thông tin đọc từ MISA
  const infoDiv = document.createElement('div');
  infoDiv.id = 'misa-cal-info';
  infoDiv.style.cssText = 'font-size: 12px; color: #666; margin-bottom: 10px; padding: 6px; background: #f5f5f5; border-radius: 4px;';
  infoDiv.textContent = 'Bấm "Check" để đọc thông tin từ form MISA';
  panel.appendChild(infoDiv);

  // Nút Check
  const checkBtn = document.createElement('button');
  checkBtn.textContent = 'Check phòng trống';
  checkBtn.style.cssText = 'background: #1565c0; color: white; padding: 8px 14px; border: none; border-radius: 4px; cursor: pointer; width: 100%; margin-bottom: 6px; font-size: 13px;';

  // Nút Book
  const bookBtn = document.createElement('button');
  bookBtn.textContent = 'Book phòng';
  bookBtn.disabled = true;
  bookBtn.style.cssText = 'background: #2e7d32; color: white; padding: 8px 14px; border: none; border-radius: 4px; cursor: pointer; width: 100%; opacity: 0.5; font-size: 13px;';

  checkBtn.onclick = () => {
    const roomName = roomSelect.value;
    const dateStr = getMisaFieldByLabel(labels.date);
    const timeStr = getMisaFieldByLabel(labels.startTime);
    const durationStr = getMisaFieldByLabel(labels.duration);

    if (!roomName) {
      showStatus(panel, 'Vui lòng chọn phòng họp', true);
      return;
    }
    if (!dateStr || !timeStr) {
      showStatus(panel, 'Chưa có ngày/giờ trên form MISA. Điền trước rồi bấm Check', true);
      return;
    }

    const duration = parseInt(durationStr) || 60;
    const { start, end } = parseDateTime(dateStr, timeStr, duration);
    const roomId = roomMap[roomName];

    infoDiv.innerHTML = `Ngày: <b>${dateStr}</b> | Giờ: <b>${timeStr}</b> | Thời lượng: <b>${duration} phút</b>`;

    checkBtn.disabled = true;
    checkBtn.textContent = 'Đang check...';
    chrome.runtime.sendMessage({
      action: 'checkRoom',
      roomId: roomId,
      startTime: start,
      endTime: end
    }, (response) => {
      checkBtn.disabled = false;
      checkBtn.textContent = 'Check phòng trống';
      showStatus(panel, response.message, !response.success);
      if (response.success) {
        bookBtn.disabled = false;
        bookBtn.style.opacity = '1';
      }
    });
  };

  bookBtn.onclick = () => {
    const roomName = roomSelect.value;
    const dateStr = getMisaFieldByLabel(labels.date);
    const timeStr = getMisaFieldByLabel(labels.startTime);
    const durationStr = getMisaFieldByLabel(labels.duration);
    const duration = parseInt(durationStr) || 60;
    const { start, end } = parseDateTime(dateStr, timeStr, duration);
    const roomId = roomMap[roomName];

    bookBtn.disabled = true;
    bookBtn.textContent = 'Đang book...';
    chrome.runtime.sendMessage({
      action: 'bookRoom',
      roomId: roomId,
      startTime: start,
      endTime: end,
      summary: config.defaultSummary || 'Phỏng vấn ứng viên',
      description: `Phòng: ${roomName}`
    }, (response) => {
      bookBtn.textContent = 'Book phòng';
      bookBtn.disabled = true;
      bookBtn.style.opacity = '0.5';
      showStatus(panel, response.message, !response.success);
    });
  };

  panel.appendChild(checkBtn);
  panel.appendChild(bookBtn);
  document.body.appendChild(panel);
}

// Chỉ inject khi đang trên trang MISA
if (window.location.hostname.includes('misa.vn')) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createPanel);
  } else {
    createPanel();
  }
}
