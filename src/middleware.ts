import type { MiddlewareHandler } from 'astro';

export const onRequest: MiddlewareHandler = async ({}, next) => {
  const response = await next();

  // Legacy header for older scanners/browsers
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // Modern policy for framing control
  response.headers.set('Content-Security-Policy', "frame-ancestors 'self'");

  return response;
};


