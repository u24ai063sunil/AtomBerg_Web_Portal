const nodemailer = require('nodemailer');
const fetch = require('node-fetch'); // Assuming node-fetch is available, or use native fetch if Node 18+

// In a real application, use actual SMTP credentials from .env
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'no-reply@atomberg.com',
    pass: process.env.EMAIL_PASS || 'mockpassword'
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    console.log(`[EMAIL DISPATCH] To: ${to} | Subject: ${subject}`);
    // await transporter.sendMail({ from: process.env.EMAIL_USER || 'no-reply@atomberg.com', to, subject, html });
    // Commented out to prevent actual sending during dev without valid creds
  } catch (error) {
    console.error('Email Dispatch Error:', error);
  }
};

const sendTeamsNotification = async (webhookUrl, adaptiveCardJson) => {
  try {
    if (!webhookUrl) return;
    console.log('[TEAMS DISPATCH] Sending Adaptive Card to Webhook');
    /*
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adaptiveCardJson)
    });
    */
  } catch (error) {
    console.error('Teams Dispatch Error:', error);
  }
};

// --- EVENT HANDLERS ---

exports.notifyGoalSubmitted = async (employee, manager, goals, sheetId) => {
  const subject = `${employee.name} has submitted their FY 2025-26 goals for review`;
  const html = `
    <h2>New Goal Submission</h2>
    <p><strong>${employee.name}</strong> has submitted their goals for the FY 2025-26 cycle.</p>
    <ul>
      ${goals.map(g => `<li>${g.title} (${g.weightage}%)</li>`).join('')}
    </ul>
    <p>Please review and approve within 3 working days.</p>
    <a href="${process.env.FRONTEND_URL}/manager/approve/${sheetId}" style="display:inline-block; padding:10px 20px; background:#4f46e5; color:white; text-decoration:none; border-radius:5px;">Review Goals →</a>
  `;
  await sendEmail(manager.email, subject, html);

  const adaptiveCard = {
    "type": "message",
    "attachments": [
      {
        "contentType": "application/vnd.microsoft.card.adaptive",
        "contentUrl": null,
        "content": {
          "type": "AdaptiveCard",
          "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
          "version": "1.4",
          "body": [
            { "type": "TextBlock", "text": "New Goal Submission", "weight": "Bolder", "size": "Medium" },
            { "type": "FactSet", "facts": [
                { "title": "Employee", "value": employee.name },
                { "title": "Goals", "value": `${goals.length} goals, 100% weighted` },
                { "title": "Submitted", "value": new Date().toLocaleString() }
              ]
            },
            { "type": "TextBlock", "text": "Review and approve within 3 days.", "wrap": true }
          ],
          "actions": [
            { "type": "Action.OpenUrl", "title": "Review Goals →", "url": `${process.env.FRONTEND_URL}/manager/approve/${sheetId}` }
          ]
        }
      }
    ]
  };
  await sendTeamsNotification(manager.teamsWebhookUrl, adaptiveCard);
};

exports.notifyGoalApproved = async (employee, manager, sheetId) => {
  const subject = `✅ Your FY 2025-26 goals have been approved by ${manager.name}`;
  const html = `
    <h2>Goals Approved and Locked</h2>
    <p>Your manager, <strong>${manager.name}</strong>, has approved your goals. They are now locked for the duration of the cycle.</p>
    <a href="${process.env.FRONTEND_URL}/goals" style="display:inline-block; padding:10px 20px; background:#10b981; color:white; text-decoration:none; border-radius:5px;">View My Locked Goals →</a>
  `;
  await sendEmail(employee.email, subject, html);
};

exports.notifyGoalReturned = async (employee, manager, sheetId, managerComment) => {
  const subject = `⚠️ Your goals need revision — feedback from ${manager.name}`;
  const html = `
    <h2>Goals Returned for Rework</h2>
    <p>Your manager has requested changes to your submitted goals.</p>
    <div style="padding:15px; background:#fffbeb; border-left:4px solid #f59e0b; margin:20px 0;">
      <strong>Manager's Feedback:</strong><br/>
      ${managerComment}
    </div>
    <a href="${process.env.FRONTEND_URL}/goals" style="display:inline-block; padding:10px 20px; background:#ef4444; color:white; text-decoration:none; border-radius:5px;">Revise My Goals →</a>
  `;
  await sendEmail(employee.email, subject, html);
};

exports.notifyCheckinWindowOpen = async (employee, quarter) => {
  const subject = `📅 ${quarter} Check-in is now open — log your progress by 31 July`;
  const html = `
    <h2>${quarter} Check-in Window Active</h2>
    <p>The window to log your actual achievements for ${quarter} is now open.</p>
    <p>Please complete your check-in before the deadline.</p>
    <a href="${process.env.FRONTEND_URL}/checkin" style="display:inline-block; padding:10px 20px; background:#4f46e5; color:white; text-decoration:none; border-radius:5px;">Log ${quarter} Progress →</a>
  `;
  await sendEmail(employee.email, subject, html);
};

exports.notifyCheckinReminder = async (employee, quarter, daysLeft) => {
  const subject = `⏰ Reminder: ${quarter} Check-in closes in ${daysLeft} days`;
  const html = `
    <h2>Check-in Deadline Approaching</h2>
    <p>You have not yet submitted your ${quarter} actuals. The window closes in <strong>${daysLeft} days</strong>.</p>
    <a href="${process.env.FRONTEND_URL}/checkin" style="display:inline-block; padding:10px 20px; background:#f59e0b; color:white; text-decoration:none; border-radius:5px;">Complete ${quarter} Check-in →</a>
  `;
  await sendEmail(employee.email, subject, html);
};
