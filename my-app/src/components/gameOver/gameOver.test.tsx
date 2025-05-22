import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GameOverCard } from './gameOver';

// Mock para react-icons
vi.mock('react-icons/fa', () => ({
  FaBomb: () => <span data-testid="mock-bomb-icon">🔥</span>,
  FaArrowLeft: () => <span data-testid="mock-arrow-left">←</span>
}));

describe('GameOverCard Component', () => {
  const mockOnClose = vi.fn();
  const defaultProps = {
    message: 'Game Over',
    onClose: mockOnClose
  };

  it('renderiza el mensaje principal correctamente', () => {
    render(<GameOverCard {...defaultProps} />);
    expect(screen.getByText('Game Over')).toBeInTheDocument();
  });

  it('muestra el icono de explosión', () => {
    render(<GameOverCard {...defaultProps} />);
    expect(screen.getByTestId('mock-bomb-icon')).toBeInTheDocument();
  });

  it('no muestra la sección de empate si no hay jugadores', () => {
    render(<GameOverCard {...defaultProps} />);
    expect(screen.queryByText('EMPATE ENTRE:')).not.toBeInTheDocument();
  });

  it('muestra la lista de jugadores en caso de empate', () => {
    const players = [
      { name: 'Jugador 1', isCurrentPlayer: true },
      { name: 'Jugador 2', isCurrentPlayer: false }
    ];
    
    render(<GameOverCard {...defaultProps} players={players} />);
    
    expect(screen.getByText('EMPATE ENTRE:')).toBeInTheDocument();
    
    // Buscar los elementos específicamente en la lista
    const playersList = screen.getByRole('list');
    const playerItems = within(playersList).getAllByRole('listitem');
    
    // Verificar los nombres de los jugadores
    expect(playerItems[0].textContent).toContain('Jugador 1');
    expect(playerItems[0].textContent).toContain('(TÚ)');
    expect(playerItems[1].textContent).toContain('Jugador 2');
  });

  it('marca correctamente al jugador actual', () => {
    const players = [
      { name: 'Jugador 1', isCurrentPlayer: true },
      { name: 'Jugador 2', isCurrentPlayer: false }
    ];
    
    render(<GameOverCard {...defaultProps} players={players} />);
    
    // Verificar que la clase 'current-player' se aplica al elemento correcto
    const playerItems = screen.getAllByRole('listitem');
    expect(playerItems[0]).toHaveClass('current-player');
    expect(playerItems[1]).not.toHaveClass('current-player');
  });

  it('llama a onClose cuando se hace clic en el botón de menú principal', () => {
    render(<GameOverCard {...defaultProps} />);
    
    const menuButton = screen.getByText('MENÚ PRINCIPAL');
    fireEvent.click(menuButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
}); 