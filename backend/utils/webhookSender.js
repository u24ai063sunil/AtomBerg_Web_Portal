const axios = require('axios');

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
            await axios.post(url, { blocks });
            console.log(`[Webhook] Slack notification successfully dispatched for: ${userName}`);
        } catch (err) {
            console.error("[Webhook] Failed to send Slack notification:", err.message);
        }
    } else {
        console.log(`[Webhook STUB] Dispatched Slack notification payload:`, JSON.stringify({ blocks }, null, 2));
    }
};

module.exports = { sendWebhookNotification };
