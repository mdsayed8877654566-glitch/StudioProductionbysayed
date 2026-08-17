import { getAccessToken } from '../lib/auth';

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject?: string;
  from?: string;
  date?: string;
}

export const sendEmail = async (to: string, subject: string, body: string): Promise<boolean> => {
  const token = await getAccessToken();
  if (!token) {
    console.error('No access token available for Gmail API');
    return false;
  }

  // Gmail API requires the email to be base64url encoded RFC 2822 format
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    body,
  ];
  const message = messageParts.join('\n');

  // The body must be base64url encoded
  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedMessage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gmail API Error:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending email via Gmail:', error);
    return false;
  }
};

export const listEmails = async (query = ''): Promise<GmailMessage[]> => {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
    if (query) url.searchParams.append('q', query);
    url.searchParams.append('maxResults', '10');

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) return [];

    const data = await response.json();
    const messages = data.messages || [];

    const detailPromises = messages.map(async (msg: { id: string }) => {
      const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!detailRes.ok) return null;
      
      const detailData = await detailRes.json();
      const headers = detailData.payload.headers;
      
      return {
        id: detailData.id,
        threadId: detailData.threadId,
        snippet: detailData.snippet,
        subject: headers.find((h: any) => h.name === 'Subject')?.value,
        from: headers.find((h: any) => h.name === 'From')?.value,
        date: headers.find((h: any) => h.name === 'Date')?.value,
      };
    });

    const results = await Promise.all(detailPromises);
    return results.filter((r): r is GmailMessage => r !== null);
  } catch (error) {
    console.error('Error listing emails:', error);
    return [];
  }
};
