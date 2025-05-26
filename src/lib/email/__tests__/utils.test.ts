import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendEmail } from '../utils';

// Mock the resend client
vi.mock('../client', () => ({
  resend: {
    emails: {
      send: vi.fn(),
    },
  },
  emailConfig: {
    from: {
      name: 'Test App',
      email: 'noreply@test.com',
    },
    replyTo: 'support@test.com',
  },
  isEmailConfigured: vi.fn(() => true),
}));

import { resend } from '../client';

describe('Email Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PUBLIC_APP_URL = 'http://localhost:4321';
    process.env.PUBLIC_APP_NAME = 'Test App';
  });

  describe('sendEmail', () => {
    it('should send an email successfully', async () => {
      const mockResponse = { data: { id: 'email-123' }, error: null };
      vi.mocked(resend!.emails.send).mockResolvedValueOnce(mockResponse);

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      });

      expect(result.data).toEqual({ id: 'email-123' });
      expect(result.error).toBeUndefined();
      expect(resend!.emails.send).toHaveBeenCalledWith({
        from: 'Test App <noreply@test.com>',
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: undefined,
        reply_to: 'support@test.com',
      });
    });

    it('should handle email sending errors', async () => {
      const mockError = { data: null, error: { message: 'Failed to send' } };
      vi.mocked(resend!.emails.send).mockResolvedValueOnce(mockError);

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      });

      expect(result.error).toEqual({ message: 'Failed to send' });
      expect(result.data).toBeUndefined();
    });

    it('should handle exceptions', async () => {
      vi.mocked(resend!.emails.send).mockRejectedValueOnce(new Error('Network error'));

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      });

      expect(result.error).toEqual({ message: 'Failed to send email' });
      expect(result.data).toBeUndefined();
    });

    it('should support custom from address', async () => {
      const mockResponse = { data: { id: 'email-123' }, error: null };
      vi.mocked(resend!.emails.send).mockResolvedValueOnce(mockResponse);

      await sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        from: {
          name: 'Custom Sender',
          email: 'custom@example.com',
        },
      });

      expect(resend!.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'Custom Sender <custom@example.com>',
        })
      );
    });

    it('should support multiple recipients', async () => {
      const mockResponse = { data: { id: 'email-123' }, error: null };
      vi.mocked(resend!.emails.send).mockResolvedValueOnce(mockResponse);

      await sendEmail({
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Test Email',
        html: '<p>Test content</p>',
      });

      expect(resend!.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['user1@example.com', 'user2@example.com'],
        })
      );
    });
  });
});

