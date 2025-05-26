import type { APIRoute } from 'astro';
import { getHealthCheckData } from '@/lib/startup/validation';

/**
 * Public health check endpoint
 * Returns basic health status without sensitive information
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    const healthData = await getHealthCheckData();
    
    // Return basic health status
    return new Response(JSON.stringify({
      status: healthData.status,
      timestamp: healthData.timestamp,
      version: '1.0.0', // You might want to read this from package.json
      uptime: process.uptime(),
    }), {
      status: healthData.status === 'healthy' ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  } catch (error) {
    // Return error status
    return new Response(JSON.stringify({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  }
};