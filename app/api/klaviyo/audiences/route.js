import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchKlaviyoAudiences } from '@/lib/klaviyo';
import Store from '@/models/Store';
import connectToDatabase from '@/lib/mongoose';

export async function GET(request) {
  try {
    await connectToDatabase();
    
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get storeId from query parameter
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    if (!storeId) {
      return NextResponse.json({ 
        error: 'Store ID is required' 
      }, { status: 400 });
    }

    // 3. Find the store by klaviyo_public_id or public_id
    let store = await Store.findOne({
      'klaviyo_integration.public_id': storeId
    });
    
    if (!store) {
      store = await Store.findOne({
        public_id: storeId
      });
    }

    if (!store) {
      return NextResponse.json({ 
        error: 'Store not found' 
      }, { status: 404 });
    }

    if (!store.klaviyo_integration?.apiKey) {
      return NextResponse.json({ 
        error: 'Klaviyo API key not configured for this store' 
      }, { status: 404 });
    }

    // 4. Check user has access to this store
    const hasAccess = await Store.hasAccess(store._id, session.user.id);
    
    if (!hasAccess) {
      // Also check if user is super admin
      const User = (await import('@/models/User')).default;
      const user = await User.findById(session.user.id);
      
      if (!user.super_admin) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // 5. Fetch audiences from Klaviyo
    const audiences = await fetchKlaviyoAudiences(store.klaviyo_integration.apiKey);

    // 6. Return formatted response
    return NextResponse.json({
      success: true,
      data: audiences,
      storeId: store.klaviyo_integration.public_id
    });

  } catch (error) {
    console.error('Error fetching audiences:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch audiences' 
    }, { status: 500 });
  }
}