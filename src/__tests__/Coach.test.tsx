import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Coach from '../pages/Coach';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@test.com' },
    loading: false,
  }),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'coach_messages') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [] }),
        }),
      };
    },
  },
}));

function renderCoach() {
  return render(
    <BrowserRouter>
      <Coach />
    </BrowserRouter>
  );
}

describe('AI Sustainability Coach', () => {
  it('renders the coach heading', async () => {
    renderCoach();
    expect(await screen.findByText('AI Sustainability Coach')).toBeInTheDocument();
  });

  it('shows welcome message when no messages', async () => {
    renderCoach();
    expect(await screen.findByText('Welcome to your AI Coach!')).toBeInTheDocument();
  });

  it('shows suggested questions', async () => {
    renderCoach();
    expect(await screen.findByText('How can I reduce my transport emissions?')).toBeInTheDocument();
  });

  it('has accessible chat log role', async () => {
    renderCoach();
    const log = await screen.findByRole('log');
    expect(log).toBeInTheDocument();
  });

  it('has labeled input field', async () => {
    renderCoach();
    const input = await screen.findByLabelText('Ask your sustainability coach');
    expect(input).toBeInTheDocument();
  });

  it('shows send button', async () => {
    renderCoach();
    expect(await screen.findByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  it('populates input when clicking suggested question', async () => {
    renderCoach();
    const suggestion = await screen.findByText('How can I reduce my transport emissions?');
    await userEvent.click(suggestion);
    const input = screen.getByLabelText('Ask your sustainability coach');
    expect(input).toHaveValue('How can I reduce my transport emissions?');
  });

  it('sends a message and shows response', async () => {
    renderCoach();
    const input = await screen.findByLabelText('Ask your sustainability coach');
    await userEvent.type(input, 'How can I save energy?');
    const sendBtn = screen.getByRole('button', { name: /send message/i });
    await userEvent.click(sendBtn);
    await waitFor(() => {
      expect(screen.getByText(/energy emissions/i)).toBeInTheDocument();
    });
  });
});
