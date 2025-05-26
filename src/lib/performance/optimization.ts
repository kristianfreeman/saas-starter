/**
 * Performance optimization utilities
 */

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImages() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
  
  const images = document.querySelectorAll('img[data-lazy]');
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.getAttribute('data-lazy');
        
        if (src) {
          img.src = src;
          img.removeAttribute('data-lazy');
          imageObserver.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01
  });
  
  images.forEach(img => imageObserver.observe(img));
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources(resources: { href: string; as: string }[]) {
  if (typeof document === 'undefined') return;
  
  resources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    
    if (resource.as === 'font') {
      link.crossOrigin = 'anonymous';
    }
    
    document.head.appendChild(link);
  });
}

/**
 * Prefetch pages for faster navigation
 */
export function prefetchPages() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
  
  const links = document.querySelectorAll('a[href^="/"]');
  const prefetchedUrls = new Set<string>();
  
  const linkObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const link = entry.target as HTMLAnchorElement;
        const href = link.href;
        
        if (!prefetchedUrls.has(href)) {
          prefetchedUrls.add(href);
          
          const prefetchLink = document.createElement('link');
          prefetchLink.rel = 'prefetch';
          prefetchLink.href = href;
          document.head.appendChild(prefetchLink);
        }
      }
    });
  }, {
    rootMargin: '0px 0px',
    threshold: 0.01
  });
  
  links.forEach(link => linkObserver.observe(link));
}

/**
 * Optimize bundle loading with code splitting
 */
export function optimizeBundleLoading() {
  // This is handled by Astro's build process, but we can add
  // dynamic imports for heavy components
  
  // Example:
  // const HeavyComponent = lazy(() => import('./HeavyComponent'));
}

/**
 * Memory leak prevention
 */
export class MemoryManager {
  private listeners: Array<{ element: Element; event: string; handler: EventListener }> = [];
  private intervals: Set<NodeJS.Timeout> = new Set();
  private timeouts: Set<NodeJS.Timeout> = new Set();
  
  /**
   * Add event listener with automatic cleanup
   */
  addEventListener(element: Element, event: string, handler: EventListener) {
    element.addEventListener(event, handler);
    this.listeners.push({ element, event, handler });
  }
  
  /**
   * Set interval with automatic cleanup
   */
  setInterval(callback: () => void, ms: number): NodeJS.Timeout {
    const interval = setInterval(callback, ms);
    this.intervals.add(interval);
    return interval;
  }
  
  /**
   * Set timeout with automatic cleanup
   */
  setTimeout(callback: () => void, ms: number): NodeJS.Timeout {
    const timeout = setTimeout(() => {
      callback();
      this.timeouts.delete(timeout);
    }, ms);
    this.timeouts.add(timeout);
    return timeout;
  }
  
  /**
   * Clean up all resources
   */
  cleanup() {
    // Remove event listeners
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.listeners = [];
    
    // Clear intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    
    // Clear timeouts
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
  }
}

/**
 * Request idle callback polyfill
 */
export const requestIdleCallback = 
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? window.requestIdleCallback
    : (callback: IdleRequestCallback) => setTimeout(() => callback({
        didTimeout: false,
        timeRemaining: () => 50
      } as IdleDeadline), 1);

/**
 * Cancel idle callback polyfill
 */
export const cancelIdleCallback =
  typeof window !== 'undefined' && 'cancelIdleCallback' in window
    ? window.cancelIdleCallback
    : clearTimeout;

/**
 * Run heavy tasks during idle time
 */
export function runWhenIdle<T>(
  task: () => T,
  options?: { timeout?: number }
): Promise<T> {
  return new Promise((resolve, reject) => {
    requestIdleCallback((deadline) => {
      try {
        if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
          const result = task();
          resolve(result);
        } else {
          // Reschedule if not enough time
          runWhenIdle(task, options).then(resolve).catch(reject);
        }
      } catch (error) {
        reject(error);
      }
    }, options);
  });
}

/**
 * Batch DOM updates
 */
export class DOMBatcher {
  private pending: Array<() => void> = [];
  private scheduled = false;
  
  /**
   * Add DOM update to batch
   */
  add(update: () => void) {
    this.pending.push(update);
    
    if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => this.flush());
    }
  }
  
  /**
   * Flush all pending updates
   */
  private flush() {
    const updates = this.pending;
    this.pending = [];
    this.scheduled = false;
    
    updates.forEach(update => update());
  }
}

/**
 * Virtual scroll for large lists
 */
export function createVirtualScroller<T>(
  container: HTMLElement,
  items: T[],
  itemHeight: number,
  renderItem: (item: T, index: number) => HTMLElement
) {
  const visibleItems = Math.ceil(container.clientHeight / itemHeight);
  const totalHeight = items.length * itemHeight;
  let scrollTop = 0;
  
  // Create viewport
  const viewport = document.createElement('div');
  viewport.style.height = `${totalHeight}px`;
  viewport.style.position = 'relative';
  
  // Render visible items
  function render() {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleItems + 1, items.length);
    
    // Clear viewport
    viewport.innerHTML = '';
    
    // Render visible items
    for (let i = startIndex; i < endIndex; i++) {
      const element = renderItem(items[i], i);
      element.style.position = 'absolute';
      element.style.top = `${i * itemHeight}px`;
      element.style.height = `${itemHeight}px`;
      viewport.appendChild(element);
    }
  }
  
  // Handle scroll
  container.addEventListener('scroll', throttle(() => {
    scrollTop = container.scrollTop;
    render();
  }, 16)); // ~60fps
  
  container.appendChild(viewport);
  render();
  
  return {
    update: (newItems: T[]) => {
      items = newItems;
      viewport.style.height = `${items.length * itemHeight}px`;
      render();
    }
  };
}