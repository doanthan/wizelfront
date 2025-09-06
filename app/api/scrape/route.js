import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Example endpoint for communicating with the scrape server
export async function POST(request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { domain, brand_setting_id, name } = body;

    // Validate required fields
    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    // Get scrape server URL and key from environment variables
    const SCRAPE_SERVER_URL = process.env.SCRAPE_SERVER_URL || "http://localhost:8000";
    const SCRAPE_SERVER_KEY = process.env.SCRAPE_SERVER_KEY;

    if (!SCRAPE_SERVER_KEY) {
      console.error("SCRAPE_SERVER_KEY is not configured");
      return NextResponse.json({ error: "Scrape server not configured" }, { status: 500 });
    }

    // Make request to scrape server with authorization header
    const scrapeResponse = await fetch(`${SCRAPE_SERVER_URL}/api/v1/scrape`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SCRAPE_SERVER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        domain,
        brand_setting_id: brand_setting_id || "default",
        name: name || domain,
      }),
    });

    // Check if scrape request was successful
    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error("Scrape server error:", errorText);
      return NextResponse.json(
        { error: "Failed to scrape domain", details: errorText },
        { status: scrapeResponse.status }
      );
    }

    // Parse and return the scrape results
    const scrapeData = await scrapeResponse.json();
    
    return NextResponse.json({
      success: true,
      data: scrapeData,
      message: "Domain scraped successfully"
    });

  } catch (error) {
    console.error("Error in scrape endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// Example GET endpoint to check scrape server status
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const SCRAPE_SERVER_URL = process.env.SCRAPE_SERVER_URL || "http://localhost:8000";
    const SCRAPE_SERVER_KEY = process.env.SCRAPE_SERVER_KEY;

    if (!SCRAPE_SERVER_KEY) {
      return NextResponse.json({ 
        connected: false, 
        error: "SCRAPE_SERVER_KEY not configured" 
      });
    }

    // Check if scrape server is reachable
    try {
      const response = await fetch(`${SCRAPE_SERVER_URL}/health`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${SCRAPE_SERVER_KEY}`,
        },
      });

      return NextResponse.json({
        connected: response.ok,
        serverUrl: SCRAPE_SERVER_URL,
        status: response.status
      });
    } catch (fetchError) {
      return NextResponse.json({
        connected: false,
        error: "Cannot reach scrape server",
        serverUrl: SCRAPE_SERVER_URL
      });
    }

  } catch (error) {
    console.error("Error checking scrape server status:", error);
    return NextResponse.json(
      { error: "Failed to check server status" },
      { status: 500 }
    );
  }
}