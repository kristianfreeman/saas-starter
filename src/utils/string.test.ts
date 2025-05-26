import { describe, it, expect } from 'vitest';
import { capitalize, slugify, truncate } from './string';

describe('String utilities', () => {
  describe('capitalize', () => {
    it('should capitalize the first letter of a string', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('WORLD');
      expect(capitalize('123abc')).toBe('123abc');
    });

    it('should handle empty strings', () => {
      expect(capitalize('')).toBe('');
    });

    it('should handle single character strings', () => {
      expect(capitalize('a')).toBe('A');
      expect(capitalize('Z')).toBe('Z');
    });
  });

  describe('slugify', () => {
    it('should convert a string to a URL-friendly slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('This is a TEST')).toBe('this-is-a-test');
      expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
    });

    it('should remove special characters', () => {
      expect(slugify('Hello, World!')).toBe('hello-world');
      expect(slugify('Test@#$%^&*()')).toBe('test');
      expect(slugify('Price: $99.99')).toBe('price-9999');
    });

    it('should handle edge cases', () => {
      expect(slugify('')).toBe('');
      expect(slugify('---')).toBe('');
      expect(slugify('___test___')).toBe('test');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('This is a long string', 10)).toBe('This is...');
      expect(truncate('Hello World', 5)).toBe('He...');
    });

    it('should not truncate short strings', () => {
      expect(truncate('Short', 10)).toBe('Short');
      expect(truncate('Test', 4)).toBe('Test');
    });

    it('should use custom suffix', () => {
      expect(truncate('Long string here', 10, '…')).toBe('Long stri…');
      expect(truncate('Another test', 8, ' →')).toBe('Anothe →');
    });

    it('should handle edge cases', () => {
      expect(truncate('', 10)).toBe('');
      expect(truncate('Test', 0)).toBe('...');
      expect(truncate('Test', 3)).toBe('...');
    });
  });
});