import { render } from '@react-email/components';
import React from 'react';
import { resend, emailConfig, isEmailConfigured } from './client';
import WelcomeEmail from './templates/welcome';
import PasswordResetEmail from './templates/password-reset';
import VerificationEmail from './templates/verification';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: {
    name: string;
    email: string;
  };
  replyTo?: string;
}

export interface SendEmailResult {
  data?: { id: string };
  error?: { message: string };
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<SendEmailResult> {
  if (!isEmailConfigured()) {
    console.warn('Email is not configured. Skipping email send.');
    return { error: { message: 'Email service not configured' } };
  }

  try {
    const { data, error } = await resend!.emails.send({
      from: options.from ? `${options.from.name} <${options.from.email}>` : `${emailConfig.from.name} <${emailConfig.from.email}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo || emailConfig.replyTo,
    });

    if (error) {
      return { error: { message: error.message } };
    }

    return { data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { error: { message: 'Failed to send email' } };
  }
}

/**
 * Send a welcome email to a new user
 */
export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
}): Promise<SendEmailResult> {
  const { to, name } = params;
  const loginUrl = `${process.env.PUBLIC_APP_URL || 'http://localhost:4321'}/auth/login`;

  const html = render(
    WelcomeEmail({
      name,
      email: to,
      loginUrl,
    })
  );

  return sendEmail({
    to,
    subject: `Welcome to ${process.env.PUBLIC_APP_NAME || 'SaaS Starter'}!`,
    html,
  });
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetToken: string;
}): Promise<SendEmailResult> {
  const { to, name, resetToken } = params;
  const resetUrl = `${process.env.PUBLIC_APP_URL || 'http://localhost:4321'}/auth/reset-password?token=${resetToken}`;

  const html = render(
    PasswordResetEmail({
      name,
      resetUrl,
      expiresIn: '1 hour',
    })
  );

  return sendEmail({
    to,
    subject: 'Reset your password',
    html,
  });
}

/**
 * Send an email verification email
 */
export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  verificationToken: string;
}): Promise<SendEmailResult> {
  const { to, name, verificationToken } = params;
  const verificationUrl = `${process.env.PUBLIC_APP_URL || 'http://localhost:4321'}/auth/verify-email?token=${verificationToken}`;

  const html = render(
    VerificationEmail({
      name,
      verificationUrl,
      expiresIn: '24 hours',
    })
  );

  return sendEmail({
    to,
    subject: 'Verify your email address',
    html,
  });
}

/**
 * Send a custom email using a React Email template
 */
export async function sendTemplateEmail<T extends Record<string, any>>(params: {
  to: string | string[];
  subject: string;
  template: React.FC<T>;
  props: T;
}): Promise<SendEmailResult> {
  const { to, subject, template: Template, props } = params;

  const html = render(React.createElement(Template, props));

  return sendEmail({
    to,
    subject,
    html,
  });
}