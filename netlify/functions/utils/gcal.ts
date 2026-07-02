import { google } from 'googleapis';

const credentialsJson = process.env['GOOGLE_APPLICATION_CREDENTIALS_JSON'];
const calendarId = process.env['GOOGLE_CALENDAR_ID'];

let authClient: any = null;

if (credentialsJson) {
  try {
    const credentials = JSON.parse(credentialsJson);
    authClient = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar.events']
    });
  } catch (e) {
    console.error('Error parsing GOOGLE_APPLICATION_CREDENTIALS_JSON', e);
  }
}

export const calendar = google.calendar({ version: 'v3', auth: authClient });
export const CALENDAR_ID = calendarId;
