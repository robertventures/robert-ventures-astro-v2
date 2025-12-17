import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    const apiKey = import.meta.env.SENJA_API_KEY;
    
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: 'API key not configured',
        message: 'SENJA_API_KEY environment variable is not set. Please set it in your .env file or environment variables.'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const response = await fetch('https://api.senja.io/v1/testimonials?include=customer,avatar,profile_picture', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Senja API error:', response.status, response.statusText, errorText);
      return new Response(JSON.stringify({ 
        error: 'Senja API error',
        status: response.status,
        statusText: response.statusText,
        details: errorText
      }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const testimonials = await response.json();

    return new Response(JSON.stringify(testimonials), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch testimonials',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
