import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlayerController from './PlayerMovement';

describe('PlayerController Component', () => {
  const mockOnPositionChange = vi.fn();
  const mockOnPlaceBomb = vi.fn();
  
  const defaultProps = {
    initialPosition: { row: 5, col: 5 },
    boardSize: 10,
    onPositionChange: mockOnPositionChange,
    onPlaceBomb: mockOnPlaceBomb,
    walls: [{ row: 5, col: 6 }], // Pared a la derecha
    bombs: [{ row: 4, col: 5 }], // Bomba arriba
    children: <div>Player</div>
  };
  
  beforeEach(() => {
    mockOnPositionChange.mockClear();
    mockOnPlaceBomb.mockClear();
  });

  it('renderiza los children correctamente', () => {
    const { getByText } = render(<PlayerController {...defaultProps} />);
    expect(getByText('Player')).toBeInTheDocument();
  });

  it('llama a onPositionChange cuando se presiona una tecla de dirección válida', () => {
    render(<PlayerController {...defaultProps} />);
    
    // Simular tecla flecha abajo (posición válida)
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(mockOnPositionChange).toHaveBeenCalledWith('DOWN');
  });

  it('no llama a onPositionChange si la dirección lleva fuera del tablero', () => {
    const props = {
      ...defaultProps,
      initialPosition: { row: 0, col: 0 }
    };
    
    render(<PlayerController {...props} />);
    
    // Intentar ir hacia arriba desde la fila 0 (fuera del tablero)
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(mockOnPositionChange).not.toHaveBeenCalled();
    
    // Intentar ir hacia la izquierda desde la columna 0 (fuera del tablero)
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(mockOnPositionChange).not.toHaveBeenCalled();
  });

  it('no llama a onPositionChange si la dirección lleva a una pared', () => {
    render(<PlayerController {...defaultProps} />);
    
    // Intentar moverse hacia la derecha donde hay una pared
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(mockOnPositionChange).not.toHaveBeenCalled();
  });

  it('no llama a onPositionChange si la dirección lleva a una bomba', () => {
    render(<PlayerController {...defaultProps} />);
    
    // Intentar moverse hacia arriba donde hay una bomba
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(mockOnPositionChange).not.toHaveBeenCalled();
  });

  it('llama a onPlaceBomb cuando se presiona la tecla de espacio', () => {
    render(<PlayerController {...defaultProps} />);
    
    // Simular tecla de espacio
    fireEvent.keyDown(window, { key: ' ' });
    expect(mockOnPlaceBomb).toHaveBeenCalled();
  });

  it('no hace nada cuando se presiona una tecla no reconocida', () => {
    render(<PlayerController {...defaultProps} />);
    
    // Simular tecla no reconocida
    fireEvent.keyDown(window, { key: 'A' });
    expect(mockOnPositionChange).not.toHaveBeenCalled();
    expect(mockOnPlaceBomb).not.toHaveBeenCalled();
  });

  it('elimina el event listener al desmontar el componente', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    
    const { unmount } = render(<PlayerController {...defaultProps} />);
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
}); 