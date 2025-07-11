import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Simple integration: start button triggers score reset

test('start button initializes game state', () => {
  render(<App />);
  const startBtn = screen.getByText(/Start Game/i);
  fireEvent.click(startBtn);
  const livesLabel = screen.getByText(/Lives:/i);
  expect(livesLabel).toBeInTheDocument();
});
