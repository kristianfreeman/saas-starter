/**
 * Initialize performance optimizations
 * This script should be loaded early in the application
 */

import { measurePageLoad, measureWebVitals, sendPerformanceData } from '@/lib/performance/monitoring';
import { lazyLoadImages, prefetchPages } from '@/lib/performance/optimization';
import { setupGlobalErrorHandlers } from '@/lib/monitoring/error-handler';
import { initSentry } from '@/lib/monitoring/sentry';

// Initialize performance monitoring and optimizations
export function initializePerformance() {
  // Initialize error monitoring first
  if (import.meta.env.PROD) {
    initSentry();
  }
  
  // Setup global error handlers
  setupGlobalErrorHandlers();
  
  // Measure initial page load performance
  measurePageLoad();
  
  // Initialize optimizations when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDOMReady);
  } else {
    onDOMReady();
  }
  
  // Send performance data after page fully loads
  window.addEventListener('load', () => {
    // Wait a bit for all metrics to be collected
    setTimeout(() => {
      sendPerformanceData();
    }, 5000);
  });
  
  // Send performance data before user leaves
  window.addEventListener('beforeunload', () => {
    sendPerformanceData();
  });
}

function onDOMReady() {
  // Initialize lazy loading for images
  lazyLoadImages();
  
  // Prefetch internal links for faster navigation
  prefetchPages();
  
  // Re-initialize on page navigation (for SPAs)
  if ('navigation' in window) {
    (window as any).navigation.addEventListener('navigate', () => {
      setTimeout(() => {
        lazyLoadImages();
        prefetchPages();
      }, 100);
    });
  }
}

// Service Worker registration for offline support and caching
export function registerServiceWorker() {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('ServiceWorker registered:', registration.scope);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour
        
      } catch (error) {
        console.error('ServiceWorker registration failed:', error);
      }
    });
  }
}

// Auto-initialize if this script is loaded directly
if (typeof window !== 'undefined') {
  initializePerformance();
  registerServiceWorker();
}