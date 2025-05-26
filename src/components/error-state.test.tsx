import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState, NotFound } from './error-state';

describe('ErrorState', () => {
  it('renders with default props', () => {
    render(<ErrorState />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An error occurred while loading this content. Please try again.')).toBeInTheDocument();
  });

  it('renders with custom title and message', () => {
    render(
      <ErrorState 
        title="Custom Error" 
        message="This is a custom error message" 
      />
    );
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
    expect(screen.getByText('This is a custom error message')).toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorState />);
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ErrorState className="custom-error" />);
    const errorDiv = container.firstChild as HTMLElement;
    expect(errorDiv).toHaveClass('custom-error');
  });

  it('renders error icon', () => {
    render(<ErrorState />);
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('text-destructive');
  });
});

describe('NotFound', () => {
  it('renders 404 error state', () => {
    render(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(screen.getByText("The page you're looking for doesn't exist or has been moved.")).toBeInTheDocument();
  });

  it('renders back to home link', () => {
    render(<NotFound />);
    const link = screen.getByText('Go Back Home');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/');
  });
});