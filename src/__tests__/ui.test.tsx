import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import ProgressBar from '../components/ui/ProgressBar';
import SustainabilityScore from '../components/ui/SustainabilityScore';
import { Leaf, Plus } from 'lucide-react';
import type { SustainabilityScore as ScoreType } from '../types';

describe('Spinner', () => {
  it('renders with default size', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders with small size', () => {
    render(<Spinner size="sm" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState icon={Leaf} title="No data" description="Start tracking" />);
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('Start tracking')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const onClick = vi.fn();
    render(<EmptyState icon={Plus} title="Empty" description="Add items" action={{ label: 'Add', onClick }} />);
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });
});

describe('ProgressBar', () => {
  it('renders with correct aria attributes', () => {
    render(<ProgressBar value={50} max={100} label="Progress" />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '50');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
  });

  it('displays value and max in text', () => {
    render(<ProgressBar value={25} max={150} label="CO2 Budget" />);
    expect(screen.getByText(/25.0.*150.*kg CO2/)).toBeInTheDocument();
  });
});

describe('SustainabilityScore', () => {
  const mockScore: ScoreType = {
    rating: 'A',
    points: 80,
    percentage: 80,
    color: '#10b981',
    label: 'Excellent',
  };

  it('renders the rating', () => {
    render(<SustainabilityScore score={mockScore} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders the label', () => {
    render(<SustainabilityScore score={mockScore} />);
    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  it('has accessible label', () => {
    render(<SustainabilityScore score={mockScore} />);
    expect(screen.getByLabelText(/Sustainability score: A, Excellent/)).toBeInTheDocument();
  });
});
