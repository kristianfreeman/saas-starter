import { Resend } from 'resend';
import { env } from '@/lib/env';

// Initialize Resend client
export const resend = env.RESEND_API_KEY 
  ? new Resend(env.RESEND_API_KEY)
  : null;

// Email configuration
export const emailConfig = {
  from: {
    name: env.PUBLIC_APP_NAME || 'SaaS Starter',
    email: 'noreply@saas-starter.com', // Change this to your domain
  },
  replyTo: 'support@saas-starter.com', // Change this to your support email
};

// Check if email is configured
export const isEmailConfigured = (): boolean => {
  return !!resend;
};