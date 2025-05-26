import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components';
import React from 'react';
import { BaseTemplate } from './base-template';

interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
  expiresIn?: string;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  name,
  resetUrl,
  expiresIn = '1 hour',
}) => {
  const preview = 'Reset your password';

  return (
    <BaseTemplate preview={preview}>
      <Section style={content}>
        <Heading style={heading}>Reset Your Password</Heading>
        
        <Text style={paragraph}>Hi {name},</Text>
        
        <Text style={paragraph}>
          We received a request to reset your password. Click the button below to create a new password:
        </Text>
        
        <Section style={buttonContainer}>
          <Button style={button} href={resetUrl}>
            Reset Password
          </Button>
        </Section>
        
        <Text style={paragraph}>
          This link will expire in <strong>{expiresIn}</strong>. If you didn't request a password reset, you can safely ignore this email.
        </Text>
        
        <Text style={smallText}>
          If the button doesn't work, copy and paste this link into your browser:
        </Text>
        <Text style={linkText}>{resetUrl}</Text>
        
        <Text style={paragraph}>
          Best regards,
          <br />
          The {process.env.PUBLIC_APP_NAME || 'SaaS Starter'} Team
        </Text>
      </Section>
    </BaseTemplate>
  );
};

const content = {
  padding: '32px 48px',
};

const heading = {
  fontSize: '28px',
  fontWeight: '600',
  color: '#1a1a1a',
  marginBottom: '24px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4b5563',
  marginBottom: '16px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const smallText = {
  fontSize: '14px',
  color: '#6b7280',
  marginTop: '32px',
  marginBottom: '8px',
};

const linkText = {
  fontSize: '14px',
  color: '#3b82f6',
  wordBreak: 'break-all' as const,
  marginBottom: '32px',
};

export default PasswordResetEmail;