import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import SupportTicket from '@/models/SupportTicket';
import User from '@/models/User';
import Store from '@/models/Store';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Parse form data
    const formData = await request.formData();
    const type = formData.get('type');
    const message = formData.get('message');
    const attachments = formData.getAll('attachments');
    
    // Get current page URL from headers
    const referer = request.headers.get('referer') || '';
    const userAgent = request.headers.get('user-agent') || '';
    
    // Get user details
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get store context if available
    let storeData = null;
    const urlPath = new URL(referer).pathname;
    const storeMatch = urlPath.match(/\/store\/([^\/]+)/);
    
    if (storeMatch) {
      const storePublicId = storeMatch[1];
      const store = await Store.findOne({ public_id: storePublicId });
      if (store) {
        storeData = {
          store_id: store._id,
          store_name: store.name,
          store_public_id: store.public_id
        };
      }
    }

    // Process attachments (in production, you'd upload to S3/CloudStorage)
    const processedAttachments = [];
    for (const attachment of attachments) {
      if (attachment && attachment.size > 0) {
        // In production, upload to cloud storage
        // For now, we'll store base64 or reference
        processedAttachments.push({
          filename: attachment.name,
          type: attachment.type.startsWith('image/') ? 'image' : 'file',
          size: attachment.size,
          // url: would be cloud storage URL
        });
      }
    }

    // Create subject based on type
    const subjects = {
      bug: 'Bug Report',
      feature: 'Feature Request',
      question: 'Support Question'
    };

    // Extract first line or first 100 chars as subject
    const messagePreview = message.split('\n')[0].substring(0, 100);
    const subject = `${subjects[type]}: ${messagePreview}${messagePreview.length >= 100 ? '...' : ''}`;

    // Create the support ticket
    const ticket = new SupportTicket({
      type,
      subject,
      message,
      attachments: processedAttachments,
      user: {
        user_id: user._id,
        email: user.email,
        name: user.name || user.email.split('@')[0]
      },
      store: storeData,
      metadata: {
        user_agent: userAgent,
        url: referer,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      },
      priority: type === 'bug' ? 'high' : 'medium'
    });

    await ticket.save();

    // In production, send notification email to support team
    // await sendSupportNotification(ticket);

    return NextResponse.json({
      success: true,
      ticket_id: ticket.ticket_id,
      message: 'Support ticket created successfully'
    });

  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Check if user is superuser
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build query
    const query = {};
    
    // If not superuser, only show their own tickets
    if (!user.isSuperuser) {
      query['user.user_id'] = user._id;
    }
    
    if (status) query.status = status;
    if (type) query.type = type;

    // Get tickets
    const tickets = await SupportTicket.find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Get total count for pagination
    const total = await SupportTicket.countDocuments(query);

    // Get stats if superuser
    let stats = null;
    if (user.isSuperuser) {
      stats = await SupportTicket.getStats();
    }

    return NextResponse.json({
      tickets,
      total,
      stats,
      pagination: {
        limit,
        skip,
        hasMore: skip + tickets.length < total
      }
    });

  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
}