import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';

Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => '123e4567-e89b-12d3-a456-426614174000',
  },
});

vi.stubGlobal('fetch', vi.fn());

afterEach(() => {
  vi.restoreAllMocks();
});