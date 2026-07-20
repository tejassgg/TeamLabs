const currentYear = new Date().getFullYear();
const badgeStyle = 'display:inline-flex;align-items:center;justify-content:center;min-width:70px;max-width:110px;padding:4px 12px;border-radius:6px;font-size:11px;font-weight:600;margin-right:8px;box-sizing:border-box;line-height:1.2;border:1px solid;text-transform:uppercase;letter-spacing:0.5px;';

export const verifyEmailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>body { margin: 0; padding: 0; }</style>
  </head>
  <body style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <tr>
              <td style="padding: 40px 32px;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <div style="font-size: 24px; font-weight: 700; color: #6B39E7; letter-spacing: -0.5px; margin-bottom: 8px;">TeamLabs</div>
                  <div style="width: 40px; height: 2px; background: #6B39E7; margin: 0 auto;"></div>
                </div>
                <h1 style="color: #1F1F1F; font-size: 20px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">Verify Your Email</h1>
                <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">Hello <strong style="color: #1F1F1F;">John Doe</strong>,</p>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 32px 0; text-align: center;">Thanks for signing up! Please confirm your email address to activate your account.</p>
                <div style="text-align: center; margin-bottom: 32px;">
                  <a href="#" style="display: inline-block; background: #6B39E7; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 15px; font-weight: 600;">Verify Email</a>
                </div>
                <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-bottom: 32px;">
                  <p style="color: #6b7280; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">If you didn't create this account, you can safely ignore this email. This link expires in 24 hours.</p>
                </div>
                <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 11px; margin: 0;">&copy; ${currentYear} TeamLabs. All rights reserved.</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

export const inviteEmailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>body { margin: 0; padding: 0; }</style>
  </head>
  <body style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <tr>
              <td style="padding: 40px 32px;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <div style="font-size: 24px; font-weight: 700; color: #6B39E7; letter-spacing: -0.5px; margin-bottom: 8px;">TeamLabs</div>
                  <div style="width: 40px; height: 2px; background: #6B39E7; margin: 0 auto;"></div>
                </div>
                
                <h1 style="color: #1F1F1F; font-size: 20px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">You're Invited to Join TeamLabs</h1>
                <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">Hello,</p>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; text-align: center;"><strong style="color: #1F1F1F;">Jane Smith</strong> has invited you to join <strong style="color: #6B39E7;">Acme Corp</strong> on TeamLabs. Click the button below to register and join the team.</p>
                <p style="color: #dc2626; font-size: 13px; font-weight: 500; margin: 0 0 32px 0; text-align: center;">This invitation will expire on August 15, ${currentYear}.</p>
                
                <div style="text-align: center; margin-bottom: 32px;">
                  <a href="#" style="display: inline-block; background: #6B39E7; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 15px; font-weight: 600;">Accept Invite</a>
                </div>
                
                <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-bottom: 32px;">
                  <p style="color: #6b7280; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">If you did not expect this invitation, you can safely ignore this email.</p>
                </div>
                
                <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 11px; margin: 0;">&copy; ${currentYear} TeamLabs. All rights reserved.</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

export const taskAssignmentEmailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Task Assigned - TeamLabs</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <tr>
              <td style="padding: 40px 32px;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <div style="font-size: 24px; font-weight: 700; color: #6B39E7; letter-spacing: -0.5px; margin-bottom: 8px;">TeamLabs</div>
                  <div style="width: 40px; height: 2px; background: #6B39E7; margin: 0 auto;"></div>
                </div>
                
                <h1 style="color: #1F1F1F; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">New Bug Assigned</h1>
                <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Hello,</p>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">You have been assigned a new bug by <strong style="color: #1F1F1F;">Alice Admin</strong>.</p>
                
                <div style="margin-bottom: 20px; padding: 16px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #6B39E7;">
                  <div style="font-weight: 600; color: #6B39E7; font-size: 13px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Project</div>
                  <div style="font-weight: 600; color: #1F1F1F; font-size: 16px; margin-bottom: 4px;">Website Redesign 2026</div>
                  <div style="color:#6b7280;font-size:13px;line-height:1.4;">The new modern website for our enterprise customers.</div>
                </div>
                
                <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                  <div style="font-size: 16px; font-weight: 600; color: #1F1F1F; margin-bottom: 16px; line-height: 1.3;">Fix navigation bar spacing on mobile view</div>
                  
                  <div style="margin-bottom: 16px;">
                    <span style="display:inline-block;padding:4px 12px;border-radius:6px;font-size:11px;font-weight:600;background:#fee2e2;color:#dc2626;margin-right:8px;border:1px solid #f87171;text-transform:uppercase;letter-spacing:0.5px;">High</span>
                    <span style="display:inline-block;padding:4px 12px;border-radius:6px;font-size:11px;font-weight:600;background:#fef3c7;color:#d97706;border:1px solid #fbbf24;text-transform:uppercase;letter-spacing:0.5px;">In Progress</span>
                  </div>
                  
                  <div style="background: #f8fafc; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
                    <div style="font-size: 13px; color: #374151; line-height: 1.6;">
                      <div style="margin-bottom: 8px;"><span style="font-weight:600;color:#1F1F1F;">Description:</span> The menu icon overlaps with the logo on smaller screens (iPhone 13 mini etc).</div>
                      <div style="margin-bottom: 8px;"><span style="font-weight:600;color:#1F1F1F;">Type:</span> Bug</div>
                      <div><span style="font-weight:600;color:#1F1F1F;">Assigned Date:</span> 08/12/2026, 10:30 AM</div>
                    </div>
                  </div>
                  
                  <div style="text-align: center; margin-top: 20px;">
                    <a href="#" style="display: inline-block; background: #6B39E7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">View Bug</a>
                  </div>
                </div>
                
                <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 11px; margin: 0;">Please log in to your TeamLabs account to view the complete bug details and update its status.</p>
                  <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">&copy; ${currentYear} TeamLabs. All rights reserved.</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

export const commentMentionEmailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You were mentioned in a comment - TeamLabs</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <tr>
              <td style="padding: 40px 32px;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <div style="font-size: 24px; font-weight: 700; color: #6B39E7; letter-spacing: -0.5px; margin-bottom: 8px;">TeamLabs</div>
                  <div style="width: 40px; height: 2px; background: #6B39E7; margin: 0 auto;"></div>
                </div>
                
                <h1 style="color: #1F1F1F; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">You were mentioned in a comment</h1>
                <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Hello <strong style="color: #1F1F1F;">John Doe</strong>,</p>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;"><strong style="color: #1F1F1F;">Jane Smith</strong> mentioned you in a comment on a feature.</p>
                
                <div style="margin-bottom: 20px; padding: 16px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #6B39E7;">
                  <div style="font-weight: 600; color: #6B39E7; font-size: 13px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Project</div>
                  <div style="font-weight: 600; color: #1F1F1F; font-size: 16px; margin-bottom: 4px;">Backend API V2</div>
                </div>
                
                <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                  <div style="font-size: 16px; font-weight: 600; color: #1F1F1F; margin-bottom: 16px; line-height: 1.3;">Implement rate limiting for endpoints</div>
                  
                  <div style="margin-bottom: 16px;">
                    <table cellpadding="0" cellspacing="0" border="0" style="border:none;padding:0;margin:0;">
                      <tr>
                        <td><span style="${badgeStyle}background:#fef3c7;color:#d97706;border-color:#fbbf24;">Feature</span></td>
                        <td><span style="${badgeStyle}background:#dcfce7;color:#16a34a;border-color:#4ade80;">Low</span></td>
                        <td><span style="${badgeStyle}background:#f9fafb;color:#6b7280;border-color:#d1d5db;">Not Assigned</span></td>
                      </tr>
                    </table>
                  </div>
                  
                  <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
                    <div style="font-size: 13px; color: #374151; line-height: 1.6;">
                      Hey <span style="background:#f3f4f6;color:#6B39E7;padding:2px 6px;border-radius:4px;font-weight:600;">@John Doe</span>, I think we should use Redis for this rate limiting. What do you think?
                    </div>
                    <div style="margin-top: 12px; color: #6b7280; font-size: 11px;">
                      — Jane Smith • 5m ago
                    </div>
                  </div>
                  
                  <div style="text-align: center; margin-top: 20px;">
                    <a href="#" style="display: inline-block; background: #6B39E7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">View Comment</a>
                  </div>
                </div>
                
                <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 11px; margin: 0;">Click the button above to view the complete comment and respond if needed.</p>
                  <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">&copy; ${currentYear} TeamLabs. All rights reserved.</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

export const contactConfirmationEmailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Support Request Confirmation - TeamLabs</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <tr>
              <td style="padding: 40px 32px;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <div style="font-size: 24px; font-weight: 700; color: #6B39E7; letter-spacing: -0.5px; margin-bottom: 8px;">TeamLabs</div>
                  <div style="width: 40px; height: 2px; background: #6B39E7; margin: 0 auto;"></div>
                </div>
                
                <h1 style="color: #1F1F1F; font-size: 20px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">Support Request Received</h1>
                <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">Thank you for contacting TeamLabs support, John Doe!</p>
                
                <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                  <div style="font-size: 13px; color: #6B39E7; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Ticket Information</div>
                  <div style="font-size: 16px; font-weight: 600; color: #1F1F1F; margin-bottom: 12px;">Billing issue on standard plan</div>
                  <div style="margin-bottom: 12px;">
                    <span style="font-weight: 600; color: #1F1F1F;">Ticket Number:</span> 
                    <span style="background: #6B39E7; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-left: 8px;">TL-8429</span>
                  </div>
                  <div style="margin-bottom: 12px;">
                    <span style="font-weight: 600; color: #1F1F1F;">Status:</span> 
                    <span style="background: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-left: 8px;">OPEN</span>
                  </div>
                  <div style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                    <div style="font-weight: 600; color: #1F1F1F; margin-bottom: 8px;">Description:</div>
                    I was double charged this month for my subscription. Can you please check and refund the extra amount?
                  </div>
                </div>
                
                <div style="background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                  <div style="font-size: 14px; font-weight: 600; color: #065f46; margin-bottom: 12px;">What happens next?</div>
                  <ul style="color: #047857; font-size: 13px; line-height: 1.6; margin: 0; padding-left: 16px;">
                    <li style="margin-bottom: 6px;">Our support team will review your request within 24 hours</li>
                    <li style="margin-bottom: 6px;">You'll receive an email update when we respond</li>
                    <li style="margin-bottom: 6px;">We may ask for additional information if needed</li>
                    <li>You can reference ticket TL-8429 in any follow-up communications</li>
                  </ul>
                </div>
                
                <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 11px; margin: 0;">If you have any urgent issues, please call our support line at +1 (559) 388-6490</p>
                  <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">&copy; ${currentYear} TeamLabs. All rights reserved.</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

export const contactNotificationEmailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Support Request - TL-8429</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <tr>
              <td style="padding: 40px 32px;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <div style="font-size: 24px; font-weight: 700; color: #6B39E7; letter-spacing: -0.5px; margin-bottom: 8px;">TeamLabs Support</div>
                  <div style="width: 40px; height: 2px; background: #6B39E7; margin: 0 auto;"></div>
                </div>
                
                <h1 style="color: #1F1F1F; font-size: 20px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">New Support Request</h1>
                <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">A new support request has been submitted through the contact form.</p>
                
                <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                  <div style="font-size: 13px; color: #6B39E7; font-weight: 600; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">Request Details</div>
                  
                  <div style="margin-bottom: 16px;">
                    <div style="font-weight: 600; color: #1F1F1F; margin-bottom: 4px;">Ticket Number:</div>
                    <div style="background: #6B39E7; color: #ffffff; padding: 6px 12px; border-radius: 4px; font-size: 14px; font-weight: 600; display: inline-block;">TL-8429</div>
                  </div>
                  
                  <div style="margin-bottom: 16px;">
                    <div style="font-weight: 600; color: #1F1F1F; margin-bottom: 4px;">Title:</div>
                    <div style="color: #374151; font-size: 16px; font-weight: 600;">Billing issue on standard plan</div>
                  </div>
                  
                  <div style="margin-bottom: 16px;">
                    <div style="font-weight: 600; color: #1F1F1F; margin-bottom: 4px;">Customer Name:</div>
                    <div style="color: #374151; font-size: 14px;">John Doe</div>
                  </div>
                  
                  <div style="margin-bottom: 16px;">
                    <div style="font-weight: 600; color: #1F1F1F; margin-bottom: 4px;">Customer Email:</div>
                    <div style="color: #6B39E7; font-size: 14px;">john@example.com</div>
                  </div>
                  
                  <div style="margin-bottom: 16px;">
                    <div style="font-weight: 600; color: #1F1F1F; margin-bottom: 8px;">Description:</div>
                    <div style="color: #374151; font-size: 14px; line-height: 1.6; background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
                      I was double charged this month for my subscription. Can you please check and refund the extra amount?
                    </div>
                  </div>
                  
                  <div>
                    <div style="font-weight: 600; color: #1F1F1F; margin-bottom: 8px;">Attachments:</div>
                    <ul style="color: #374151; font-size: 13px; line-height: 1.6; margin: 0; padding-left: 16px;">
                      <li style="margin-bottom: 4px;">📎 invoice.pdf (1.20 MB)</li>
                    </ul>
                  </div>
                </div>
                
                <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                  <div style="font-size: 14px; font-weight: 600; color: #d97706; margin-bottom: 8px;">Action Required</div>
                  <p style="color: #92400e; font-size: 13px; line-height: 1.6; margin: 0;">Please respond to this support request within 24 hours. You can access the full request details in the admin dashboard.</p>
                </div>
                
                <div style="text-align: center; margin-bottom: 24px;">
                  <a href="#" style="display: inline-block; background: linear-gradient(135deg, #6B39E7 0%, #8B5CF6 100%); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 4px rgba(107, 57, 231, 0.3); transition: all 0.2s ease;">
                    📋 View Task Details
                  </a>
                  <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0 0;">Click to view the automatically created bug task for this support request</p>
                </div>
                
                <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 11px; margin: 0;">This is an automated notification from the TeamLabs support system.</p>
                  <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">&copy; ${currentYear} TeamLabs. All rights reserved.</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

export const releaseSummaryEmailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Release Notes: Website Redesign v2.0.0</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 40px 0;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
      <tr>
        <!-- Header Banner -->
        <td style="background: linear-gradient(135deg, #6B39E7 0%, #8B5CF6 100%); padding: 32px; text-align: center;">
          <div style="font-size: 11px; font-weight: 700; color: #c084fc; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">New Release Summary</div>
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">Website Redesign</h1>
          <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-top: 10px; backdrop-filter: blur(4px);">v2.0.0</div>
        </td>
      </tr>
      <tr>
        <td style="padding: 32px;">
          <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
            <h2 style="color: #1e293b; font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">Summer Update is Here!</h2>
            <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0;">We're excited to share the latest updates and bug fixes.</p>
          </div>
          
          <div style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 32px;">
            <h3 style="color: #1F1F1F; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 20px; margin-bottom: 10px;">✨ Features</h3>
            <li style="margin-left: 20px; margin-bottom: 6px; font-size: 13px; line-height: 1.5; color: #334155;">Added dark mode support for all components</li>
            <li style="margin-left: 20px; margin-bottom: 6px; font-size: 13px; line-height: 1.5; color: #334155;">New dashboard analytics widget</li>
            
            <h3 style="color: #1F1F1F; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 20px; margin-bottom: 10px;">🐛 Bug Fixes</h3>
            <li style="margin-left: 20px; margin-bottom: 6px; font-size: 13px; line-height: 1.5; color: #334155;">Fixed navigation bar spacing on mobile view</li>
            <li style="margin-left: 20px; margin-bottom: 6px; font-size: 13px; line-height: 1.5; color: #334155;">Resolved memory leak in chat component</li>
          </div>
          
          <div style="text-align: center; margin-bottom: 32px; padding-top: 8px;">
            <a href="#" style="display: inline-block; background: #6B39E7; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 13px; transition: all 0.2s;">
              🚀 Go to TeamLabs Workspace
            </a>
          </div>
          
          <div style="text-align: center; padding-top: 24px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 11px;">
            <p style="margin: 0 0 6px 0;">You received this email because you are a member of the <strong>Website Redesign</strong> project team.</p>
            <p style="margin: 0;">&copy; ${currentYear} TeamLabs. All rights reserved.</p>
          </div>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

export const roleChangeEmailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Role Has Been Updated</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <tr>
              <td style="padding: 40px 32px;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 32px;">
                  <div style="font-size: 24px; font-weight: 700; color: #6B39E7; letter-spacing: -0.5px; margin-bottom: 8px;">TeamLabs</div>
                  <div style="width: 40px; height: 2px; background: #6B39E7; margin: 0 auto;"></div>
                </div>
                
                <!-- Content -->
                <h1 style="color: #1F1F1F; font-size: 20px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">Role Updated</h1>
                <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0; text-align: center;">Hello John Doe,</p>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 32px 0; text-align: center;">The Organization Administrator has changed your role in <strong style="color: #6B39E7;">Acme Corp</strong> to <strong style="color: #1F1F1F;">Project Manager</strong>.</p>
                
                <!-- Info box -->
                <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-bottom: 32px;">
                  <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">This change is active immediately. You may need to refresh your page or log in again to see your updated permissions.</p>
                </div>
                
                <!-- Footer -->
                <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 11px; margin: 0;">&copy; ${currentYear} TeamLabs. All rights reserved.</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

export const welcomeEmailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to TeamLabs!</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
            <tr>
              <td style="padding: 40px 32px;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <div style="font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #6B39E7 0%, #a855f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; color: #6B39E7; letter-spacing: -0.5px; margin-bottom: 8px;">TeamLabs</div>
                  <div style="width: 50px; height: 3px; background: linear-gradient(135deg, #6B39E7 0%, #a855f7 100%); margin: 0 auto; border-radius: 2px;"></div>
                </div>
                <h1 style="color: #1F1F1F; font-size: 22px; font-weight: 700; margin: 0 0 16px 0; text-align: center;">Welcome to Your New Workspace! 🎉</h1>
                <p style="color: #4a5568; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">Hello <strong style="color: #1F1F1F;">John Doe</strong>, we are thrilled to have you here! Your email verification was successful, and your TeamLabs account is now fully active.</p>
                <div style="background: #f7fafc; border: 1px solid #edf2f7; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                  <h3 style="color: #2d3748; font-size: 14px; font-weight: 700; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">Quick Setup Guide</h3>
                  <ul style="margin: 0; padding: 0; list-style-type: none;">
                    <li style="margin-bottom: 12px; font-size: 14px; color: #4a5568;">⚡ <strong>Set up your profile:</strong> Personalize your role, avatar, and settings.</li>
                    <li style="margin-bottom: 12px; font-size: 14px; color: #4a5568;">⚡ <strong>Build your projects:</strong> Create a project space and define core milestones.</li>
                    <li style="margin-bottom: 12px; font-size: 14px; color: #4a5568;">⚡ <strong>Invite your team:</strong> Bring collaborators on board via email or link.</li>
                    <li style="font-size: 14px; color: #4a5568;">⚡ <strong>Track & report:</strong> Log your work with the time tracker widget.</li>
                  </ul>
                </div>
                <div style="text-align: center; margin-bottom: 32px;">
                  <a href="#" style="display: inline-block; background: linear-gradient(135deg, #6B39E7 0%, #a855f7 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 700;">Go to Dashboard</a>
                </div>
                <p style="color: #718096; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">If you have any questions, simply reply to this email or visit our help center. Let's build something awesome together!</p>
                <div style="text-align: center; padding-top: 24px; border-top: 1px solid #edf2f7; margin-top: 32px;">
                  <p style="color: #a0aec0; font-size: 11px; margin: 0;">&copy; ${currentYear} TeamLabs. All rights reserved.</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

export const premiumEmailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unlock Unlimited Potential - TeamLabs Premium</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc; color: #1f2937;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
            <tr>
              <td style="padding: 40px 32px;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <div style="font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; color: #f59e0b; letter-spacing: -0.5px; margin-bottom: 8px;">TeamLabs Premium</div>
                  <div style="width: 60px; height: 3px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); margin: 0 auto; border-radius: 2px;"></div>
                </div>
                <h1 style="color: #1f2937; font-size: 22px; font-weight: 700; margin: 0 0 16px 0; text-align: center;">Your Workspace Just Upgraded! 🌟</h1>
                <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">We are excited to announce that your organization <strong style="color: #1f2937;">Acme Corp</strong> is now on a <strong style="color: #d97706;">Premium subscription</strong>! Here are the powerful features now unlocked for all members:</p>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 32px; text-align: left;">
                  <h3 style="color: #d97706; font-size: 13px; font-weight: 700; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">Premium Features List</h3>
                  <div style="margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
                    <div style="font-weight: 700; color: #1f2937; font-size: 14px; margin-bottom: 4px;">🚀 Unlimited Projects & Teams</div>
                    <div style="color: #4b5563; font-size: 13px; line-height: 1.4;">Scale your work without limits or caps on project size.</div>
                  </div>
                  <div style="margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
                    <div style="font-weight: 700; color: #1f2937; font-size: 14px; margin-bottom: 4px;">🤖 RAG AI Assistant & ChatBot</div>
                    <div style="color: #4b5563; font-size: 13px; line-height: 1.4;">Query documents and extract insights instantly inside tasks.</div>
                  </div>
                  <div style="margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
                    <div style="font-weight: 700; color: #1f2937; font-size: 14px; margin-bottom: 4px;">📊 Comprehensive Reports & Analytics</div>
                    <div style="color: #4b5563; font-size: 13px; line-height: 1.4;">Generate detailed PDF performance reports and burndown metrics.</div>
                  </div>
                  <div style="margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
                    <div style="font-weight: 700; color: #1f2937; font-size: 14px; margin-bottom: 4px;">⏰ Advanced Timesheets & Timelines</div>
                    <div style="color: #4b5563; font-size: 13px; line-height: 1.4;">Seamless sprint planning and resource utilization metrics.</div>
                  </div>
                  <div>
                    <div style="font-weight: 700; color: #1f2937; font-size: 14px; margin-bottom: 4px;">🎨 Custom Roles & Indicators</div>
                    <div style="color: #4b5563; font-size: 13px; line-height: 1.4;">Customize your statuses and user roles for a fully bespoke workspace.</div>
                  </div>
                </div>
                <div style="text-align: center; margin-bottom: 32px;">
                  <a href="#" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 700;">Explore Premium Features</a>
                </div>
                <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">This is a group announcement sent to all active members of the workspace.</p>
                <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e2e8f0; margin-top: 32px;">
                  <p style="color: #9ca3af; font-size: 11px; margin: 0;">&copy; ${currentYear} TeamLabs. All rights reserved.</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;
