const https = require('https');
const urlModule = require('url');

/**
 * Prepend India country code (+91) to 10-digit numbers if country code is missing.
 * @param {string} phone 
 * @returns {string}Formatted phone number
 */
function formatPhoneNumber(phone) {
    let cleanPhone = phone.trim().replace(/[\s-()]/g, '');
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('+')) {
        return `+91${cleanPhone}`;
    }
    return cleanPhone;
}

/**
 * Sends SMS notification to complainant via Twilio or Fast2SMS based on environment variables.
 * Falls back to console logging if no API keys are configured.
 * @param {Object} complaint - The complaint record
 * @param {string} status - New status (In Progress / Resolved)
 */
async function sendSMSNotification(complaint, status) {
    const name = complaint.name;
    const id = complaint.id;
    const rawPhone = complaint.contact;
    const formattedPhone = formatPhoneNumber(rawPhone);

    let tamilMessage = '';
    let englishMessage = '';

    if (status === 'In Progress') {
        tamilMessage = `வணக்கம் ${name}, உங்களது TVK புகார் மனு (${id}) மீது தற்போது நடவடிக்கை எடுக்கப்பட்டு வருகிறது. - TVK IT Wing`;
        englishMessage = `Dear ${name}, action is now being taken on your TVK grievance petition (${id}). - TVK IT Wing`;
    } else if (status === 'Resolved') {
        tamilMessage = `வணக்கம் ${name}, உங்களது TVK புகார் மனு (${id}) வெற்றிகரமாக தீர்க்கப்பட்டது. நன்றி! - TVK IT Wing`;
        englishMessage = `Dear ${name}, your TVK grievance petition (${id}) has been successfully Resolved. Thank you! - TVK IT Wing`;
    } else {
        return; // Don't send SMS for other statuses (e.g. Pending)
    }

    const fast2smsKey = process.env.FAST2SMS_API_KEY;
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_FROM_NUMBER;

    // 1. FAST2SMS GATEWAY INTEGRATION
    if (fast2smsKey && fast2smsKey.trim() !== '') {
        console.log(`[SMS Notification] Attempting to send via Fast2SMS to ${rawPhone}...`);
        
        const payload = JSON.stringify({
            route: 'q',
            message: tamilMessage, // Fast2SMS supports unicode/Tamil SMS
            language: 'unicode',
            flash: 0,
            numbers: rawPhone
        });

        const options = {
            hostname: 'www.fast2sms.com',
            path: '/dev/bulkV2',
            method: 'POST',
            headers: {
                'authorization': fast2smsKey.trim(),
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`[Fast2SMS Response] Status: ${res.statusCode}`, data);
            });
        });

        req.on('error', (e) => {
            console.error(`[Fast2SMS Error] Failed to send SMS:`, e.message);
        });

        req.write(payload);
        req.end();
    }
    // 2. TWILIO GATEWAY INTEGRATION
    else if (twilioSid && twilioToken && twilioFrom) {
        console.log(`[SMS Notification] Attempting to send via Twilio to ${formattedPhone}...`);
        
        // Twilio expects form-urlencoded body
        const postData = new URLSearchParams({
            From: twilioFrom.trim(),
            To: formattedPhone,
            Body: englishMessage // English message works best on global Twilio numbers
        }).toString();

        const auth = 'Basic ' + Buffer.from(`${twilioSid.trim()}:${twilioToken.trim()}`).toString('base64');

        const options = {
            hostname: 'api.twilio.com',
            path: `/2010-04-01/Accounts/${twilioSid.trim()}/Messages.json`,
            method: 'POST',
            headers: {
                'Authorization': auth,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`[Twilio Response] Status: ${res.statusCode}`, data.slice(0, 150) + "...");
            });
        });

        req.on('error', (e) => {
            console.error(`[Twilio Error] Failed to send SMS:`, e.message);
        });

        req.write(postData);
        req.end();
    }
    // 3. FALLBACK: LOG TO CONSOLE (For development & testing)
    else {
        console.log("\n============================================================");
        console.log("[SMS NOTIFICATION LOG - NO ACTIVE API KEYS CONFIGURED IN .ENV]");
        console.log(`To Mobile: ${formattedPhone} (${rawPhone})`);
        console.log(`[Tamil SMS]: ${tamilMessage}`);
        console.log(`[English SMS]: ${englishMessage}`);
        console.log("============================================================\n");
    }
}

module.exports = { sendSMSNotification };
