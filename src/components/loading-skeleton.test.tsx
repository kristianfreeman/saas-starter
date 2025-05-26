import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton, CardSkeleton, TableSkeleton } from './loading-skeleton';

describe('Skeleton', () => {
  it('renders with default props', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('animate-pulse', 'bg-muted');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="custom-skeleton" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('custom-skeleton');
  });

  it('renders with custom width and height', () => {
    const { container } = render(
      <Skeleton className="w-32 h-16" />
    );
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('w-32', 'h-16');
  });
});

describe('CardSkeleton', () => {
  it('renders card structure with skeleton elements', () => {
    const { container } = render(<CardSkeleton />);
    
    const wrapper = container.querySelector('.space-y-3');
    expect(wrapper).toBeInTheDocument();
    
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(3); // main card, title, description
  });

  it('renders main skeleton with correct size', () => {
    const { container } = render(<CardSkeleton />);
    const mainSkeleton = container.querySelector('.h-\\[125px\\]');
    expect(mainSkeleton).toBeInTheDocument();
    expect(mainSkeleton).toHaveClass('w-full', 'rounded-xl');
  });

  it('renders text skeletons with correct sizes', () => {
    const { container } = render(<CardSkeleton />);
    const titleSkeleton = container.querySelector('.h-4.w-\\[250px\\]');
    const descSkeleton = container.querySelector('.h-4.w-\\[200px\\]');
    
    expect(titleSkeleton).toBeInTheDocument();
    expect(descSkeleton).toBeInTheDocument();
  });
});

describe('TableSkeleton', () => {
  it('renders table with default 5 rows', () => {
    const { container } = render(<TableSkeleton />);
    const rows = container.querySelectorAll('.flex.items-center.space-x-4');
    expect(rows).toHaveLength(5);
  });

  it('renders table with custom number of rows', () => {
    const { container } = render(<TableSkeleton rows={3} />);
    const rows = container.querySelectorAll('.flex.items-center.space-x-4');
    expect(rows).toHaveLength(3);
  });

  it('renders table header skeleton', () => {
    const { container } = render(<TableSkeleton />);
    const header = container.querySelector('.border-b.p-4');
    const headerSkeleton = header?.querySelector('.h-6.w-\\[100px\\]');
    
    expect(header).toBeInTheDocument();
    expect(headerSkeleton).toBeInTheDocument();
  });

  it('renders row with avatar and text skeletons', () => {
    const { container } = render(<TableSkeleton />);
    const avatars = container.querySelectorAll('.h-12.w-12.rounded-full');
    const textSkeletons = container.querySelectorAll('.space-y-2.flex-1');
    
    expect(avatars).toHaveLength(5);
    expect(textSkeletons).toHaveLength(5);
  });

  it('renders within bordered container', () => {
    const { container } = render(<TableSkeleton />);
    const borderedContainer = container.querySelector('.rounded-md.border');
    expect(borderedContainer).toBeInTheDocument();
  });

  it('renders skeleton elements in rows', () => {
    const { container } = render(<TableSkeleton />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});