
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'WritgoAI.nl',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'support@WritgoAI.nl',
    pass: process.env.SMTP_PASS || 'CM120309cm!!',
  },
});

export async function POST(request: NextRequest) {
  try {
    const { severity, message, counts, timestamp } = await request.json();
    
    // Send email to admin
    await transporter.sendMail({
      from: process.env.SMTP_USER || 'support@WritgoAI.nl',
      to: 'info@WritgoAI.nl',
      subject: `🚨 [${severity}] Database Alert - WritgoAI`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; }
            .stats { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .footer { background: #1f2937; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; }
            .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 Database Alert</h1>
              <p style="margin: 0; opacity: 0.9;">WritgoAI Monitoring System</p>
            </div>
            
            <div class="content">
              <div class="alert-box">
                <h2 style="margin-top: 0; color: #dc2626;">⚠️ ${severity} Alert</h2>
                <p><strong>Message:</strong> ${message}</p>
                <p><strong>Time:</strong> ${timestamp || new Date().toISOString()}</p>
              </div>
              
              <div class="stats">
                <h3>📊 Current Database Status</h3>
                <div class="stat-row">
                  <span>Clients:</span>
                  <strong>${counts?.clients || 0}</strong>
                </div>
                <div class="stat-row">
                  <span>Projects:</span>
                  <strong>${counts?.projects || 0}</strong>
                </div>
                <div class="stat-row">
                  <span>Saved Content:</span>
                  <strong>${counts?.content || 0}</strong>
                </div>
                <div class="stat-row">
                  <span>Article Ideas:</span>
                  <strong>${counts?.ideas || 0}</strong>
                </div>
              </div>
              
              <p><strong>⚡ Immediate Action Required:</strong></p>
              <ol>
                <li>Check database connection status</li>
                <li>Verify latest backup is available</li>
                <li>Review application logs for errors</li>
                <li>Contact Abacus.AI support if data loss detected</li>
              </ol>
              
              <a href="https://WritgoAI.nl/admin/dashboard" class="btn">
                🔧 Open Admin Dashboard
              </a>
              
              <div style="background: #fff7ed; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0;">
                <h4 style="margin-top: 0;">📋 Recovery Information</h4>
                <p><strong>Database ID:</strong> 660998b92</p>
                <p><strong>Host:</strong> db-660998b92.db002.hosteddb.reai.io</p>
                <p><strong>Backup Location:</strong> /home/ubuntu/database_backups/</p>
                <p><strong>Support Email:</strong> support@abacus.ai</p>
              </div>
            </div>
            
            <div class="footer">
              <p>WritgoAI Database Monitoring System</p>
              <p style="font-size: 12px; opacity: 0.8;">This is an automated alert. Do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
DATABASE ALERT - WritgoAI

Severity: ${severity}
Message: ${message}
Time: ${timestamp || new Date().toISOString()}

Current Database Status:
- Clients: ${counts?.clients || 0}
- Projects: ${counts?.projects || 0}
- Saved Content: ${counts?.content || 0}
- Article Ideas: ${counts?.ideas || 0}

Immediate Action Required:
1. Check database connection status
2. Verify latest backup is available
3. Review application logs for errors
4. Contact Abacus.AI support if data loss detected

Recovery Information:
- Database ID: 660998b92
- Host: db-660998b92.db002.hosteddb.reai.io
- Backup Location: /home/ubuntu/database_backups/
- Support Email: support@abacus.ai

Admin Dashboard: https://WritgoAI.nl/admin/dashboard
      `
    });
    
    console.log('✅ Database alert email sent successfully');
    
    return NextResponse.json({ 
      success: true,
      message: 'Alert sent successfully'
    });
  } catch (error) {
    console.error('❌ Failed to send database alert:', error);
    return NextResponse.json({ 
      error: 'Failed to send alert',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
