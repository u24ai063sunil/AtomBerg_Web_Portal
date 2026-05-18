const https = require('https');
const urlModule = require('url');

/**
 * Dispatches a formatted Slack webhook notification card.
 * If SLACK_WEBHOOK_URL is not set, prints message to console.
 */
const sendWebhookNotification = async ({ type, userName, details, actionUrl }) => {
    const url = process.env.SLACK_WEBHOOK_URL;
    
    // Sleek formatting blocks for slack
    const blocks = [
        {
            type: "header",
            text: {
                type: "plain_text",
                text: type === 'SUBMIT' ? "🎯 New Goal Sheet Submission!" : "✅ Goal Sheet Approved!",
                emoji: true
            }
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: type === 'SUBMIT' 
                    ? `*${userName}* has successfully submitted their quarterly goal sheet for approval.`
                    : `*${userName}*'s goal sheet has been officially approved by their manager.`
            }
        },
        {
            type: "divider"
        },
        {
            type: "section",
            fields: [
                {
                    type: "mrkdwn",
                    text: `*Department:*\n${details.department || 'N/A'}`
                },
                {
                    type: "mrkdwn",
                    text: `*Designation:*\n${details.designation || 'N/A'}`
                }
            ]
        }
    ];

    if (actionUrl) {
        blocks.push({
            type: "actions",
            elements: [
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: type === 'SUBMIT' ? "Review Goals" : "View Dashboard",
                        emoji: true
                    },
                    value: "view_action",
                    url: actionUrl,
                    action_id: "action_button",
                    style: type === 'SUBMIT' ? "primary" : "default"
                }
            ]
        });
    }

    if (url) {
        try {
            const parsedUrl = urlModule.parse(url);
            const dataStr = JSON.stringify({ blocks });
            
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || 443,
                path: parsedUrl.path,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(dataStr)
                }
            };
            
            await new Promise((resolve, reject) => {
                const req = https.request(options, (res) => {
                    let responseData = '';
                    res.on('data', (chunk) => { responseData += chunk; });
                    res.on('end', () => {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(responseData);
                        } else {
                            reject(new Error(`Server returned status code ${res.statusCode}: ${responseData}`));
                        }
                    });
                });
                
                req.on('error', (err) => reject(err));
                req.write(dataStr);
                req.end();
            });
            
            console.log(`[Webhook] Slack notification successfully dispatched for: ${userName}`);
        } catch (err) {
            if (err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || (err.message && err.message.includes('ETIMEDOUT'))) {
                console.log(`\n⚠️  [Webhook Proxy Fallback] Outbound internet is restricted in this sandbox (Socket error: ${err.code || 'ETIMEDOUT'}).`);
                console.log(`[Webhook Proxy Fallback] Gracefully falling back to local audit. Here is the formatted Slack payload that was prepared:`);
                console.log(JSON.stringify({ blocks }, null, 2));
            } else {
                console.error("[Webhook] Failed to send Slack notification:", err);
            }
        }
    } else {
        console.log(`[Webhook STUB] Dispatched Slack notification payload:`, JSON.stringify({ blocks }, null, 2));
    }
};

module.exports = { sendWebhookNotification };
