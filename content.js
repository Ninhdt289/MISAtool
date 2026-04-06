// content.js
const config = window.MISA_CALENDAR_CONFIG || {
  selectors: {
    form: 'form',
    room: '#room-select',
    start: '#start-time',
    end: '#end-time',
    summary: '#event-title'
  },
  defaultSummary: 'Phỏng vấn ứng viên',
  roomCalendarIds: {}
};

function getFieldValue(selector) {
  const element = document.querySelector(selector);
  return element ? element.value || element.textContent : null;
}

function createActionButton() {
  if (document.getElementById('misa-calendar-book-button')) return;
  const button = document.createElement('button');
  button.id = 'misa-calendar-book-button';
  button.textContent = 'Check & Book Calendar';
  button.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 10000; background: #2e7d32; color: white; padding: 10px 14px; border: none; border-radius: 4px; cursor: pointer;';
  button.onclick = async () => {
    const roomName = getFieldValue(config.selectors.room);
    const startTime = getFieldValue(config.selectors.start);
    const endTime = getFieldValue(config.selectors.end);
    const summary = getFieldValue(config.selectors.summary) || config.defaultSummary;
    const roomId = config.roomCalendarIds[roomName] || roomName;

    if (!roomName || !startTime || !endTime) {
      alert('Vui lòng cập nhật selectors trong config.js hoặc điền đủ phòng, giờ bắt đầu và giờ kết thúc.');
      return;
    }

    chrome.runtime.sendMessage({
      action: 'checkAndBook',
      room: roomId,
      startTime: startTime,
      endTime: endTime,
      summary: summary
    }, (response) => {
      alert(response.message);
    });
  };
  document.body.appendChild(button);
}

if (window.location.href.includes('misa.vn') && document.querySelector(config.selectors.form)) {
  createActionButton();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'bookingResult') {
    alert(request.message);
  }
});