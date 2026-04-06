// background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log('MISA Calendar Extension installed');
});

// Handle OAuth
function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError) {
      reject(chrome.runtime.lastError);
    } else {
      resolve(token);
    }
  });
  });
}

// Check room availability
async function checkRoomAvailability(roomId, startTime, endTime) {
  const token = await getAuthToken();
  const response = await fetch(`https://www.googleapis.com/calendar/v3/freeBusy`, {
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
  return data.calendars[roomId].busy.length === 0;
}

// Book room
async function bookRoom(roomId, startTime, endTime, summary) {
  const token = await getAuthToken();
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${roomId}/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      summary: summary,
      start: { dateTime: startTime },
      end: { dateTime: endTime }
    })
  });
  return await response.json();
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkAndBook') {
    (async () => {
      try {
        const isFree = await checkRoomAvailability(request.room, request.startTime, request.endTime);
        if (isFree) {
          await bookRoom(request.room, request.startTime, request.endTime, request.summary);
          sendResponse({ message: '✓ Đã book phòng thành công!' });
        } else {
          sendResponse({ message: '⚠ Phòng đã có người book!' });
        }
      } catch (error) {
        sendResponse({ message: 'Lỗi: ' + error.message });
      }
    })();
    return true; // Keep message channel open
  }
});