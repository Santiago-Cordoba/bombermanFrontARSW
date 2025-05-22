import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Explosion from './Explosion';

describe('Explosion Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renderiza el centro de la explosión correctamente', () => {
    const { container } = render(<Explosion x={5} y={5} range={3} />);
    
    const center = container.querySelector('.explosion-center');
    expect(center).toBeInTheDocument();
    expect(center).toHaveStyle({
      left: '160px', // x * 32
      top: '160px'   // y * 32
    });
  });

  it('renderiza los brazos de la explosión según el rango', () => {
    const { container } = render(<Explosion x={5} y={5} range={2} />);
    
    // Debe haber un centro y 8 brazos (2 en cada dirección para un rango de 2)
    const explosionParts = container.querySelectorAll('.explosion-arm');
    expect(explosionParts.length).toBe(8);
    
    // Verificar que existen los brazos en las 4 direcciones
    expect(container.querySelector('.explosion-arm.right')).toBeInTheDocument();
    expect(container.querySelector('.explosion-arm.left')).toBeInTheDocument();
    expect(container.querySelector('.explosion-arm.up')).toBeInTheDocument();
    expect(container.querySelector('.explosion-arm.down')).toBeInTheDocument();
  });

  it('no crea brazos que se salen del mapa', () => {
    // Posición en el borde superior izquierdo
    const { container } = render(<Explosion x={0} y={0} range={2} />);
    
    // Solo debe haber brazos hacia la derecha y hacia abajo
    expect(container.querySelector('.explosion-arm.left')).not.toBeInTheDocument();
    expect(container.querySelector('.explosion-arm.up')).not.toBeInTheDocument();
    expect(container.querySelector('.explosion-arm.right')).toBeInTheDocument();
    expect(container.querySelector('.explosion-arm.down')).toBeInTheDocument();
  });

  it('llama a onComplete después de 500ms', () => {
    const onCompleteMock = vi.fn();
    render(<Explosion x={5} y={5} range={2} onComplete={onCompleteMock} />);
    
    // Inicialmente no se ha llamado
    expect(onCompleteMock).not.toHaveBeenCalled();
    
    // Avanzar el tiempo 500ms
    vi.advanceTimersByTime(500);
    
    // Ahora debería haberse llamado
    expect(onCompleteMock).toHaveBeenCalledTimes(1);
  });

  it('limpia el timeout al desmontar', () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    const { unmount } = render(<Explosion x={5} y={5} range={2} />);
    
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
}); 