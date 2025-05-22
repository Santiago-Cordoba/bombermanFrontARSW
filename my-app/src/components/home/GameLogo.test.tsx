import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import GameLogo from './GameLogo';

// Mock para BlinkingText
vi.mock('./BlinkingText', () => ({
  default: () => <div data-testid="mocked-blinking-text">Mocked Blinking Text</div>
}));

// Mock para la imagen de fondo
vi.mock('../../images/fondo2.jpg', () => ({
  default: 'mocked-background-image.jpg'
}));

describe('GameLogo Component', () => {
  it('renderiza correctamente con la imagen de fondo', () => {
    const { getByAltText } = render(<GameLogo />);
    
    const backgroundImage = getByAltText('Bomberman Logo');
    expect(backgroundImage).toBeInTheDocument();
    expect(backgroundImage).toHaveAttribute('src', 'mocked-background-image.jpg');
    expect(backgroundImage).toHaveClass('w-full', 'h-full', 'object-cover');
  });

  it('incluye el componente BlinkingText', () => {
    const { getByTestId } = render(<GameLogo />);
    
    expect(getByTestId('mocked-blinking-text')).toBeInTheDocument();
  });
}); 