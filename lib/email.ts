// ============================================
// ArcDoc Enterprise - Email Service
// ============================================

import nodemailer from 'nodemailer';
import { config } from './config';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export type EmailVariables = Record<string, string | number | boolean>;

function getDefaultTemplate(
  title: string,
  body: string,
  actionUrl?: string,
  actionLabel?: string
): string {
  return `<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title><style>body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8f9fa}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#1a73e8;color:#fff;padding:24px;text-align:center;border-radius:8px 8px 0 0}.header h1{margin:0;font-size:20px}.content{background:#fff;padding:32px;border-radius:0 0 8px 8px}.content p{color:#333;line-height:1.6;margin:0 0 16px}.button{display:inline-block;background:#1a73e8;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:500;margin-top:16px}.footer{text-align:center;padding:24px;color:#6c757d;font-size:12px}</style></head><body><div class="container"><div class="header"><h1>${config.app.name}</h1></div><div class="content">${body}${actionUrl && actionLabel ? `<a href="${actionUrl}" class="button">${actionLabel}</a>` : ''}</div><div class="footer"><p>Acest email a fost generat automat.</p><p>&copy; ${new Date().getFullYear()} ${config.app.companyName}</p></div></div></body></html>`;
}

export function replaceTemplateVariables(template: string, variables: EmailVariables): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), String(value));
  }
  return result;
}

export function buildEmail(slug: string, variables: EmailVariables, toEmail: string, toName?: string): EmailOptions {
  const appName = config.app.name;
  const appUrl = config.app.url;

  switch (slug) {
    case 'account-confirmation':
      return {
        to: toEmail,
        subject: `${appName} - Confirmare cont`,
        html: getDefaultTemplate('Confirmare cont',
          `<p>Bună ziua${toName ? ' ' + toName : ''},</p><p>Contul dvs. pe platforma ${appName} a fost creat. Accesați butonul de mai jos pentru a seta parola.</p>`,
          `${appUrl}/auth/reset-password?token=${variables.token}`, 'Setează parola'),
      };
    case 'password-reset':
      return {
        to: toEmail,
        subject: `${appName} - Resetare parolă`,
        html: getDefaultTemplate('Resetare parolă',
          `<p>Bună ziua${toName ? ' ' + toName : ''},</p><p>Ați solicitat resetarea parolei. Accesați butonul de mai jos.</p><p>Link-ul este valabil 1 oră.</p>`,
          `${appUrl}/auth/reset-password?token=${variables.token}`, 'Resetează parola'),
      };
    case 'password-changed':
      return {
        to: toEmail,
        subject: `${appName} - Parola a fost schimbată`,
        html: getDefaultTemplate('Parolă schimbată',
          `<p>Bună ziua${toName ? ' ' + toName : ''},</p><p>Parola dvs. a fost schimbată cu succes. Dacă nu ați făcut această schimbare, contactați imediat administratorul.</p>`),
      };
    case 'account-locked':
      return {
        to: toEmail,
        subject: `${appName} - Cont blocat temporar`,
        html: getDefaultTemplate('Cont blocat',
          `<p>Bună ziua${toName ? ' ' + toName : ''},</p><p>Contul dvs. a fost blocat temporar din cauza mai multor încercări de autentificare eșuate. Contactați administratorul pentru deblocare.</p>`),
      };
    default:
      return {
        to: toEmail,
        subject: `${appName} - Notificare`,
        html: getDefaultTemplate('Notificare', `<p>${variables.message || 'Notificare nouă.'}</p>`),
      };
  }
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: { user: config.email.user, pass: config.email.pass },
    });
  }
  return transporter;
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    const info = await getTransporter().sendMail({
      from: options.from || config.email.from,
      to: Array.isArray(options.to) ? options.to.join(',') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Send failed:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function sendTransactionalEmail(
  templateSlug: string, variables: EmailVariables, toEmail: string, toName?: string
): Promise<EmailResult> {
  const emailOptions = buildEmail(templateSlug, variables, toEmail, toName);
  return sendEmail(emailOptions);
}

export default { sendEmail, sendTransactionalEmail, buildEmail, replaceTemplateVariables };