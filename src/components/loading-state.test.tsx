import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState, FullPageLoading } from './loading-state';

describe('LoadingState', () => {
  it('renders with default props', () => {
    render(<LoadingState />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    render(<LoadingState text="Please wait" />);
    expect(screen.getByText('Please wait')).toBeInTheDocument();
  });

  it('renders without text when text is empty', () => {
    const { container } = render(<LoadingState text="" />);
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingState className="custom-class" />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('custom-class');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<LoadingState size="sm" />);
    let spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('h-4', 'w-4');

    rerender(<LoadingState size="lg" />);
    spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('h-8', 'w-8');
  });
});

describe('FullPageLoading', () => {
  it('renders with full page styling', () => {
    const { container } = render(<FullPageLoading />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('min-h-screen');
  });

  it('renders LoadingState with large size', () => {
    render(<FullPageLoading />);
    const spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('h-8', 'w-8');
  });
});