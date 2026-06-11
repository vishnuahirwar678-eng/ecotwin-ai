import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Calculator from '../pages/Calculator';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@test.com' },
    loading: false,
  }),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

function renderCalculator() {
  return render(
    <BrowserRouter>
      <Calculator />
    </BrowserRouter>
  );
}

describe('Calculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    renderCalculator();
    expect(screen.getByText('Carbon Footprint Calculator')).toBeInTheDocument();
  });

  it('renders all four category tabs', () => {
    renderCalculator();
    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(screen.getByText('Energy')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Shopping')).toBeInTheDocument();
  });

  it('shows transport items by default', () => {
    renderCalculator();
    expect(screen.getByText(/Car \(gasoline\)/)).toBeInTheDocument();
  });

  it('switches category when clicking a tab', async () => {
    renderCalculator();
    const energyTab = screen.getByRole('tab', { name: /energy category/i });
    await userEvent.click(energyTab);
    expect(screen.getAllByText(/Electricity – 1 day/).length).toBeGreaterThan(0);
  });

  it('adds an entry when clicking Add to Tracker', async () => {
    renderCalculator();
    const addButton = screen.getByRole('button', { name: /add to tracker/i });
    await userEvent.click(addButton);
    expect(screen.getByText(/Today's Entries/)).toBeInTheDocument();
  });

  it('shows emission source for selected item', () => {
    renderCalculator();
    expect(screen.getAllByText(/EPA GHG Equivalencies/).length).toBeGreaterThan(0);
  });

  it('shows empty state when no entries', () => {
    renderCalculator();
    expect(screen.getByText('No entries yet')).toBeInTheDocument();
  });

  it('shows total after adding entries', async () => {
    renderCalculator();
    const addButton = screen.getByRole('button', { name: /add to tracker/i });
    await userEvent.click(addButton);
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('removes entry when clicking trash button', async () => {
    renderCalculator();
    const addButton = screen.getByRole('button', { name: /add to tracker/i });
    await userEvent.click(addButton);
    const removeButton = screen.getByRole('button', { name: /remove/i });
    await userEvent.click(removeButton);
    expect(screen.queryByText(/Today's Entries/)).not.toBeInTheDocument();
  });

  it('has accessible tab roles', () => {
    renderCalculator();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(4);
  });

  it('has accessible tabpanel after selecting category', () => {
    renderCalculator();
    const tabpanel = screen.getByRole('tabpanel');
    expect(tabpanel).toBeInTheDocument();
  });
});
