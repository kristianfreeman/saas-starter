import type { APIRoute } from 'astro';
import { sendWelcomeEmail, sendPasswordResetEmail, sendVerificationEmail } from '@/lib/email';

export const POST: APIRoute = async ({ request }) => {
  // Only allow in development
  if (import.meta.env.PROD) {
    return new Response(JSON.stringify({ error: 'Not available in production' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { template, to } = await request.json();

    if (!template || !to) {
      return new Response(JSON.stringify({ error: 'Missing template or email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let result;

    switch (template) {
      case 'welcome':
        result = await sendWelcomeEmail({
          to,
          name: 'Test User',
        });
        break;
      
      case 'password-reset':
        result = await sendPasswordResetEmail({
          to,
          name: 'Test User',
          resetToken: 'test-reset-token-123',
        });
        break;
      
      case 'verification':
        result = await sendVerificationEmail({
          to,
          name: 'Test User',
          verificationToken: 'test-verification-token-123',
        });
        break;
      
      default:
        return new Response(JSON.stringify({ error: 'Invalid template' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data: result.data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return new Response(JSON.stringify({ error: 'Failed to send test email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};