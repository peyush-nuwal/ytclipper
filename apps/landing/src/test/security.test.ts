import { describe, it, expect } from 'vitest';
import { isValidEmail, detectBot } from '../lib/security';

describe('Security Functions', () => {
  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
      expect(isValidEmail('user_name@example-domain.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test..email@example.com')).toBe(false);
      expect(isValidEmail('test@example..com')).toBe(false);
    });

    it('should reject suspicious email patterns', () => {
      expect(isValidEmail('test++multiple@example.com')).toBe(false);
      expect(isValidEmail('test...dots@example.com')).toBe(false);
      expect(isValidEmail('test@example@com')).toBe(false);
      expect(isValidEmail('test<script>@example.com')).toBe(false);
    });

    it('should handle email length limits', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(isValidEmail(longEmail)).toBe(false);

      const validLengthEmail = 'test@example.com';
      expect(isValidEmail(validLengthEmail)).toBe(true);
    });
  });

  describe('detectBot', () => {
    it('should detect common bot user agents', () => {
      expect(detectBot('Mozilla/5.0 (compatible; Googlebot/2.1')).toBe(true);
      expect(detectBot('curl/7.68.0')).toBe(true);
      expect(detectBot('python-requests/2.25.1')).toBe(true);
      expect(detectBot('axios/0.21.1')).toBe(true);
      expect(detectBot('PostmanRuntime/7.28.0')).toBe(true);
    });

    it('should allow legitimate browser user agents', () => {
      const chromeUA =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      const firefoxUA =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
      const safariUA =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Version/14.1.1 Safari/537.36';

      const browserHeaders = {
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.5',
        'accept-encoding': 'gzip, deflate',
      };

      expect(detectBot(chromeUA, browserHeaders)).toBe(false);
      expect(detectBot(firefoxUA, browserHeaders)).toBe(false);
      expect(detectBot(safariUA, browserHeaders)).toBe(false);
    });

    it('should detect missing user agent as bot', () => {
      expect(detectBot()).toBe(true);
      expect(detectBot('')).toBe(true);
    });

    it('should detect missing browser headers as suspicious', () => {
      const normalUA =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      const incompleteHeaders = {
        accept: 'text/html',
        // Missing accept-language and accept-encoding
      };

      expect(detectBot(normalUA, incompleteHeaders)).toBe(true);
    });
  });
});
