import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import RetroNameInput from './nameInput';

describe('RetroNameInput Component', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockReset();
  });

  it('renderiza el formulario correctamente', () => {
    render(<RetroNameInput onSubmit={mockOnSubmit} />);
    
    expect(screen.getByText('Ingresa tu nombre:')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nombre')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument();
  });

  it('actualiza el valor del input al escribir', () => {
    render(<RetroNameInput onSubmit={mockOnSubmit} />);
    
    const inputElement = screen.getByPlaceholderText('Nombre');
    fireEvent.change(inputElement, { target: { value: 'Jugador1' } });
    
    expect(inputElement).toHaveValue('Jugador1');
  });

  it('llama a onSubmit y muestra mensaje de saludo al enviar el formulario', () => {
    render(<RetroNameInput onSubmit={mockOnSubmit} />);
    
    // Completar el formulario
    const inputElement = screen.getByPlaceholderText('Nombre');
    fireEvent.change(inputElement, { target: { value: 'Jugador1' } });
    
    // Enviar el formulario
    const submitButton = screen.getByRole('button', { name: 'Confirmar' });
    fireEvent.click(submitButton);
    
    // Verificar que se llamó a onSubmit
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    
    // Verificar que se muestra el mensaje de saludo usando un regex más flexible
    const greetingMessage = screen.getByText((content, element) => {
      return Boolean(
        element?.tagName?.toLowerCase() === 'p' && 
        element?.textContent?.includes('¡Hola') && 
        element?.textContent?.includes('Jugador1')
      );
    });
    expect(greetingMessage).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument();
  });

  it('vuelve al formulario al hacer clic en el botón Volver', () => {
    render(<RetroNameInput onSubmit={mockOnSubmit} />);
    
    // Completar y enviar el formulario
    const inputElement = screen.getByPlaceholderText('Nombre');
    fireEvent.change(inputElement, { target: { value: 'Jugador1' } });
    
    const submitButton = screen.getByRole('button', { name: 'Confirmar' });
    fireEvent.click(submitButton);
    
    // Verificar que se muestra el mensaje con una función más flexible
    const greetingMessage = screen.getByText((content, element) => {
      return Boolean(
        element?.tagName?.toLowerCase() === 'p' && 
        element?.textContent?.includes('¡Hola') && 
        element?.textContent?.includes('Jugador1')
      );
    });
    expect(greetingMessage).toBeInTheDocument();
    
    // Hacer clic en Volver
    const volverButton = screen.getByRole('button', { name: 'Volver' });
    fireEvent.click(volverButton);
    
    // Verificar que se muestra nuevamente el formulario
    expect(screen.getByText('Ingresa tu nombre:')).toBeInTheDocument();
  });
}); 