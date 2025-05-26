export { resend, emailConfig, isEmailConfigured } from './client';
export {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendTemplateEmail,
  type EmailOptions,
  type SendEmailResult,
} from './utils';

// Export templates for custom usage
export { default as WelcomeEmail } from './templates/welcome';
export { default as PasswordResetEmail } from './templates/password-reset';
export { default as VerificationEmail } from './templates/verification';
export { BaseTemplate } from './templates/base-template';