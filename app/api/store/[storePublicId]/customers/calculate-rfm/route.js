import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Store from '@/models/Store';

export async function POST(request, { params }) {
  try {
    const { storePublicId } = await params;

    // Connect to MongoDB and get store
    await connectToDatabase();
    const store = await Store.findOne({
      public_id: storePublicId,
      is_deleted: { $ne: true }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const klaviyoPublicId = store.klaviyo_integration?.public_id;
    if (!klaviyoPublicId) {
      return NextResponse.json({ error: 'No Klaviyo integration found' }, { status: 404 });
    }

    // Call Python backend to calculate Adaptive RFM v3.0
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${pythonBackendUrl}/api/v2/adaptive-rfm/v3/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        klaviyo_public_id: klaviyoPublicId,
        return_json_only: false, // Save to MongoDB
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || 'Python backend calculation failed');
    }

    const result = await response.json();

    // Reload store to get updated adaptive_rfm_config
    await store.reload();

    return NextResponse.json({
      success: true,
      message: 'Adaptive RFM v3.0 calculated successfully',
      klaviyo_public_id: klaviyoPublicId,
      result: result,
      store: {
        name: store.name,
        public_id: store.public_id
      }
    });

  } catch (error) {
    console.error('Error calculating Adaptive RFM:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to calculate Adaptive RFM',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
