import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Store from "@/models/Store";

export async function GET(request) {
  try {
    await connectToDatabase();

    // Get all stores
    const stores = await Store.find({})
      .select('name public_id klaviyo_integration')
      .lean();

    const debug = {
      timestamp: new Date().toISOString(),
      totalStores: stores.length,
      stores: stores.map(store => ({
        name: store.name,
        public_id: store.public_id,
        _id: store._id.toString(),
        has_klaviyo_integration: !!store.klaviyo_integration,
        klaviyo_public_id: store.klaviyo_integration?.public_id || null,
        klaviyo_integration_details: store.klaviyo_integration ? {
          has_public_id: !!store.klaviyo_integration.public_id,
          has_api_key: !!store.klaviyo_integration.apiKey,
          has_oauth_token: !!store.klaviyo_integration.oauth_token,
          public_id_value: store.klaviyo_integration.public_id
        } : null
      })),
      summary: {
        totalStores: stores.length,
        storesWithKlaviyo: stores.filter(s => s.klaviyo_integration?.public_id).length,
        storesWithoutKlaviyo: stores.filter(s => !s.klaviyo_integration?.public_id).length,
        klaviyoPublicIds: stores
          .map(s => s.klaviyo_integration?.public_id)
          .filter(Boolean),
        foundKlaviyoId: stores.some(s => s.klaviyo_integration?.public_id === "XqkVGb")
      }
    };

    return NextResponse.json({
      success: true,
      debug
    });

  } catch (error) {
    console.error('Stores debug error:', error);
    return NextResponse.json({
      error: "Stores debug failed",
      details: error.message
    }, { status: 500 });
  }
}