// Telegram configuration - replace the placeholders with your bot token and chat id
const TELEGRAM_BOT_TOKEN = '8177967357:AAH1nLxAO8bkLGeAohi2aaZ80RfbmJkh0Mo';
const TELEGRAM_CHAT_ID = '8820857419';

async function sendTelegramMessage(text) {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN.startsWith('REPLACE')) {
    console.log('[telegram] not configured, skipping send:', text);
    return null;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' })
    });
    return res.json();
  } catch (err) {
    console.error('[telegram] send failed', err);
  }
}
