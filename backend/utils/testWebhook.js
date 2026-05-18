const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sendWebhookNotification } = require('./webhookSender');

const test = async () => {
    console.log("🚀 Initializing Webhook Feature Test...");
    console.log(`Configured URL: ${process.env.SLACK_WEBHOOK_URL || 'None (Using Local Console Stub)'}`);
    
    // Simulate Employee Submission
    console.log("\n1. Simulating Employee Goal Submission Webhook...");
    await sendWebhookNotification({
        type: 'SUBMIT',
        userName: 'Sunil Choudhary',
        details: {
            department: 'Engineering',
            designation: 'Senior Developer'
        },
        actionUrl: 'http://localhost:5173/dashboard/team'
    });

    // Simulate Manager Goal Approval
    console.log("\n2. Simulating Manager Goal Approval Webhook...");
    await sendWebhookNotification({
        type: 'APPROVE',
        userName: 'Sunil Choudhary',
        details: {
            department: 'Engineering',
            designation: 'Senior Developer'
        },
        actionUrl: 'http://localhost:5173/dashboard/team'
    });

    console.log("\n✅ Webhook Test Simulation Completed successfully!");
};

test();
