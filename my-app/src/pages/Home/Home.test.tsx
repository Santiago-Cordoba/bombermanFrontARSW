import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HomePage from './Home';

// Mock de useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await import('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock del componente RetroButton
vi.mock('../../components/Buttons/RetroButton/RetroButton', () => ({
  default: ({ onClick }: { onClick: () => void }) => (
    <button data-testid="mock-retro-button" onClick={onClick}>
      Empezar
    </button>
  ),
}));

describe('HomePage Component', () => {
  it('renders with correct background', () => {
    const { container } = render(<HomePage />);
    const homeContainer = container.querySelector('.homepage-container');
    expect(homeContainer).toBeInTheDocument();
    expect(homeContainer).toHaveStyle('background-image: url(/src/images/f1.png)');
  });

  it('renders RetroButton component', () => {
    render(<HomePage />);
    expect(screen.getByTestId('mock-retro-button')).toBeInTheDocument();
  });

  it('navigates to /login when button is clicked', () => {
    render(<HomePage />);
    const startButton = screen.getByTestId('mock-retro-button');
    fireEvent.click(startButton);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
}); 