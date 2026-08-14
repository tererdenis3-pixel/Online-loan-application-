// Minimal Node/Express backend to forward admin actions to a Telegram bot.
// Usage:
// 1) npm install express axios
// 2) Set environment variables: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, optionally ADMIN_API_KEY
// 3) node server.js
//
// The endpoint expects: { id: "...", action: "APPROVE"|"DENY"|"WRONG_ACCOUNT_NO", data: {...} }

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || ''; // where the bot should send admin messages
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || ''; // shared secret for admin page -> server

if(!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID){
  console.warn('WARNING: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set. Telegram forwarding will fail until configured.');
}

function buildTextForAction(action, id, data){
  const prettyData = data ? JSON.stringify(data, null, 2) : '';
  switch(action){
    case 'APPROVE':
      return `APPROVE\nRequest ID: ${id}\n\n${prettyData}`;
    case 'DENY':
      return `DENY\nRequest ID: ${id}\n\n${prettyData}`;
    case 'WRONG_ACCOUNT_NO':
      return `WRONG ACCOUNT NO\nRequest ID: ${id}\n\n${prettyData}`;
    default:
      return `UNKNOWN ACTION: ${action}\nRequest ID: ${id}\n\n${prettyData}`;
  }
}

app.post('/api/telegram-command', async (req, res) => {
  try{
    if(ADMIN_API_KEY){
      const provided = req.header('x-admin-key') || '';
      if(provided !== ADMIN_API_KEY) return res.status(401).json({ error: 'invalid admin key' });
    }

    const { id, action, data } = req.body;
    if(!id || !action) return res.status(400).json({ error: 'id and action are required' });

    const text = buildTextForAction(action, id, data);
    if(!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID){
      console.log('Would send to Telegram:', { text, chat_id: TELEGRAM_CHAT_ID });
      return res.json({ ok: true, note: 'telegram not configured - logged to console' });
    }

    const tgUrl = `https://api.telegram.org/bot${encodeURIComponent(TELEGRAM_BOT_TOKEN)}/sendMessage`;
    const tgResp = await axios.post(tgUrl, {
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'Markdown' // optional
    }, { timeout: 10000 });

    return res.json({ ok: true, telegram: tgResp.data });
  }catch(err){
    console.error('Error forwarding to Telegram:', err.response?.data || err.message || err);
    return res.status(500).json({ error: 'failed to forward to telegram', details: err.response?.data || err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server listening on ${PORT}`));
