const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  secure: false,
  port: 587,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  },
});

// Helper to send reset password email
async function sendResetEmail(to, username, link) {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f8fb; padding: 40px 0;">
      <div style="max-width: 480px; margin: auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #e3e8ee; padding: 32px;">
        <div style="text-align:center;margin-bottom:24px;"><span style="font-size:2rem;font-weight:800;color:#2563eb;letter-spacing:1px;font-family:Segoe UI,Arial,sans-serif;">TeamLabs</span></div>
        <h2 style="color: #2563eb; margin-bottom: 12px;">Reset Your Password</h2>
        <p style="color: #444; font-size: 16px;">Hi <b>${username}</b>,</p>
        <p style="color: #444; font-size: 15px; margin-bottom: 24px;">We received a request to reset your password. Click the button below to set a new password. This link is valid for 24 hours.</p>
        <a href="${link}" style="display: inline-block; background: linear-gradient(90deg, #2563eb, #1e40af); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; margin-bottom: 24px;">Reset Password</a>
        <p style="color: #888; font-size: 13px; margin-top: 32px;">If you did not request this, you can safely ignore this email.<br/>For security, this link will expire in 24 hours.</p>
        <div style="margin-top: 32px; text-align: center; color: #b0b0b0; font-size: 12px;">&copy; ${new Date().getFullYear()} TeamLabs</div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject: 'Reset your TeamLabs password',
      html
    });
    return true;
  } catch (error) {
    console.error('Error sending reset password email:', error);
    return false;
  }
}

// Helper to send task assignment email
async function sendTaskAssignmentEmail(to, taskName, taskDetails, assignedBy, priority, status, taskType, taskId, project, historyItems, attachments, comments) {
  // Simple badge helpers for email compatibility
  const getPriorityBadge = (priority) => {
    let color = '#d97706', bg = '#fef3c7', emoji = '⚡';
    if (priority === 'High') { color = '#dc2626'; bg = '#fee2e2'; emoji = '🔴'; }
    else if (priority === 'Low') { color = '#16a34a'; bg = '#dcfce7'; emoji = '🟢'; }
    return `<span style="display:inline-block;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;background:${bg};color:${color};margin-right:8px;">${emoji} ${priority}</span>`;
  };

  const getStatusBadge = (status) => {
    let color = '#2563eb', bg = '#dbeafe', emoji = '📝', text = 'Assigned';
    if (status === 1) { color = '#6b7280'; bg = '#f3f4f6'; emoji = '⏳'; text = 'Not Assigned'; }
    else if (status === 3) { color = '#d97706'; bg = '#fef3c7'; emoji = '⏳'; text = 'In Progress'; }
    else if (status === 4) { color = '#16a34a'; bg = '#dcfce7'; emoji = '✅'; text = 'Completed'; }
    return `<span style="display:inline-block;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;background:${bg};color:${color};">${emoji} ${text}</span>`;
  };

  // Parse taskDetails string to extract fields (assume it's HTML with <strong>Field:</strong> Value)
  const parseTaskDetails = (detailsHtml) => {
    const obj = {};
    if (!detailsHtml) return obj;
    // Use regex to extract <strong>Field:</strong> Value<br>
    const regex = /<strong>([^:]+):<\/strong>\s*([^<]*)<br>/g;
    let match;
    while ((match = regex.exec(detailsHtml)) !== null) {
      obj[match[1].trim()] = match[2].trim();
    }
    // Assigned Date (may not have <br> at end)
    const assignedDateMatch = detailsHtml.match(/<strong>Assigned Date:<\/strong>\s*([^<]*)/);
    if (assignedDateMatch) obj['Assigned Date'] = assignedDateMatch[1].trim();
    // Description
    const descMatch = detailsHtml.match(/<strong>Description:<\/strong>\s*([^<]*)<br>/);
    if (descMatch) obj['Description'] = descMatch[1].trim();
    return obj;
  };

  // Helper: get time ago string
  const getTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };

  // Helper: get file emoji by extension
  const getFileEmoji = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (["jpg","jpeg","png","gif","bmp","svg","webp"].includes(ext)) return '🖼️';
    if (["pdf"].includes(ext)) return '📄';
    if (["doc","docx","odt","rtf"].includes(ext)) return '📄';
    if (["xls","xlsx","csv"].includes(ext)) return '📊';
    if (["ppt","pptx"].includes(ext)) return '📊';
    if (["zip","rar","7z","tar","gz"].includes(ext)) return '🗜️';
    if (["mp3","wav","ogg"].includes(ext)) return '🎵';
    if (["mp4","mov","avi","wmv","mkv"].includes(ext)) return '🎬';
    return '📎';
  };

  // Project Info Section
  const projectSection = project ? `
    <div style="margin-bottom: 18px;">
      <div style="font-weight: 600; color: #2563eb; font-size: 15px; margin-bottom: 2px;">Project: ${project.Name}</div>
      ${project.Description ? `<div style=\"color:#444;font-size:13px;\">${project.Description}</div>` : ''}
    </div>
  ` : '';

  // Modern Recent Activity Section
  const historySection = historyItems && historyItems.length > 0 ? `
    <div style="margin-bottom: 18px;">
      <div style="font-weight: 600; color: #2563eb; font-size: 15px; margin-bottom: 8px; display: flex; align-items: center;">🔄 Recent Activity</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 6px;">
        <tbody>
        ${historyItems.map(h => `
          <tr>
            <td style="background:#f3f4f6;border-radius:8px;padding:8px 12px 8px 10px;border-left:3px solid #2563eb;font-size:13px;color:#222;">
              <div style="font-weight:500;">${h.Type || 'Task'}${h.OldStatus !== undefined ? ` status changed from <b>${h.OldStatus}</b>` : ''}</div>
              <div style="color:#888;font-size:12px;">${getTimeAgo(h.HistoryDate)}</div>
            </td>
          </tr>
        `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  // Modern Attachments Section
  const attachmentsSection = attachments && attachments.length > 0 ? `
    <div style="margin-bottom: 18px;">
      <div style="font-weight: 600; color: #2563eb; font-size: 15px; margin-bottom: 8px; display: flex; align-items: center;">📎 Attachments</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 8px;">
        <tbody>
        <tr>
        ${attachments.map(a => `
          <td style="background:#f3f4f6;border-radius:10px;padding:12px 14px 10px 14px;min-width:140px;max-width:180px;border:1.5px solid #e5e7eb;vertical-align:top;text-align:left;">
            <div style="font-size:18px;line-height:1.2;margin-bottom:2px;">${getFileEmoji(a.Filename)}</div>
            <a href="${a.FileURL}" style="color:#2563eb;text-decoration:underline;font-weight:600;display:block;word-break:break-all;">${a.Filename}</a>
            <div style="color:#888;font-size:12px;">${(a.FileSize/1024).toFixed(1)} KB • ${getTimeAgo(a.UploadedAt)}</div>
          </td>
        `).join('')}
        </tr>
        </tbody>
      </table>
    </div>
  ` : '';

  // Comments Section
  const commentsSection = comments && comments.length > 0 ? `
    <div style="margin-bottom: 18px;">
      <div style="font-weight: 600; color: #2563eb; font-size: 15px; margin-bottom: 6px;">💬 Recent Comments</div>
      <ul style="padding-left: 18px; margin: 0; color: #333; font-size: 13px;">
        ${comments.map(c => `<li style=\"margin-bottom:8px;\"><b>${c.Author}</b> <span style=\"color:#888;\">(${getTimeAgo(c.CreatedAt)})</span><br><span>${c.Content.length > 100 ? c.Content.slice(0,100)+'…' : c.Content}</span></li>`).join('')}
      </ul>
    </div>
  ` : '';

  const taskUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/task/${taskId}`;
  const taskDetailsObj = parseTaskDetails(taskDetails);
  const assignedDateFormatted = (() => {
    if (!taskDetailsObj['Assigned Date']) return '';
    const date = new Date(taskDetailsObj['Assigned Date']);
    if (isNaN(date.getTime())) return taskDetailsObj['Assigned Date'];
    return date.toLocaleString('en-US', {
      month: '2-digit', day: '2-digit', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    });
  })();

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f8fb; padding: 40px 0;">
      <div style="max-width: 480px; margin: auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #e3e8ee; padding: 32px;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:2rem;font-weight:800;color:#2563eb;letter-spacing:1px;font-family:Segoe UI,Arial,sans-serif;">TeamLabs</span>
        </div>
        <h2 style="color: #2563eb; margin-bottom: 12px;">New ${taskType} Assigned</h2>
        <p style="color: #444; font-size: 16px;">Hello,</p>
        <p style="color: #444; font-size: 15px; margin-bottom: 24px;">
          You have been assigned a new ${taskType.toLowerCase()} by <b>${assignedBy}</b>.
        </p>
        ${projectSection}
        <div style="background: #f8fafc; border: 1.5px solid #2563eb; border-radius: 14px; padding: 24px 20px 20px 20px; margin-bottom: 24px; box-shadow: 0 2px 8px #e3e8ee;">
          <div style="font-size: 1.15rem; font-weight: 700; color: #2563eb; margin-bottom: 10px; letter-spacing: 0.5px;">
            ${taskName}
          </div>
          <div style="margin-bottom: 14px;">
            ${getPriorityBadge(priority)}
            ${getStatusBadge(status)}
          </div>
          <div style="font-size: 15px; color: #222; margin-bottom: 10px;">
            <div><span style="font-weight:600;">Description:</span> ${taskDetailsObj.Description || '—'}</div>
            <div><span style="font-weight:600;">Type:</span> ${taskType}</div>
            <div><span style="font-weight:600;">Assigned Date:</span> ${assignedDateFormatted}</div>
          </div>
          ${historySection}
          ${attachmentsSection}
          ${commentsSection}
          <div style="text-align: center; margin-top: 18px;">
            <a href="${taskUrl}" style="display: inline-block; background: linear-gradient(90deg, #2563eb, #1e40af); color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.13);">
              📋 View ${taskType}
            </a>
          </div>
        </div>
        <p style="color: #888; font-size: 13px; margin-top: 32px;">
          Please log in to your TeamLabs account to view the complete ${taskType.toLowerCase()} details and update its status.
        </p>
        <div style="margin-top: 32px; text-align: center; color: #b0b0b0; font-size: 12px;">
          &copy; ${new Date().getFullYear()} TeamLabs
        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject: `${taskType}: ${taskName}`,
      html
    });
    return true;
  } catch (error) {
    console.error('Error sending task assignment email:', error);
    return false;
  }
}

module.exports = {
  sendResetEmail,
  sendTaskAssignmentEmail
}; 