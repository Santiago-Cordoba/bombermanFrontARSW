import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useWebSocket } from '../../components/Socket/WebSocketProvider';
import './GamePage.css';
import HUD from '../../components/Hud/Hud';
import p1 from '../../images/p1.png';
import p2 from '../../images/p2.png';
import p3 from '../../images/p3.png';
import p4 from '../../images/p4.png';
import { GameOverCard } from '../../components/gameOver/gameOver';

const getPlayerImage = (playerName: string) => {
  switch(playerName) {
    case '1': return p1;
    case '2': return p2;
    case '3': return p3;
    case '4': return p4;
    default: return p1;
  }
};

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'BOMB';

type GameConfig = {
  duration: number;
  lives: number;
};

type Player = {
  id: string;
  name: string;
  x: number;
  y: number;
  bombCapacity: number;
  maxBombs: number;
  bombRange: number;
  lives: number;
  speed: number;
};

export type GameCell = {
  isDestructible: boolean;
  hasPowerUp: boolean;
  powerUpType?: 'EXTRA_LIFE' | 'BOMB_RANGE_UP' | 'INVINCIBILITY';
  x: number;
  y: number;
  isWall: boolean;
};

type Bomb = {
  id: string;
  x: number;
  y: number;
  range: number;
  timer: number;
  playerId: string;
};

type Explosion = {
  x: number;
  y: number;
  timer: number;
  isCenter?: boolean;
  range?: number;
  direction?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  distance?: number;
};

type GameMap = {
  width: number;
  height: number;
  cells: GameCell[][];
};

type PowerUp = {
  type: 'EXTRA_LIFE' | 'BOMB_RANGE_UP' | 'INVINCIBILITY';
  x: number;
  y: number;
};

type GameMessage = {
  type: string;
  config?: GameConfig;
  players: Player[];
  map?: GameMap;
  bombs?: Bomb[];
  powerUps?: PowerUp[];
};

type PlayerMoveRequest = {
  playerId: string;
  newX: number;
  newY: number;
  direction: Direction;
};

const GamePage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const location = useLocation();
  const { subscribe, isConnected, sendMessage } = useWebSocket();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const lastUpdate = useRef<number>(0);
  const { initialGameData } = location.state || {};
  const [gameResult, setGameResult] = useState<{show: boolean; message: string; players?: {name: string, isCurrentPlayer: boolean}[]}>({show: false, message: ''});
  const [activeExplosions, setActiveExplosions] = useState<Array<{x: number; y: number; range: number; id: string}>>([]);
  const [gameState, setGameState] = useState<GameMessage | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [bombs, setBombs] = useState<Bomb[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [localPowerUps, setLocalPowerUps] = useState<PowerUp[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(initialGameData?.config?.duration || 180);
  const [playerLives, setPlayerLives] = useState<number>(3);
  const [gameActive, setGameActive] = useState<boolean>(true);
  const [powerUpEffects, setPowerUpEffects] = useState<{type: string, x: number, y: number, timer: number}[]>([]);

  const defaultMap = useMemo<GameMap>(() => ({
    width: 15,
    height: 13,
    cells: Array(13).fill(null).map((_, y) => 
      Array(15).fill(null).map((_, x) => ({
        x,
        y,
        isWall: x === 0 || y === 0 || x === 14 || y === 12 || (x % 2 === 0 && y % 2 === 0),
        isDestructible: Math.random() < 0.3 && !(x % 2 === 0 && y % 2 === 0),
        hasPowerUp: false
      }))
    )
  }), []);

  const defaultConfig = useMemo<GameConfig>(() => ({
    duration: 300,
    lives: 3
  }), []);

  // Efecto para manejar las animaciones de los power-ups
  useEffect(() => {
    const timer = setInterval(() => {
      setPowerUpEffects(prev => 
        prev.map(effect => ({...effect, timer: effect.timer - 0.1}))
          .filter(effect => effect.timer > 0)
      );
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const showPowerUpEffect = (type: string, x: number, y: number) => {
    setPowerUpEffects(prev => [...prev, {type, x, y, timer: 1}]);
  };

  const handleExplosion = (x: number, y: number, range: number) => {
    const explosionId = `explosion-${x}-${y}-${Date.now()}`;
    setActiveExplosions(prev => [...prev, {x, y, range, id: explosionId}]);
    
    // Agregar explosión al estado
    setExplosions(prev => [...prev, {
      x,
      y,
      timer: 1,
      range,
      isCenter: true
    }]);
    
    // Explosiones en las 4 direcciones según el rango
    for (let i = 1; i <= range; i++) {
      // Arriba
      if (y - i >= 0) {
        setExplosions(prev => [...prev, {
          x, 
          y: y - i, 
          timer: 1, 
          isCenter: false,
          direction: 'UP',
          distance: i
        }]);
      }
      
      // Abajo
      if (y + i < defaultMap.height) {
        setExplosions(prev => [...prev, {
          x, 
          y: y + i, 
          timer: 1, 
          isCenter: false,
          direction: 'DOWN',
          distance: i
        }]);
      }
      
      // Izquierda
      if (x - i >= 0) {
        setExplosions(prev => [...prev, {
          x: x - i, 
          y, 
          timer: 1, 
          isCenter: false,
          direction: 'LEFT',
          distance: i
        }]);
      }
      
      // Derecha
      if (x + i < defaultMap.width) {
        setExplosions(prev => [...prev, {
          x: x + i, 
          y, 
          timer: 1, 
          isCenter: false,
          direction: 'RIGHT',
          distance: i
        }]);
      }
    }

    setTimeout(() => {
      setActiveExplosions(prev => prev.filter(e => e.id !== explosionId));
    }, 500);
  };

  const gameLoop = useCallback(() => {
    const now = Date.now();
    const delta = now - (lastUpdate.current || now);
    lastUpdate.current = now;

    setBombs(prevBombs => {
      const updatedBombs = prevBombs.map(bomb => ({
        ...bomb,
        timer: Math.max(0, bomb.timer - delta / 1000)
      })).filter(bomb => bomb.timer > 0);

      const explodedBombs = prevBombs.filter(bomb => 
        bomb.timer <= 0 && !updatedBombs.some(b => b.id === bomb.id)
      );

      if (explodedBombs.length > 0) {
        explodedBombs.forEach(bomb => {
          handleExplosion(bomb.x, bomb.y, bomb.range);
        });
      }

      return updatedBombs;
    });

    setExplosions(prev => 
      prev.map(exp => ({
        ...exp,
        timer: Math.max(0, exp.timer - delta / 1000)
      })).filter(exp => exp.timer > 0)
    );

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [defaultMap]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop]);

  useEffect(() => {
    if (!gameActive) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          const activePlayers = gameState?.players?.filter(p => p.lives > 0) || [];
          
          if (activePlayers.length > 1) {
            setGameResult({
              show: true,
              message: '¡EMPATE POR TIEMPO!',
              players: activePlayers.map(p => ({
                name: p.name,
                isCurrentPlayer: p.id === currentPlayerId
              }))
            });
            setGameActive(false);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameActive, gameState?.players, currentPlayerId]);

  useEffect(() => {
    console.log('Inicializando juego...');
    console.log('Datos de location.state:', location.state);

    if (location.state?.initialGameData) {
      console.log('Estableciendo datos iniciales del juego');
      setGameState({
        ...location.state.initialGameData,
        map: location.state.initialGameData.map || defaultMap,
        config: location.state.initialGameData.config || defaultConfig
      });
    }

    const playerId = location.state?.playerId || localStorage.getItem('bomberman-playerId');
    if (playerId) {
      console.log('Estableciendo ID de jugador:', playerId);
      setCurrentPlayerId(playerId);
      localStorage.setItem('bomberman-playerId', playerId);
    } else {
      console.error('No se encontró playerId en location.state ni en localStorage');
    }

    setLoading(false);
  }, [location.state, defaultMap, defaultConfig]);

  const placeBomb = useCallback((playerId: string, x: number, y: number) => {
    const currentPlayer = gameState?.players.find(p => p.id === playerId);
    if (!currentPlayer) return;

    const activeBombs = bombs.filter(b => b.playerId === playerId);
    if (activeBombs.length >= currentPlayer.maxBombs) return;

    const newBomb = {
      id: `bomb-${x}-${y}-${Date.now()}`,
      x,
      y,
      range: currentPlayer.bombRange,
      timer: 2,
      playerId
    };
    
    setBombs(prev => [...prev, newBomb]);

    sendMessage(`/app/game/${roomCode}/placeBomb`, {
      playerId: currentPlayerId,
      x,
      y
    });
  }, [gameState?.players, bombs, currentPlayerId, roomCode, sendMessage]);

  const renderExplosion = (x: number, y: number, range: number = 1) => {
    return (
      <div
        key={`explosion-${x}-${y}`}
        className="explosion"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle, rgba(255,100,0,0.8) 0%, rgba(255,50,0,0) 70%)',
          zIndex: 2,
          animation: 'explode 0.5s ease-out'
        }}
      />
    );
  };

  const collectPowerUp = useCallback((playerId: string, x: number, y: number) => {
    const powerUpIndex = localPowerUps.findIndex(pu => pu.x === x && pu.y === y);
    if (powerUpIndex === -1) return;

    const powerUp = localPowerUps[powerUpIndex];
    
    // Mostrar efecto visual
    showPowerUpEffect(powerUp.type, x, y);
    
    // Enviar mensaje al backend
    sendMessage(`/app/game/${roomCode}/collectPowerUp`, {
      playerId,
      x,
      y,
      type: powerUp.type
    });

    // Actualizar estado local
    setLocalPowerUps(prev => prev.filter((_, i) => i !== powerUpIndex));
  }, [localPowerUps, roomCode, sendMessage]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (loading || !currentPlayerId || !gameState?.map) return;

    const directionMap: Record<string, Direction> = {
      'ArrowUp': 'UP', 'KeyW': 'UP',
      'ArrowDown': 'DOWN', 'KeyS': 'DOWN',
      'ArrowLeft': 'LEFT', 'KeyA': 'LEFT',
      'ArrowRight': 'RIGHT', 'KeyD': 'RIGHT',
      'Space': 'BOMB',
    };

    const direction = directionMap[e.code];
    if (!direction) return;

    e.preventDefault();

    const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
    if (!currentPlayer) return;

    if (direction === 'BOMB') {
      const existingBomb = bombs.find(b => b.x === currentPlayer.x && b.y === currentPlayer.y);
      if (!existingBomb) {
        placeBomb(currentPlayerId, currentPlayer.x, currentPlayer.y);
      }
      return;
    }

    let newX = currentPlayer.x;
    let newY = currentPlayer.y;

    switch (direction) {
      case 'UP': newY -= 1; break;
      case 'DOWN': newY += 1; break;
      case 'LEFT': newX -= 1; break;
      case 'RIGHT': newX += 1; break;
    }

    if (newX < 0 || newY < 0 || newX >= gameState.map.width || newY >= gameState.map.height) {
      return;
    }

    const targetCell = gameState.map.cells[newY]?.[newX];
    if (!targetCell || targetCell.isWall) {
      return;
    }

    const bombInTarget = bombs.some(b => b.x === newX && b.y === newY);
    if (bombInTarget) {
      return;
    }

    const playerInTarget = gameState.players.some(p => 
      p.id !== currentPlayerId && p.x === newX && p.y === newY
    );
    if (playerInTarget) {
      return;
    }

    const powerUpInTarget = localPowerUps.some(pu => pu.x === newX && pu.y === newY);
    if (powerUpInTarget) {
      collectPowerUp(currentPlayerId, newX, newY);
    }

    sendMessage<PlayerMoveRequest>(`/app/game/${roomCode}/move`, {
      playerId: currentPlayerId,
      newX,
      newY,
      direction
    });
  }, [currentPlayerId, gameState, loading, placeBomb, collectPowerUp, bombs, localPowerUps, roomCode, sendMessage]);

  useEffect(() => {
    if (loading) return;
    const container = gameContainerRef.current;
    if (!container) return;

    container.focus();
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, loading]);

  useEffect(() => {
    if (!isConnected || !roomCode || loading) return;
  
    const subscription = subscribe<GameMessage>(
      `/topic/game/${roomCode}`,
      (message) => {
        console.log('Mensaje recibido:', message.type);
        
        if (message.type === 'GAME_START') {
          setGameState({
            ...message,
            map: message.map || defaultMap,
            config: message.config || defaultConfig
          });
          setTimeLeft(message.config?.duration || 300);
          setPlayerLives(message.config?.lives || 3);
          setGameActive(true);
        } 
        else if (message.type === 'GAME_UPDATE') {
          // Actualizar bombas
          setBombs(prevBombs => {
            const newBombs = message.bombs?.map(b => ({
              id: b.id || `bomb-${b.x}-${b.y}-${Date.now()}`,
              x: b.x,
              y: b.y,
              range: b.range || 1,
              timer: b.timer || 2,
              playerId: b.playerId
            })) || [];

            return [
              ...prevBombs.filter(pb => 
                !newBombs.some(nb => nb.x === pb.x && nb.y === pb.y)
              ),
              ...newBombs
            ];
          });

          // Actualizar power-ups
          if (message.powerUps) {
            setLocalPowerUps(message.powerUps.map(pu => ({
              x: pu.x,
              y: pu.y,
              type: pu.type
            })));
          }

          // Verificar fin del juego
          const activePlayers = message.players?.filter(p => p.lives > 0) || [];
  
          // Mostrar card de victoria si solo queda 1 jugador
          if (activePlayers.length === 1) {
            const winner = activePlayers[0];
            setGameResult({
              show: true,
              message: winner.id === currentPlayerId ? '¡HAS GANADO!' : `¡${winner.name} HA GANADO!`,
              players: [{
                name: winner.name,
                isCurrentPlayer: winner.id === currentPlayerId
              }]
            });
            setGameActive(false);
          }
          
          // Actualizar tiempo y vidas
          if (message.config) {
            setTimeLeft(message.config.duration);
          }
          
          // Actualizar vidas del jugador actual
          if (currentPlayerId) {
            const currentPlayer = message.players?.find(p => p.id === currentPlayerId);
            if (currentPlayer) {
              setPlayerLives(currentPlayer.lives);
            }
          }

          setGameState(prev => ({
            ...prev,
            players: message.players || prev?.players || [],
            config: message.config || prev?.config || defaultConfig,
            type: 'GAME_UPDATE'
          }));
        }
      }
    );
  
    return () => {
      subscription?.unsubscribe();
      setGameActive(false);
    };
  }, [isConnected, roomCode, subscribe, loading, defaultMap, defaultConfig, currentPlayerId]);

  const getPowerUpIcon = (type: string) => {
    switch(type) {
      case 'BOMB_RANGE_UP': 
        return <div className="power-up-icon bomb-range">🔥</div>;
      case 'EXTRA_LIFE': 
        return <div className="power-up-icon life">❤️</div>;
      case 'INVINCIBILITY': 
        return <div className="power-up-icon invincibility">🛡️</div>;
      default: 
        return <div className="power-up-icon default">✨</div>;
    }
  };

  if (loading || !gameState || !currentPlayerId) {
    return (
      <div className="game-loading">
        <h2>Sala: {roomCode}</h2>
        <p>Cargando juego...</p>
      </div>
    );
  }

  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  const displayMap = gameState.map || defaultMap;
  const displayConfig = gameState.config || defaultConfig;

  return (
    <div className="game-container" ref={gameContainerRef} tabIndex={0}>
      <div className="game-header">
        <HUD
          time={timeLeft}
          roomCode={roomCode || ''}
          lives={playerLives}
          isRunning={true}
          onTimeEnd={() => console.log('¡Se acabó el tiempo!')}
        />
      </div>
      
      <div 
        className="game-map"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${displayMap.width}, 32px)`,
          gridTemplateRows: `repeat(${displayMap.height}, 32px)`,
          gap: '2px',
          backgroundColor: '#111',
          padding: '10px',
          borderRadius: '8px'
        }}
      >
        {displayMap.cells.map((row, y) => (
          <React.Fragment key={`row-${y}`}>
            {row.map((cell, x) => {
              const cellType = cell?.isWall 
                ? cell?.isDestructible ? 'destructible' : 'wall' 
                : 'empty';
              
              const player = gameState.players.find(p => p.x === x && p.y === y);
              const bomb = bombs.find(b => b.x === x && b.y === y);
              const explosion = explosions.find(e => e.x === x && e.y === y);
              const powerUp = localPowerUps.find(pu => pu.x === x && pu.y === y);
              const powerUpEffect = powerUpEffects.find(e => e.x === x && e.y === y);
              
              return (
                <div 
                  key={`cell-${x}-${y}`} 
                  className={`game-cell ${cellType}`}
                  style={{
                    position: 'relative'
                  }}
                >
                  {/* Contenido normal de la celda */}
                  {player && gameState.players.some(p => p.id === player.id) && (
                    <div className={`game-player player-${player.name}`}>
                      <img src={getPlayerImage(player.name)} alt={`Jugador ${player.name}`} />
                    </div>
                  )}
                  
                  {bomb && !explosion && <div className="game-bomb" />}
                  
                  {powerUp && !bomb && !explosion && (
                    <div className="game-power-up">
                      {getPowerUpIcon(powerUp.type)}
                    </div>
                  )}

                  {/* Efectos de power-up */}
                  {powerUpEffect && (
                    <div className="power-up-effect"
                      style={{
                        opacity: powerUpEffect.timer,
                        transform: `scale(${1 + (1 - powerUpEffect.timer)})`
                      }}
                    >
                      {getPowerUpIcon(powerUpEffect.type)}
                    </div>
                  )}

                  {/* Renderizado de explosiones */}
                  {explosion && renderExplosion(x, y, explosion.range || 1)}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <div className="game-controls">
        <p>Controles: Flechas o WASD para mover, Espacio para bombas</p>
        <p className="player-info">
          Jugador: <span className="player-name">{currentPlayer?.name || currentPlayerId}</span>
        </p>
        <div className="power-up-legend">
          <div className="legend-item">
            <span className="power-up-icon bomb-range">🔥</span> = Mayor rango
          </div>
          <div className="legend-item">
            <span className="power-up-icon life">❤️</span> = Vida extra
          </div>
          <div className="legend-item">
            <span className="power-up-icon invincibility">🛡️</span> = Invencibilidad
          </div>
        </div>
      </div>

      {/* Game Over Card */}
      {gameResult.show && (
        <GameOverCard 
          message={gameResult.message}
          players={gameResult.players}
          onClose={() => {
            setGameResult({show: false, message: ''});
          }}
        />
      )}
    </div>
  );
};

export default GamePage;