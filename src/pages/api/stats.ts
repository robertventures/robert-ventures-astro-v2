import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const apiBase = import.meta.env.PUBLIC_API_BASE_URL;
    
    if (!apiBase) {
      console.error('PUBLIC_API_BASE_URL environment variable is not set');
      return new Response(JSON.stringify({ 
        error: 'API base URL not configured',
        // Return fallback values so the frontend still works
        usersWithInvestments: 68,
        totalAmountRaised: "1070000",
        percentUsersWithMultipleInvestments: 24
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const statsUrl = `${apiBase}/api/stats`;
    const response = await fetch(statsUrl);

    if (!response.ok) {
      console.error('Stats API error:', response.status, response.statusText);
      return new Response(JSON.stringify({ 
        error: 'Stats API error',
        // Return fallback values
        usersWithInvestments: 68,
        totalAmountRaised: "1070000",
        percentUsersWithMultipleInvestments: 24
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const stats = await response.json();

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch stats',
      // Return fallback values
      usersWithInvestments: 68,
      totalAmountRaised: "1070000",
      percentUsersWithMultipleInvestments: 24
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
