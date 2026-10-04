import nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendMailOptions): Promise<boolean> {
  // Always log for local development visibility
  console.log(`\n============== [EMAIL SENT] ==============`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${html}`);
  console.log(`==========================================\n`);

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || '"Invoice Generator" <noreply@invoicegen.com>';

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      return true;
    } catch (error) {
      console.error('Failed to send email via SMTP:', error);
      return false;
    }
  }

  // Fallback dev mode success
  return true;
}

export async function sendInvitationEmail(
  toEmail: string,
  workspaceName: string,
  inviterName: string,
  activationUrl: string
) {
  const subject = `Undangan Bergabung ke Workspace "${workspaceName}" - Invoice Generator`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e293b;">Halo!</h2>
      <p style="color: #334155; font-size: 16px;">
        <strong>${inviterName}</strong> mengundang Anda untuk bergabung dengan workspace <strong>"${workspaceName}"</strong> di platform Invoice Generator.
      </p>
      <p style="color: #334155; font-size: 16px;">
        Untuk mulai menggunakan akun Anda, silakan klik tombol di bawah ini untuk melakukan <strong>aktivasi akun</strong> dan menyetel kata sandi Anda:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${activationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block;">
          Aktivasi Akun Saya
        </a>
      </div>
      <p style="color: #64748b; font-size: 14px;">
        Atau salin dan tempel tautan berikut ke browser Anda:<br/>
        <a href="${activationUrl}" style="color: #2563eb;">${activationUrl}</a>
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
      <p style="color: #94a3b8; font-size: 12px;">Tautan ini berlaku selama 48 jam. Jika Anda tidak merasa meminta undangan ini, abaikan email ini.</p>
    </div>
  `;

  return sendEmail({ to: toEmail, subject, html });
}
