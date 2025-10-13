import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Contract from '@/models/Contract';
import ContractSeat from '@/models/ContractSeat';
import User from '@/models/User';
import Store from '@/models/Store';
import connectToDatabase from '@/lib/mongoose';

// GET - Get contract details with stores and users
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('id');

    if (!contractId) {
      // Get all user's contracts via ContractSeat
      const userSeats = await ContractSeat.find({
        user_id: user._id,
        status: 'active'
      }).populate('contract_id');

      const contracts = userSeats
        .filter(seat => seat.contract_id && seat.contract_id.status === 'active')
        .map(seat => ({
          id: seat.contract_id._id,
          name: seat.contract_id.contract_name,
          public_id: seat.contract_id.public_id,
          status: seat.contract_id.status,
          role: seat.default_role_id?.name || 'member'
        }));

      return NextResponse.json({ contracts });
    }

    // Get specific contract details
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Check if user has access to this contract via ContractSeat
    const userSeat = await ContractSeat.findOne({
      user_id: user._id,
      contract_id: contractId,
      status: 'active'
    });

    if (!userSeat && !user.is_super_user) {
      return NextResponse.json({ error: 'Access denied to this contract' }, { status: 403 });
    }

    // Get contract stores and seats
    const stores = await Store.find({ contract_id: contractId, is_deleted: { $ne: true } });
    const seats = await ContractSeat.find({ contract_id: contractId });

    return NextResponse.json({
      contract: {
        id: contract._id,
        name: contract.contract_name,
        public_id: contract.public_id,
        status: contract.status,
        billing_email: contract.billing_email,
        subscription: contract.subscription
      },
      stores: stores.map(s => ({
        id: s._id,
        name: s.name,
        url: s.url,
        public_id: s.public_id,
        platform: s.platform,
        subscription_status: s.subscription_status,
      })),
      seats: seats.map(seat => ({
        id: seat._id,
        user_id: seat.user_id,
        role: seat.default_role_id,
        status: seat.status,
        seat_type: seat.seat_type
      })),
      usage: {
        stores: `${stores.length}/${contract.stores?.max_allowed || 10}`,
        seats: `${seats.length}/${contract.subscription?.max_seats || 5}`,
        ai_credits: contract.ai_credits?.current_balance || 0,
      }
    });
  } catch (error) {
    console.error('Contract GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 });
  }
}

// POST - Add user to contract
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { contractId, email, role = 'member' } = body;

    if (!contractId || !email) {
      return NextResponse.json(
        { error: 'Contract ID and email are required' },
        { status: 400 }
      );
    }

    // Get contract
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Check if user has a seat in this contract
    const seat = await ContractSeat.findOne({
      user_id: user._id,
      contract_id: contractId,
      status: 'active'
    });

    if (!seat && !user.is_super_user) {
      return NextResponse.json({ error: 'Access denied to this contract' }, { status: 403 });
    }

    // Find user to add by email
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has a seat
    const existingSeat = await ContractSeat.findOne({
      user_id: userToAdd._id,
      contract_id: contractId
    });

    if (existingSeat) {
      return NextResponse.json({ error: 'User already has access to this contract' }, { status: 400 });
    }

    // Create new seat for user
    // Note: This is simplified - you'll need to implement proper seat creation logic
    const newSeat = new ContractSeat({
      user_id: userToAdd._id,
      contract_id: contractId,
      status: 'active',
      seat_type: 'standard',
      store_access: [] // Empty array means access to all stores
    });

    await newSeat.save();

    return NextResponse.json({
      message: 'User added to contract successfully',
      user: {
        id: userToAdd._id,
        email: userToAdd.email,
        name: userToAdd.name,
        role: role,
      }
    });
  } catch (error) {
    console.error('Contract POST error:', error);
    return NextResponse.json({ error: 'Failed to add user to contract' }, { status: 500 });
  }
}

// PUT - Update contract (upgrade plan, change limits, etc.)
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { contractId, updates } = body;

    if (!contractId) {
      return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 });
    }

    // Get contract
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Check if user has a seat in this contract
    const seat = await ContractSeat.findOne({
      user_id: user._id,
      contract_id: contractId,
      status: 'active'
    });

    if (!seat && !user.is_super_user) {
      return NextResponse.json({ error: 'Access denied to this contract' }, { status: 403 });
    }

    // Update contract
    const allowedUpdates = ['contract_name', 'billing_email', 'billing_plan', 'max_stores', 'max_users'];
    const filteredUpdates = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    await Contract.findByIdAndUpdate(contractId, filteredUpdates);

    return NextResponse.json({
      message: 'Contract updated successfully',
      updates: filteredUpdates
    });
  } catch (error) {
    console.error('Contract PUT error:', error);
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
  }
}

// DELETE - Remove user from contract
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('contractId');
    const userId = searchParams.get('userId');

    if (!contractId || !userId) {
      return NextResponse.json(
        { error: 'Contract ID and User ID are required' },
        { status: 400 }
      );
    }

    // Get contract
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Check if user has a seat in this contract
    const seat = await ContractSeat.findOne({
      user_id: user._id,
      contract_id: contractId,
      status: 'active'
    });

    if (!seat && !user.is_super_user) {
      return NextResponse.json({ error: 'Access denied to this contract' }, { status: 403 });
    }

    // Find the seat to remove
    const seatToRemove = await ContractSeat.findOne({
      user_id: userId,
      contract_id: contractId
    });

    if (!seatToRemove) {
      return NextResponse.json({ error: 'User seat not found' }, { status: 404 });
    }

    // Remove the seat
    await ContractSeat.findByIdAndUpdate(seatToRemove._id, {
      status: 'inactive'
    });

    return NextResponse.json({
      message: 'User removed from contract successfully'
    });
  } catch (error) {
    console.error('Contract DELETE error:', error);
    return NextResponse.json({ error: 'Failed to remove user from contract' }, { status: 500 });
  }
}