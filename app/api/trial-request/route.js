import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import mongoose from 'mongoose';

// Schema for trial requests
const TrialRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  company: { type: String, required: true },
  phone: String,
  monthlyEmailVolume: String,
  currentPlatform: String,
  message: String,
  status: {
    type: String,
    enum: ['pending', 'contacted', 'scheduled', 'activated', 'declined'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Get or create model
const TrialRequest = mongoose.models.TrialRequest || mongoose.model('TrialRequest', TrialRequestSchema);

export async function POST(request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { name, email, company, phone, monthlyEmailVolume, currentPlatform, message } = body;

    // Validate required fields
    if (!name || !email || !company) {
      return NextResponse.json(
        { error: 'Name, email, and company are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Create trial request
    const trialRequest = new TrialRequest({
      name,
      email: email.toLowerCase(),
      company,
      phone,
      monthlyEmailVolume,
      currentPlatform,
      message,
      status: 'pending'
    });

    await trialRequest.save();

    console.log('✅ Trial request created:', {
      id: trialRequest._id,
      email: trialRequest.email,
      company: trialRequest.company
    });

    // TODO: Send notification email to sales team
    // TODO: Send confirmation email to requester
    // TODO: Add to CRM (HubSpot, Salesforce, etc.)

    return NextResponse.json({
      success: true,
      message: 'Trial request submitted successfully',
      requestId: trialRequest._id
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating trial request:', error);
    return NextResponse.json(
      { error: 'Failed to submit trial request' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve trial requests (admin only)
export async function GET(request) {
  try {
    await connectToDatabase();

    // TODO: Add authentication check for admin/superuser

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const query = status ? { status } : {};

    const requests = await TrialRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json({
      success: true,
      requests,
      total: requests.length
    });

  } catch (error) {
    console.error('Error fetching trial requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trial requests' },
      { status: 500 }
    );
  }
}
