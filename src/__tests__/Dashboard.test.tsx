import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@test.com' },
    loading: false,
  }),
}));

// Return empty data - triggers empty state path (no charts rendered)
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [] }),
        }),
      }),
    }),
  },
}));

import Dashboard from '../pages/Dashboard';

function renderDashboard() {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
}

describe('Dashboard', () => {
  it('renders the dashboard heading', async () => {
    renderDashboard();
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
  });

  it('shows empty state when no data', async () => {
    renderDashboard();
    expect(await screen.findByText('No data yet')).toBeInTheDocument();
  });

  it('shows prompt to start tracking', async () => {
    renderDashboard();
    expect(await screen.findByText(/Start tracking your carbon footprint/i)).toBeInTheDocument();
  });
});
