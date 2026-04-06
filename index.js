const { google } = require('googleapis');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

// Google Calendar setup
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_PATH = path.join(__dirname, 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

// Misa API setup (placeholders)
const MISA_API_URL = 'https://api.misa.vn/email/send'; // Replace with actual endpoint
const MISA_API_KEY = 'your-misa-api-key'; // Replace with actual key

let lastChecked = new Date();

async function loadCredentials() {
  try {
    const content = await fs.readFile(CREDENTIALS_PATH);
    return JSON.parse(content);
  } catch (err) {
    throw new Error('Error loading client secret file: ' + err);
  }
}

function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve, reject) => {
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return reject('Error retrieving access token', err);
        oAuth2Client.setCredentials(token);
        fs.writeFile(TOKEN_PATH, JSON.stringify(token));
        resolve(oAuth2Client);
      });
    });
  });
}

async function authorize() {
  const credentials = await loadCredentials();
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  try {
    const token = await fs.readFile(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
  } catch (err) {
    return await getNewToken(oAuth2Client);
  }
  return oAuth2Client;
}

async function listEvents(auth) {
  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: lastChecked.toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return res.data.items;
}

async function sendEmailToMisa(event) {
  // Extract email from event attendees
  const emails = event.attendees ? event.attendees.map(a => a.email) : ['default@email.com'];
  const subject = `Quyết định cho sự kiện: ${event.summary}`;
  const body = `
Nội dung quyết định cho sự kiện: ${event.summary}
Thời gian bắt đầu: ${event.start.dateTime || event.start.date}
Thời gian kết thúc: ${event.end.dateTime || event.end.date}
Mô tả: ${event.description || 'Không có mô tả'}
Người tham gia: ${emails.join(', ')}
  `.trim();

  try {
    for (const email of emails) {
      await axios.post(MISA_API_URL, {
        to: email,
        subject: subject,
        body: body,
        apiKey: MISA_API_KEY
      });
    }
    console.log('Emails sent via Misa for event:', event.summary);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

async function checkAndSend() {
  try {
    const auth = await authorize();
    const events = await listEvents(auth);
    for (const event of events) {
      if (new Date(event.created) > lastChecked) {
        await sendEmailToMisa(event);
      }
    }
    lastChecked = new Date();
  } catch (error) {
    console.error('Error:', error);
  }
}

async function main() {
  console.log('Starting tool...');
  await checkAndSend();
  setInterval(checkAndSend, 30000); // Check every 30 seconds
}

main().catch(console.error);