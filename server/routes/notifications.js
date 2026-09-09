const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const { v4: uuidv4 } = require('uuid');

let client = null;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

if (accountSid && authToken && accountSid.startsWith('AC')) {
  try {
    client = twilio(accountSid, authToken);
    console.log('Twilio client initialized successfully.');
  } catch (err) {
    console.warn('Twilio initialization failed:', err.message);
  }
} else {
  console.log('Twilio credentials not provided or invalid in .env — notifications will operate in SIMULATED mode.');
}

// Helper to send SMS
async function sendSMS(to, body) {
  console.log(`[NOTIFICATION - SMS] To: ${to} | Body: "${body}"`);
  if (client && fromPhone) {
    try {
      const msg = await client.messages.create({ body, from: fromPhone, to });
      return { success: true, mode: 'twilio', sid: msg.sid };
    } catch (err) {
      console.error('Twilio SMS error:', err.message);
      return { success: false, mode: 'twilio_fallback', error: err.message };
    }
  }
  return { success: true, mode: 'simulated', to, body };
}

// Helper to make Voice call with TwiML
async function makeVoiceCall(to, message, language = 'hi-IN') {
  console.log(`[NOTIFICATION - VOICE] To: ${to} | Message: "${message}" | Lang: ${language}`);
  if (client && fromPhone) {
    try {
      const call = await client.calls.create({
        twiml: `<Response><Say voice="alice" language="${language}">${message}</Say></Response>`,
        from: fromPhone,
        to,
      });
      return { success: true, mode: 'twilio', sid: call.sid };
    } catch (err) {
      console.error('Twilio Voice error:', err.message);
      return { success: false, mode: 'twilio_fallback', error: err.message };
    }
  }
  return { success: true, mode: 'simulated', to, message };
}

// Export functions and Express router
module.exports = function(db) {
  // POST /api/notifications/sms
  router.post('/sms', async (req, res) => {
    const { to, body } = req.body;
    if (!to || !body) return res.status(400).json({ error: 'to and body parameters are required.' });
    const result = await sendSMS(to, body);
    res.json(result);
  });

  // POST /api/notifications/voice
  router.post('/voice', async (req, res) => {
    const { to, message, language } = req.body;
    if (!to || !message) return res.status(400).json({ error: 'to and message parameters are required.' });
    const result = await makeVoiceCall(to, message, language || 'hi-IN');
    res.json(result);
  });

  // Interactive IVR Webhooks for Twilio callbacks
  router.post('/voice/rebooking-ivr', (req, res) => {
    try {
      const VoiceResponse = twilio.twiml.VoiceResponse;
      const twiml = new VoiceResponse();
      const gather = twiml.gather({
        numDigits: 1,
        action: '/api/notifications/voice/rebooking-ivr/handle',
        method: 'POST',
      });
      gather.say(
        { language: 'hi-IN' },
        'AarogyaRakshak me aapka swagat hai. Aapke doctor aaj uplabdh nahi hain. Naye appointment ke liye 1 dabayein. ASHA worker se baat karne ke liye 2 dabayein.'
      );
      twiml.say({ language: 'hi-IN' }, 'Koyi uttar nahi mila. Dhanyavaad.');
      res.type('text/xml').send(twiml.toString());
    } catch (err) {
      res.status(500).send('<Response><Say>An error occurred.</Say></Response>');
    }
  });

  router.post('/voice/rebooking-ivr/handle', (req, res) => {
    try {
      const VoiceResponse = twilio.twiml.VoiceResponse;
      const twiml = new VoiceResponse();
      const digit = req.body.Digits;

      if (digit === '1') {
        twiml.say({ language: 'hi-IN' }, 'Aapka naya appointment sweekar kar liya gaya hai. Dhanyavaad.');
      } else if (digit === '2') {
        twiml.say({ language: 'hi-IN' }, 'Aapki ASHA worker ko soochna bhej di gayi hai. Woh jald hi aapase sampark karengi.');
      } else {
        twiml.say({ language: 'hi-IN' }, 'Amaneya vikalp. Dhanyavaad.');
      }
      res.type('text/xml').send(twiml.toString());
    } catch (err) {
      res.status(500).send('<Response><Say>An error occurred.</Say></Response>');
    }
  });

  // Post-visit feedback IVR
  router.post('/voice/feedback-ivr', (req, res) => {
    try {
      const VoiceResponse = twilio.twiml.VoiceResponse;
      const twiml = new VoiceResponse();
      const gather = twiml.gather({
        numDigits: 1,
        action: '/api/notifications/voice/feedback-ivr/handle',
        method: 'POST',
      });
      gather.say(
        { language: 'hi-IN' },
        'AarogyaRakshak swasthya sewa ke swagat hai. Kripaya apni aspatal yatra ko 1 se 5 ke beech star dein. 1 sabse kharab, 5 sabse accha.'
      );
      res.type('text/xml').send(twiml.toString());
    } catch (err) {
      res.status(500).send('<Response><Say>An error occurred.</Say></Response>');
    }
  });

  router.post('/voice/feedback-ivr/handle', (req, res) => {
    try {
      const VoiceResponse = twilio.twiml.VoiceResponse;
      const twiml = new VoiceResponse();
      const rating = parseInt(req.body.Digits, 10);
      const appointmentId = req.query.apt_id;

      if (rating >= 1 && rating <= 5) {
        twiml.say({ language: 'hi-IN' }, `Rating ${rating} darj karne ke liye dhanyavaad.`);
        if (appointmentId && db) {
          db.prepare('UPDATE appointments SET feedback_rating = ? WHERE appointment_id = ?').run(rating, appointmentId);
        }
      } else {
        twiml.say({ language: 'hi-IN' }, 'Amaneya rating. Dhanyavaad.');
      }
      res.type('text/xml').send(twiml.toString());
    } catch (err) {
      res.status(500).send('<Response><Say>An error occurred.</Say></Response>');
    }
  });

  return { router, sendSMS, makeVoiceCall };
};
