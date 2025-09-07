import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/server-info
 * Returns server information including IP addresses, headers, and hostname
 * Useful for Cashfree authorization and IP whitelisting
 */
export async function GET(request: NextRequest) {
  try {
    // Get request headers
    const headers = Object.fromEntries(request.headers.entries());

    // Get basic server information
    const serverInfo = {
      ip: headers['x-forwarded-for']?.split(',')[0]?.trim() ||
          headers['cf-connecting-ip'] ||
          headers['x-real-ip'] ||
          'Not available',
      hostname: headers['host'] || 'Not available',
      userAgent: headers['user-agent'] || 'Not available',
      timestamp: new Date().toISOString(),
      headers: {
        // Include important headers for IP detection
        'x-forwarded-for': headers['x-forwarded-for'] || 'Not available',
        'cf-connecting-ip': headers['cf-connecting-ip'] || 'Not available',
        'x-real-ip': headers['x-real-ip'] || 'Not available',
        'x-vercel-ip': headers['x-vercel-ip'] || 'Not available',
        'x-vercel-forwarded-for': headers['x-vercel-forwarded-for'] || 'Not available',
        'host': headers['host'] || 'Not available',
        'user-agent': headers['user-agent'] || 'Not available',
        'cf-ray': headers['cf-ray'] || 'Not available',
        'cf-ipcountry': headers['cf-ipcountry'] || 'Not available',
        'x-vercel-id': headers['x-vercel-id'] || 'Not available',
        'x-vercel-deployment-url': headers['x-vercel-deployment-url'] || 'Not available',
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'Not set',
        vercel: !!process.env.VERCEL,
        vercelEnv: process.env.VERCEL_ENV || 'Not available',
        vercelRegion: process.env.VERCEL_REGION || 'Not available',
        vercelUrl: process.env.VERCEL_URL || 'Not available',
      }
    };

    return NextResponse.json(serverInfo, { status: 200 });
  } catch (error) {
    console.error("Error fetching server info:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch server information",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/server-info
 * Alternative method to get server info with additional external IP detection
 */
export async function POST(request: NextRequest) {
  try {
    // Get the same info as GET method
    const headers = Object.fromEntries(request.headers.entries());

    const serverInfo = {
      ip: headers['x-forwarded-for']?.split(',')[0]?.trim() ||
          headers['cf-connecting-ip'] ||
          headers['x-real-ip'] ||
          'Not available',
      hostname: headers['host'] || 'Not available',
      userAgent: headers['user-agent'] || 'Not available',
      timestamp: new Date().toISOString(),
      headers: {
        'x-forwarded-for': headers['x-forwarded-for'] || 'Not available',
        'cf-connecting-ip': headers['cf-connecting-ip'] || 'Not available',
        'x-real-ip': headers['x-real-ip'] || 'Not available',
        'x-vercel-ip': headers['x-vercel-ip'] || 'Not available',
        'x-vercel-forwarded-for': headers['x-vercel-forwarded-for'] || 'Not available',
        'host': headers['host'] || 'Not available',
        'user-agent': headers['user-agent'] || 'Not available',
        'cf-ray': headers['cf-ray'] || 'Not available',
        'cf-ipcountry': headers['cf-ipcountry'] || 'Not available',
        'x-vercel-id': headers['x-vercel-id'] || 'Not available',
        'x-vercel-deployment-url': headers['x-vercel-deployment-url'] || 'Not available',
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'Not set',
        vercel: !!process.env.VERCEL,
        vercelEnv: process.env.VERCEL_ENV || 'Not available',
        vercelRegion: process.env.VERCEL_REGION || 'Not available',
        vercelUrl: process.env.VERCEL_URL || 'Not available',
      }
    };

    // Try to get external IP using multiple services
    let externalIp = 'Not available';
    try {
      const services = [
        'https://api.ipify.org?format=json',
        'https://httpbin.org/ip',
        'https://api64.ipify.org?format=json'
      ];

      for (const serviceUrl of services) {
        try {
          const response = await fetch(serviceUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'StableUPI-Server-Info/1.0'
            }
          });

          if (response.ok) {
            const data = await response.json();
            externalIp = data.ip || data.origin || externalIp;
            break;
          }
        } catch {
          continue; // Try next service
        }
      }
    } catch (externalError) {
      console.error('Error fetching external IP:', externalError);
    }

    return NextResponse.json({
      ...serverInfo,
      externalIp,
      ipDetectionMethod: externalIp !== 'Not available' ? 'External service' : 'Headers only'
    }, { status: 200 });

  } catch (error) {
    console.error("Error in POST server-info:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch server information",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }                                                                                                                                 
    );
  }
}                                                                         

