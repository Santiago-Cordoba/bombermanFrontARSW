import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import BlinkingText from './BlinkingText';

describe('BlinkingText Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });
  
  it('renderiza el texto por defecto', () => {
    render(<BlinkingText />);
    
    expect(screen.getByText('Da click para empezar a jugar')).toBeInTheDocument();
  });
  
  it('acepta un texto personalizado como prop', () => {
    const customText = 'Texto personalizado';
    render(<BlinkingText text={customText} />);
    
    expect(screen.getByText(customText)).toBeInTheDocument();
  });
  
  it('inicia con el texto visible (opacidad 100)', () => {
    render(<BlinkingText />);
    
    const textElement = screen.getByText('Da click para empezar a jugar');
    expect(textElement.className).toContain('opacity-100');
    expect(textElement.className).not.toContain('opacity-0');
  });
  
  it('cambia la visibilidad después del intervalo', async () => {
    render(<BlinkingText />);
    
    const textElement = screen.getByText('Da click para empezar a jugar');
    
    // Inicialmente visible
    expect(textElement.className).toContain('opacity-100');
    
    // Avanzar el tiempo 500ms dentro de act
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    // Ahora debería estar invisible
    expect(textElement.className).toContain('opacity-0');
    expect(textElement.className).not.toContain('opacity-100');
    
    // Avanzar otros 500ms dentro de act
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    // Debería volver a estar visible
    expect(textElement.className).toContain('opacity-100');
    expect(textElement.className).not.toContain('opacity-0');
  });
  
  it('limpia el intervalo al desmontar el componente', () => {
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    
    const { unmount } = render(<BlinkingText />);
    unmount();
    
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
}); 