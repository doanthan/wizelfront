import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import BrandSettings from "@/models/Brand";

export async function GET(request, { params }) {
  try {
    const { brandId } = await params;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Find brand settings by ID
    const brandSettings = await BrandSettings.findById(brandId);

    if (!brandSettings) {
      return NextResponse.json({ error: "Brand settings not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      brandSettings
    });

  } catch (error) {
    console.error('Error fetching brand settings:', error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch brand settings" },
      { status: 500 }
    );
  }
}