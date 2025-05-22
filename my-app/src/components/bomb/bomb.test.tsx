import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Bomb from './bomb';

describe('Bomb Component', () => {
  it('renders with correct timer value', () => {
    render(<Bomb timer={3} isOwner={false} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not have owner-bomb class when isOwner is false', () => {
    const { container } = render(<Bomb timer={3} isOwner={false} />);
    const bombElement = container.querySelector('.bomb');
    expect(bombElement).toBeInTheDocument();
    expect(bombElement).not.toHaveClass('owner-bomb');
  });

  it('has owner-bomb class when isOwner is true', () => {
    const { container } = render(<Bomb timer={5} isOwner={true} />);
    const bombElement = container.querySelector('.bomb');
    expect(bombElement).toBeInTheDocument();
    expect(bombElement).toHaveClass('owner-bomb');
  });
}); 