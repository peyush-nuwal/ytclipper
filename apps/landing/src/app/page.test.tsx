import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Home from './page';

describe('Home Page', () => {
  it('renders without crashing', () => {
    render(<Home />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('contains welcome text', () => {
    render(<Home />);
    // Adjust this based on your actual content
    expect(
      screen.getByText(/welcome/i) || screen.getByText(/home/i)
    ).toBeInTheDocument();
  });
});
