import React from 'react';
import './TeamsPreview.css';

const adaptiveCardJson = {
  "type": "AdaptiveCard",
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.4",
  "body": [
    {
      "type": "TextBlock",
      "text": "New Goal Submission",
      "weight": "Bolder",
      "size": "Medium"
    },
    {
      "type": "FactSet",
      "facts": [
        { "title": "Employee", "value": "Arjun Sharma" },
        { "title": "Goals", "value": "6 goals, 100% weighted" },
        { "title": "Submitted", "value": "Today at 10:32 AM" }
      ]
    },
    {
      "type": "TextBlock",
      "text": "Review and approve within 3 days.",
      "wrap": true
    }
  ],
  "actions": [
    {
      "type": "Action.OpenUrl",
      "title": "Review Goals →",
      "url": "https://yourapp.com/manager/approve/123"
    }
  ]
};

const TeamsPreviewPage = () => {
  return (
    <div className="teams-preview-container">
      <div className="teams-header">
        <h1>Teams Notifications Preview</h1>
        <p style={{color:'#6b7280', margin:0}}>Admin configuration and preview of Microsoft Teams Adaptive Cards dispatched by the Notification Service.</p>
      </div>

      <div className="teams-grid">
        {/* Left Panel: JSON Schema */}
        <div className="panel">
          <h3>Adaptive Card Payload (JSON)</h3>
          <p style={{fontSize:'0.875rem', color:'#6b7280', marginBottom:'1rem'}}>This payload is POSTed to the Manager's configured Azure Bot Service Incoming Webhook.</p>
          <pre className="json-block">
            {JSON.stringify(adaptiveCardJson, null, 2)}
          </pre>
          <div style={{marginTop:'1.5rem'}}>
            <button className="btn" style={{background:'#6264A7', color:'white', padding:'0.5rem 1rem', borderRadius:'6px', border:'none', cursor:'pointer', fontWeight:600}}>
              Test Webhook Connection
            </button>
          </div>
        </div>

        {/* Right Panel: Visual Render */}
        <div className="panel">
          <h3>Microsoft Teams Visual Mockup</h3>
          <p style={{fontSize:'0.875rem', color:'#6b7280', marginBottom:'1.5rem'}}>How it will appear in the Manager's Teams client.</p>
          
          <div className="teams-card-mockup">
            <div className="teams-card-header">
              <div className="bot-avatar">AQ</div>
              <div className="bot-info">
                <span className="bot-name">AtomQuest Bot</span>
                <span className="bot-time">10:32 AM</span>
              </div>
            </div>
            
            <div className="adaptive-card">
              <div className="ac-title">New Goal Submission</div>
              
              <div className="ac-factset">
                <div className="ac-fact-title">Employee</div>
                <div className="ac-fact-value">Arjun Sharma</div>
                
                <div className="ac-fact-title">Goals</div>
                <div className="ac-fact-value">6 goals, 100% weighted</div>
                
                <div className="ac-fact-title">Submitted</div>
                <div className="ac-fact-value">Today at 10:32 AM</div>
              </div>

              <div className="ac-text">Review and approve within 3 days.</div>
              
              <div className="ac-actions">
                <div className="ac-button">Review Goals →</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamsPreviewPage;
