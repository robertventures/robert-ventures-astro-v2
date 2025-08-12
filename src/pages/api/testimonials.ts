import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    const apiKey = import.meta.env.SENJA_API_KEY;
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const response = await fetch('https://api.senja.io/v1/testimonials', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Senja API error: ${response.status} ${response.statusText}`);
    }

    const testimonials = await response.json();

    return new Response(JSON.stringify(testimonials), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch testimonials' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
