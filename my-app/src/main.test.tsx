import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import App from './App';
import React from 'react';

// Mock for createRoot
const mockRender = vi.fn();
const mockCreateRoot = vi.fn(() => ({
  render: mockRender
}));

vi.mock('react-dom/client', () => ({
  createRoot: mockCreateRoot
}));

// Mock for App
vi.mock('./App', () => ({
  default: () => <div data-testid="mock-app"></div>
}));

// Mock document.getElementById
const mockRootElement = document.createElement('div');
mockRootElement.id = 'root';

const originalGetElementById = document.getElementById;

describe('main (initialization tests)', () => {
  beforeEach(() => {
    document.getElementById = vi.fn((id) => {
      if (id === 'root') return mockRootElement;
      return null;
    });
    
    // Add the mock root element to the body
    document.body.appendChild(mockRootElement);
  });
  
  afterEach(() => {
    document.getElementById = originalGetElementById;
    if (mockRootElement.parentNode) {
      mockRootElement.parentNode.removeChild(mockRootElement);
    }
    vi.clearAllMocks();
  });

  it('renders App component into root element', async () => {
    // Import the module to trigger its execution
    // Use dynamic import without extension for TypeScript
    await import('./main');
    
    // Verify that createRoot was called with the root element
    expect(mockCreateRoot).toHaveBeenCalledWith(mockRootElement);
    expect(mockRender).toHaveBeenCalled();
  });
}); 