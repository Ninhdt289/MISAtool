// background.js - Service worker xử lý Google Calendar API

chrome.runtime.onInstalled.addListener(() => {
  console.log('MISA Calendar Extension installed');
});

function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(token);
      }
    });
  });
}

// Check phòng trống bằng FreeBusy API
async function checkRoomAvailability(roomId, startTime, endTime) {
  const token = await getAuthToken();
  const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      timeMin: startTime,
      timeMax: endTime,
      items: [{ id: roomId }]
    })
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }
  const busy = data.calendars[roomId].busy;
  return { isFree: busy.length === 0, busy };
}

// Book phòng: tạo event trên calendar chính + thêm room là attendee
async function bookRoom(roomId, startTime, endTime, summary, description) {
  const token = await getAuthToken();
  const event = {
    summary: summary,
    description: description || '',
    start: { dateTime: startTime },
    end: { dateTime: endTime },
    attendees: [
      { email: roomId, resource: true }
    ]
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }
  return data;
}

// Handle messages từ content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkRoom') {
    checkRoomAvailability(request.roomId, request.startTime, request.endTime)
      .then(result => {
        if (result.isFree) {
          sendResponse({ success: true, message: `✓ Phòng trống từ ${request.startTime} đến ${request.endTime}` });
        } else {
          const busyTimes = result.busy.map(b =>
            `${new Date(b.start).toLocaleTimeString('vi-VN')} - ${new Date(b.end).toLocaleTimeString('vi-VN')}`
          ).join(', ');
          sendResponse({ success: false, message: `⚠ Phòng đã có người book: ${busyTimes}` });
        }
      })
      .catch(err => sendResponse({ success: false, message: 'Lỗi: ' + err.message }));
    return true;
  }

  if (request.action === 'bookRoom') {
    bookRoom(request.roomId, request.startTime, request.endTime, request.summary, request.description)
      .then(event => {
        sendResponse({ success: true, message: `✓ Đã book phòng thành công! Event: ${event.htmlLink}` });
      })
      .catch(err => sendResponse({ success: false, message: 'Lỗi book phòng: ' + err.message }));
    return true;
  }
});
