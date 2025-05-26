/**
 * Performance monitoring utilities
 */

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  
  /**
   * Start a performance timer
   */
  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }
  
  /**
   * End a performance timer and record the metric
   */
  endTimer(name: string, unit: string = 'ms'): number | null {
    const startTime = this.timers.get(name);
    if (!startTime) return null;
    
    const duration = performance.now() - startTime;
    this.timers.delete(name);
    
    this.recordMetric(name, duration, unit);
    return duration;
  }
  
  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, unit: string = 'ms'): void {
    this.metrics.push({
      name,
      value,
      unit,
      timestamp: Date.now()
    });
    
    // Keep only last 100 metrics in memory
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }
  
  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
  
  /**
   * Get metrics summary
   */
  getSummary(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const summary: Record<string, { values: number[] }> = {};
    
    for (const metric of this.metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = { values: [] };
      }
      summary[metric.name].values.push(metric.value);
    }
    
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    for (const [name, data] of Object.entries(summary)) {
      const values = data.values;
      result[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      };
    }
    
    return result;
  }
  
  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }
}

// Global performance monitor instance
export const perfMonitor = new PerformanceMonitor();

/**
 * Performance timing decorator
 */
export function timed(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function (...args: any[]) {
    const timerName = `${target.constructor.name}.${propertyKey}`;
    perfMonitor.startTimer(timerName);
    
    try {
      const result = await originalMethod.apply(this, args);
      perfMonitor.endTimer(timerName);
      return result;
    } catch (error) {
      perfMonitor.endTimer(timerName);
      throw error;
    }
  };
  
  return descriptor;
}

/**
 * Measure page load performance
 */
export function measurePageLoad() {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (perfData) {
      // Page load metrics
      perfMonitor.recordMetric('page.dns', perfData.domainLookupEnd - perfData.domainLookupStart);
      perfMonitor.recordMetric('page.tcp', perfData.connectEnd - perfData.connectStart);
      perfMonitor.recordMetric('page.request', perfData.responseStart - perfData.requestStart);
      perfMonitor.recordMetric('page.response', perfData.responseEnd - perfData.responseStart);
      perfMonitor.recordMetric('page.dom', perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart);
      perfMonitor.recordMetric('page.load', perfData.loadEventEnd - perfData.loadEventStart);
      perfMonitor.recordMetric('page.total', perfData.loadEventEnd - perfData.fetchStart);
      
      // Web vitals
      measureWebVitals();
    }
  });
}

/**
 * Measure web vitals
 */
export function measureWebVitals() {
  if (typeof window === 'undefined') return;
  
  // First Contentful Paint (FCP)
  const paintObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        perfMonitor.recordMetric('webvital.fcp', entry.startTime);
      }
    }
  });
  paintObserver.observe({ entryTypes: ['paint'] });
  
  // Largest Contentful Paint (LCP)
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    perfMonitor.recordMetric('webvital.lcp', lastEntry.startTime);
  });
  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  
  // First Input Delay (FID)
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const fid = entry.processingStart - entry.startTime;
      perfMonitor.recordMetric('webvital.fid', fid);
    }
  });
  fidObserver.observe({ entryTypes: ['first-input'] });
  
  // Cumulative Layout Shift (CLS)
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
        perfMonitor.recordMetric('webvital.cls', clsValue * 1000); // Convert to ms scale
      }
    }
  });
  clsObserver.observe({ entryTypes: ['layout-shift'] });
}

/**
 * Resource timing analysis
 */
export function analyzeResourceTiming() {
  if (typeof window === 'undefined') return;
  
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  const summary = {
    scripts: { count: 0, totalSize: 0, totalDuration: 0 },
    styles: { count: 0, totalSize: 0, totalDuration: 0 },
    images: { count: 0, totalSize: 0, totalDuration: 0 },
    fonts: { count: 0, totalSize: 0, totalDuration: 0 },
    other: { count: 0, totalSize: 0, totalDuration: 0 }
  };
  
  for (const resource of resources) {
    const duration = resource.responseEnd - resource.startTime;
    const size = resource.transferSize || 0;
    
    let type: keyof typeof summary = 'other';
    
    if (resource.initiatorType === 'script' || resource.name.endsWith('.js')) {
      type = 'scripts';
    } else if (resource.initiatorType === 'css' || resource.name.endsWith('.css')) {
      type = 'styles';
    } else if (resource.initiatorType === 'img' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(resource.name)) {
      type = 'images';
    } else if (/\.(woff|woff2|ttf|otf|eot)$/i.test(resource.name)) {
      type = 'fonts';
    }
    
    summary[type].count++;
    summary[type].totalSize += size;
    summary[type].totalDuration += duration;
  }
  
  return summary;
}

/**
 * Performance report generator
 */
export function generatePerformanceReport() {
  const metrics = perfMonitor.getSummary();
  const resources = analyzeResourceTiming();
  
  return {
    timestamp: new Date().toISOString(),
    metrics,
    resources,
    memory: typeof window !== 'undefined' && (performance as any).memory ? {
      usedJSHeapSize: Math.round((performance as any).memory.usedJSHeapSize / 1048576),
      totalJSHeapSize: Math.round((performance as any).memory.totalJSHeapSize / 1048576),
      jsHeapSizeLimit: Math.round((performance as any).memory.jsHeapSizeLimit / 1048576)
    } : null
  };
}

/**
 * Send performance data to analytics
 */
export function sendPerformanceData() {
  if (import.meta.env.PROD && import.meta.env.ENABLE_ANALYTICS === 'true') {
    const report = generatePerformanceReport();
    
    // Send to your analytics endpoint
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    }).catch(() => {
      // Silently fail - don't impact user experience
    });
  }
}