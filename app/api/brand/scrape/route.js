import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import Store from "@/models/Store";
import BrandSettings from "@/models/Brand";
import scrapeClient from "@/lib/scrape-client";

// API endpoint to scrape brand data from a website and save to database
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { storeId, domain, brandName } = await request.json();

    if (!storeId || !domain) {
      return NextResponse.json(
        { error: "Store ID and domain are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verify store ownership
    const store = await Store.findOne({
      _id: storeId,
      owner_id: session.user.id,
    });

    if (!store) {
      return NextResponse.json(
        { error: "Store not found or unauthorized" },
        { status: 404 }
      );
    }

    // Find or create brand settings
    let brand = await BrandSettings.findOne({
      store_id: store._id,
      isDefault: true,
    });

    if (!brand) {
      brand = await BrandSettings.findOrCreateDefault(store._id, session.user.id);
    }

    // Scrape the domain using the scrape client
    try {
      const scrapeData = await scrapeClient.scrapeDomain({
        domain: domain,
        brand_setting_id: brand._id.toString(),
        name: brandName || store.name,
      });

      // Update brand settings with scraped data
      if (scrapeData.success && scrapeData.data) {
        const updates = {};

        // Map scraped data to brand fields
        if (scrapeData.data.logo) {
          updates.scrapedLogoUrl = scrapeData.data.logo;
          updates.logo = {
            primary_logo_url: scrapeData.data.logo,
            logo_alt_text: brandName || store.name,
            logo_type: "image",
            brand_name: brandName || store.name,
          };
        }

        if (scrapeData.data.colors) {
          // Extract primary color
          if (scrapeData.data.colors.primary) {
            updates.primaryColor = [{
              hex: scrapeData.data.colors.primary,
              name: "Primary",
            }];
          }

          // Extract secondary colors
          if (scrapeData.data.colors.secondary && Array.isArray(scrapeData.data.colors.secondary)) {
            updates.secondaryColors = scrapeData.data.colors.secondary.map((color, index) => ({
              hex: color,
              name: `Secondary ${index + 1}`,
            }));
          }
        }

        if (scrapeData.data.tagline) {
          updates.brandTagline = scrapeData.data.tagline;
        }

        if (scrapeData.data.description) {
          updates.missionStatement = scrapeData.data.description;
        }

        if (scrapeData.data.socialLinks) {
          if (scrapeData.data.socialLinks.facebook) {
            updates.socialFacebook = scrapeData.data.socialLinks.facebook;
          }
          if (scrapeData.data.socialLinks.instagram) {
            updates.socialInstagram = scrapeData.data.socialLinks.instagram;
          }
          if (scrapeData.data.socialLinks.twitter) {
            updates.socialTwitterX = scrapeData.data.socialLinks.twitter;
          }
          if (scrapeData.data.socialLinks.linkedin) {
            updates.socialLinkedIn = scrapeData.data.socialLinks.linkedin;
          }
          if (scrapeData.data.socialLinks.youtube) {
            updates.socialYouTube = scrapeData.data.socialLinks.youtube;
          }
        }

        // Update the website URL
        updates.websiteUrl = domain.startsWith("http") ? domain : `https://${domain}`;

        // Save updates to database
        await brand.updateFields(updates);

        return NextResponse.json({
          success: true,
          message: "Brand data scraped and saved successfully",
          brand: {
            id: brand._id,
            ...updates,
          },
          scrapeData: scrapeData.data,
        });
      } else {
        return NextResponse.json({
          success: false,
          message: "Scraping completed but no data extracted",
          scrapeData: scrapeData,
        });
      }
    } catch (scrapeError) {
      console.error("Scrape error:", scrapeError);
      return NextResponse.json(
        { 
          error: "Failed to scrape website", 
          details: scrapeError.message,
          hint: "Make sure the SCRAPE_SERVER is running and SCRAPE_SERVER_KEY is configured"
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in brand scrape endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// Check scrape server status
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const health = await scrapeClient.checkHealth();
    
    return NextResponse.json({
      scrapeServerStatus: health,
      configured: !!process.env.SCRAPE_SERVER_KEY,
      serverUrl: process.env.SCRAPE_SERVER_URL || "http://localhost:8000",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check scrape server status", details: error.message },
      { status: 500 }
    );
  }
}