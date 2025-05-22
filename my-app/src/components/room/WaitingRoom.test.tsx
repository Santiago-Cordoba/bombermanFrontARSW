import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import RetroWaitingRoom from './WaitingRoom';

describe('RetroWaitingRoom Component', () => {
  const mockPlayers = [
    { id: '1', name: 'Player1', ready: false, host: true },
    { id: '2', name: 'Player2', ready: true },
  ];

  const defaultProps = {
    players: mockPlayers,
    currentPlayerName: 'Player1',
    roomCode: 'ABC123',
    onStartGame: vi.fn(),
    onToggleReady: vi.fn(),
    onLeaveRoom: vi.fn(),
    isHost: true,
    isConnected: true,
    onConfigChange: vi.fn(),
    initialConfig: { lives: 3, duration: 180 },
  };

  it('renderiza correctamente con información de sala', () => {
    render(<RetroWaitingRoom {...defaultProps} />);
    
    // Verificar título y elementos básicos
    expect(screen.getByText('SALA DE ESPERA')).toBeInTheDocument();
    expect(screen.getByText(/Código de sala:/)).toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    
    // Verificar información de jugadores
    const highlightSpans = screen.getAllByRole('generic', { name: '' }).filter(
      el => el.className === 'highlight'
    );
    const playerCountSpan = highlightSpans.find(span => 
      span.textContent?.includes('2') && span.textContent?.includes('/4')
    );
    expect(playerCountSpan).toBeInTheDocument();
  });

  it('muestra el estado de conexión', () => {
    render(<RetroWaitingRoom {...defaultProps} isConnected={true} />);
    expect(screen.getByText('Estado: CONECTADO')).toBeInTheDocument();
    
    render(<RetroWaitingRoom {...defaultProps} isConnected={false} />);
    expect(screen.getByText('Estado: DESCONECTADO')).toBeInTheDocument();
  });

  it('muestra mensaje de error cuando existe', () => {
    const error = 'Error de conexión';
    render(<RetroWaitingRoom {...defaultProps} error={error} />);
    expect(screen.getByText(error)).toBeInTheDocument();
  });

  it('muestra los controles de configuración para el host', () => {
    render(<RetroWaitingRoom {...defaultProps} isHost={true} />);
    
    expect(screen.getByText('CONFIGURACIÓN')).toBeInTheDocument();
    expect(screen.getByText('VIDAS:')).toBeInTheDocument();
    expect(screen.getByText('TIEMPO (seg):')).toBeInTheDocument();
  });

  it('no muestra los controles de configuración si no es host', () => {
    render(<RetroWaitingRoom {...defaultProps} isHost={false} />);
    
    expect(screen.queryByText('CONFIGURACIÓN')).not.toBeInTheDocument();
  });

  it('llama a onConfigChange cuando se cambian las vidas', () => {
    render(<RetroWaitingRoom {...defaultProps} />);
    
    // Incrementar vidas
    const increaseLivesButton = screen.getAllByText('+')[0];
    fireEvent.click(increaseLivesButton);
    
    expect(defaultProps.onConfigChange).toHaveBeenCalledWith({ lives: 4, duration: 180 });
  });

  it('llama a onConfigChange cuando se cambia la duración', () => {
    render(<RetroWaitingRoom {...defaultProps} />);
    
    // Incrementar duración
    const increaseDurationButton = screen.getAllByText('+')[1];
    fireEvent.click(increaseDurationButton);
    
    expect(defaultProps.onConfigChange).toHaveBeenCalledWith({ lives: 3, duration: 210 });
  });

  it('muestra la lista de jugadores correctamente', () => {
    render(<RetroWaitingRoom {...defaultProps} />);
    
    expect(screen.getByText('Player1')).toBeInTheDocument();
    expect(screen.getByText('Player2')).toBeInTheDocument();
    expect(screen.getByText('(Host)')).toBeInTheDocument();
    expect(screen.getByText('(Tú)')).toBeInTheDocument();
  });

  it('muestra el estado de los jugadores (listo/esperando)', () => {
    render(<RetroWaitingRoom {...defaultProps} />);
    
    // Buscar los estados de los jugadores por su texto y clases
    const statusElements = screen.getAllByText(content => 
      content.includes('ESPERANDO') || content.includes('LISTO')
    );
    
    expect(statusElements.length).toBeGreaterThanOrEqual(2);
    expect(statusElements[0].textContent).toContain('ESPERANDO');
    expect(statusElements[1].textContent).toContain('LISTO');
  });

  it('llama a onToggleReady cuando se hace clic en el botón de listo', () => {
    render(<RetroWaitingRoom {...defaultProps} />);
    
    const readyButton = screen.getByRole('button', { name: 'LISTO' });
    fireEvent.click(readyButton);
    
    expect(defaultProps.onToggleReady).toHaveBeenCalled();
  });

  it('llama a onStartGame cuando se hace clic en el botón de iniciar juego', () => {
    const propsWithAllReady = {
      ...defaultProps,
      players: [
        { id: '1', name: 'Player1', ready: true, host: true },
        { id: '2', name: 'Player2', ready: true }
      ]
    };

    render(<RetroWaitingRoom {...propsWithAllReady} />);
    
    const startButton = screen.getByRole('button', { name: 'INICIAR JUEGO' });
    expect(startButton).not.toBeDisabled();
    
    fireEvent.click(startButton);
    expect(defaultProps.onStartGame).toHaveBeenCalled();
  });

  it('desactiva el botón de iniciar juego si no todos están listos', () => {
    // Ya tenemos un jugador no listo en mockPlayers
    render(<RetroWaitingRoom {...defaultProps} />);
    
    const startButton = screen.getByRole('button', { name: 'INICIAR JUEGO' });
    expect(startButton).toBeDisabled();
  });

  it('llama a onLeaveRoom cuando se hace clic en salir de la sala', () => {
    render(<RetroWaitingRoom {...defaultProps} />);
    
    const leaveButton = screen.getByRole('button', { name: 'SALIR DE LA SALA' });
    fireEvent.click(leaveButton);
    
    expect(defaultProps.onLeaveRoom).toHaveBeenCalled();
  });
}); 