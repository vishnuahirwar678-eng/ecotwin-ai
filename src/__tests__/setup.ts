import '@testing-library/jest-dom';

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = function () {};

// Mock window.matchMedia for theme context
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => Object.keys(store).forEach(k => delete store[k]),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

declare global {
  const vi: {
    fn: () => ReturnType<typeof import('vitest')['vi']['fn']>;
  };
}
