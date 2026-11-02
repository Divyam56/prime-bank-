import test from 'node:test';
import assert from 'node:assert/strict';
import { getInitialTheme, applyTheme, THEME_STORAGE_KEY, ThemeMode } from './theme.js';

class MockStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
}

test('getInitialTheme retrieves saved dark theme from storage', () => {
  const mockStorage = new MockStorage();
  mockStorage.setItem(THEME_STORAGE_KEY, 'dark');
  assert.equal(getInitialTheme(mockStorage as any), 'dark');
});

test('getInitialTheme retrieves saved light theme from storage', () => {
  const mockStorage = new MockStorage();
  mockStorage.setItem(THEME_STORAGE_KEY, 'light');
  assert.equal(getInitialTheme(mockStorage as any), 'light');
});

test('getInitialTheme defaults to light when storage is empty', () => {
  const mockStorage = new MockStorage();
  assert.equal(getInitialTheme(mockStorage as any), 'light');
});

test('applyTheme saves updated mode to storage', () => {
  const mockStorage = new MockStorage();
  applyTheme('dark', mockStorage as any);
  assert.equal(mockStorage.getItem(THEME_STORAGE_KEY), 'dark');

  applyTheme('light', mockStorage as any);
  assert.equal(mockStorage.getItem(THEME_STORAGE_KEY), 'light');
});
