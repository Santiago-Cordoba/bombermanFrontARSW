import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RetroButton from './RetroButton';

describe('RetroButton Component', () => {
  it('renderiza el botón con el texto "Empezar"', () => {
    render(<RetroButton onClick={() => {}} />);
    const button = screen.getByText('Empezar');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('retro-button');
  });

  it('aplica las clases CSS correctas', () => {
    const { container } = render(<RetroButton onClick={() => {}} />);
    const buttonContainer = container.querySelector('.button-container');
    const button = screen.getByText('Empezar');
    
    expect(buttonContainer).toBeInTheDocument();
    expect(button).toHaveClass('retro-button');
  });

  it('ejecuta la función onClick cuando se hace clic en el botón', () => {
    const mockOnClick = vi.fn();
    render(<RetroButton onClick={mockOnClick} />);
    
    const button = screen.getByText('Empezar');
    fireEvent.click(button);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
}); 