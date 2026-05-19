const nodemailer = require('nodemailer');

// Universal fetch utility: prefers native global fetch, falls back to dynamic node-fetch
const getFetch = async () => {
    if (typeof fetch !== 'undefined') {
        return fetch;
    }
    const nodeFetch = await import('node-fetch');
    return nodeFetch.default;
};

/**
 * Sends an email using Resend (HTTPS API) or falls back to Nodemailer (SMTP).
 * Bypasses outbound SMTP port blockages on hosting environments like Render.
 * 
 * @param {Object} options
 * @param {string|string[]} options.to - Recipient email(s)
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text content
 * @param {string} [options.html] - HTML content
 */
const sendEmail = async ({ to, subject, text, html }) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    const recipients = Array.isArray(to) ? to : to.split(',').map(e => e.trim());

    if (resendApiKey) {
        console.log(`[EMAIL] Dispatching via Resend API to: ${recipients.join(', ')}`);
        
        // Resend's standard verified domain / sandbox from address
        const fromAddress = process.env.RESEND_FROM || 'onboarding@resend.dev';
        const fromName = process.env.RESEND_FROM_NAME || 'AtomQuest';

        try {
            const fetchFn = await getFetch();
            const response = await fetchFn('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: `${fromName} <${fromAddress}>`,
                    to: recipients,
                    subject: subject,
                    text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text
                    html: html || text
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || JSON.stringify(data));
            }
            console.log('[EMAIL] Resend dispatch successful. ID:', data.id);
            return { success: true, provider: 'resend', id: data.id };
        } catch (error) {
            console.error('[EMAIL] Resend dispatch failed:', error.message);
            console.log('[EMAIL] Attempting Nodemailer fallback...');
        }
    }

    // Nodemailer SMTP fallback (or primary if RESEND_API_KEY is not set)
    console.log(`[EMAIL] Dispatching via Nodemailer SMTP to: ${recipients.join(', ')}`);
    try {
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER || 'no-reply@atomberg.com',
            to: recipients.join(','),
            subject,
            text: text || html?.replace(/<[^>]*>/g, ''),
            html: html || text
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('[EMAIL] Nodemailer dispatch successful. MessageId:', info.messageId);
        return { success: true, provider: 'nodemailer', id: info.messageId };
    } catch (error) {
        console.error('[EMAIL] Nodemailer dispatch failed:', error.message);
        return { success: false, error: error.message };
    }
};

module.exports = { sendEmail };
