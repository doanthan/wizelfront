import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions as nextAuthOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Store from "@/models/Store";
import { buildKlaviyoAuthOptions } from "@/lib/klaviyo-auth-helper";
import { klaviyoRequest } from "@/lib/klaviyo-api";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(nextAuthOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = await params;
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const include = searchParams.get('include') || 'template'; // Default to include template

    if (!messageId) {
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
    }

    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    // Get store with klaviyo integration
    const store = await Store.findOne({ public_id: storeId });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (!store.klaviyo_integration ||
        (!store.klaviyo_integration.apiKey && !store.klaviyo_integration.oauth_token)) {
      return NextResponse.json({
        error: "Klaviyo authentication not configured for this store"
      }, { status: 404 });
    }

    // Build OAuth-first authentication options
    const klaviyoAuthOpts = buildKlaviyoAuthOptions(store);

    // Fetch flow message from Klaviyo API
    // Reference: https://developers.klaviyo.com/en/reference/get_flow_message
    const endpoint = `flow-messages/${messageId}${include ? `?include=${include}` : ''}`;

    console.log(`[Flow Message API] Fetching flow message: ${messageId} for store: ${storeId}`);

    const messageData = await klaviyoRequest('GET', endpoint, klaviyoAuthOpts);

    if (!messageData) {
      return NextResponse.json({
        error: "Failed to fetch flow message from Klaviyo"
      }, { status: 500 });
    }

    // Parse the response to extract message content
    const message = messageData.data || messageData;
    const included = messageData.included || [];

    // Extract content based on channel type
    let content = {
      id: message.id,
      channel: message.attributes?.channel || 'email',
      name: message.attributes?.name || 'Untitled',
      created: message.attributes?.created,
      updated: message.attributes?.updated
    };

    // Check if this is an SMS message with content in attributes
    if (message.attributes?.content) {
      const smsContent = message.attributes.content;
      content.body = smsContent.body;
      content.text = smsContent.body;
      content.rawBody = smsContent.body;
      content.mediaUrl = smsContent.media_url;
      content.type = 'sms';
      content.channel = 'sms';
    } else {
      // Find the template in included data (for email messages)
      const template = included.find(item => item.type === 'template');

      if (template) {
        // Email content
        if (template.attributes?.html) {
          content.html = template.attributes.html;
          content.text = template.attributes.text;
          content.subject = message.attributes?.subject;
        }
        // SMS content in template
        else if (template.attributes?.body) {
          content.body = template.attributes.body;
          content.text = template.attributes.body;
        }
      }

      // If no template found, try to get content from message attributes directly
      if (!template && message.attributes) {
        if (message.attributes.html) {
          content.html = message.attributes.html;
          content.text = message.attributes.text;
          content.subject = message.attributes.subject;
        } else if (message.attributes.body) {
          content.body = message.attributes.body;
          content.text = message.attributes.body;
        }
      }
    }

    console.log(`[Flow Message API] Successfully fetched flow message`, {
      messageId,
      channel: content.channel,
      hasHtml: !!content.html,
      hasBody: !!content.body
    });

    return NextResponse.json({
      success: true,
      data: content
    });

  } catch (error) {
    console.error('[Flow Message API] Error:', error);
    return NextResponse.json(
      {
        error: "Failed to fetch flow message",
        details: error.message
      },
      { status: 500 }
    );
  }
}