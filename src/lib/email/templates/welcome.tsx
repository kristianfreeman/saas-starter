import {
  Button,
  Heading,
  Hr,
  Link,
  Section,
  Text,
} from '@react-email/components';
import React from 'react';
import { BaseTemplate } from './base-template';

interface WelcomeEmailProps {
  name: string;
  email: string;
  loginUrl: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  name,
  email,
  loginUrl,
}) => {
  const preview = `Welcome to ${process.env.PUBLIC_APP_NAME || 'SaaS Starter'}, ${name}!`;

  return (
    <BaseTemplate preview={preview}>
      <Section style={content}>
        <Heading style={heading}>Welcome to {process.env.PUBLIC_APP_NAME || 'SaaS Starter'}!</Heading>
        
        <Text style={paragraph}>Hi {name},</Text>
        
        <Text style={paragraph}>
          Thanks for signing up! We're excited to have you on board. Your account has been created successfully with the email address: <strong>{email}</strong>
        </Text>
        
        <Section style={buttonContainer}>
          <Button style={button} href={loginUrl}>
            Get Started
          </Button>
        </Section>
        
        <Hr style={hr} />
        
        <Heading as="h2" style={subheading}>What's next?</Heading>
        
        <Text style={paragraph}>Here are a few things you can do to get the most out of your account:</Text>
        
        <ul style={list}>
          <li style={listItem}>
            <strong>Complete your profile</strong> - Add more information about yourself
          </li>
          <li style={listItem}>
            <strong>Explore features</strong> - Check out all the tools available to you
          </li>
          <li style={listItem}>
            <strong>Invite team members</strong> - Collaborate with your team
          </li>
        </ul>
        
        <Text style={paragraph}>
          If you have any questions or need help getting started, don't hesitate to{' '}
          <Link href="mailto:support@saas-starter.com" style={link}>
            contact our support team
          </Link>
          .
        </Text>
        
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

const subheading = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1a1a1a',
  marginTop: '32px',
  marginBottom: '16px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4b5563',
  marginBottom: '16px',
};

const list = {
  paddingLeft: '20px',
  marginBottom: '16px',
};

const listItem = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4b5563',
  marginBottom: '8px',
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

const hr = {
  borderColor: '#e4e4e7',
  margin: '32px 0',
};

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
};

export default WelcomeEmail;