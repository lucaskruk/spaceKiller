import { render, screen } from '@testing-library/react';
import App from './App';

test('renders game title', () => {
  render(<App />);
  const title = screen.getByText(/SpaceKiller/i);
  expect(title).toBeInTheDocument();
});

test('renders mute button', () => {
  render(<App />);
  const muteBtn = screen.getByText(/Mute/i);
  expect(muteBtn).toBeInTheDocument();
});
