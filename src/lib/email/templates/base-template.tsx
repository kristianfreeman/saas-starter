import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import React from 'react';

interface BaseTemplateProps {
  preview: string;
  children: React.ReactNode;
}

export const BaseTemplate: React.FC<BaseTemplateProps> = ({
  preview,
  children,
}) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src={`${process.env.PUBLIC_APP_URL || 'http://localhost:4321'}/logo.png`}
              width="48"
              height="48"
              alt="Logo"
              style={logo}
            />
            <Text style={headerText}>
              {process.env.PUBLIC_APP_NAME || 'SaaS Starter'}
            </Text>
          </Section>
          
          {children}
          
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} {process.env.PUBLIC_APP_NAME || 'SaaS Starter'}. All rights reserved.
            </Text>
            <Link href={process.env.PUBLIC_APP_URL || 'http://localhost:4321'} style={footerLink}>
              Visit our website
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f4f4f4',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
};

const header = {
  textAlign: 'center' as const,
  padding: '24px 0',
  borderBottom: '1px solid #e4e4e7',
};

const logo = {
  margin: '0 auto',
  marginBottom: '16px',
};

const headerText = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0',
};

const footer = {
  textAlign: 'center' as const,
  padding: '24px 0',
  borderTop: '1px solid #e4e4e7',
  marginTop: '32px',
};

const footerText = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0 0 8px 0',
};

const footerLink = {
  fontSize: '14px',
  color: '#3b82f6',
  textDecoration: 'none',
};