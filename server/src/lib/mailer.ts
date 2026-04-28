import sgMail from '@sendgrid/mail';

function isConfigured() {
  return Boolean(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM);
}

export async function sendEmail(params: { to: string; subject: string; text: string; html?: string }) {
  if (!isConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[mailer] SENDGRID_API_KEY or SENDGRID_FROM not set; skipping email send', {
        to: params.to,
        subject: params.subject,
      });
    }
    return;
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

  await sgMail.send({
    to: params.to,
    from: process.env.SENDGRID_FROM as string,
    subject: params.subject,
    text: params.text,
    html: params.html,
  });
}
