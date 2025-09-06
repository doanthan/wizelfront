import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Contract from '@/models/Contract';
import ContractSeat from '@/models/ContractSeat';
import User from '@/models/User';
import Store from '@/models/Store';
import connectToDatabase from '@/lib/mongoose';

// GET - Get contract details with stores and users
export async function GET(request) {
  try {
    await connectToDatabase();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('id');

    if (!contractId) {
      // Get all user's contracts via ContractSeat
      const user = await User.findById(session.user.id).populate('active_seats');
      const contracts = [];
      
      for (const seatInfo of user.active_seats || []) {
        const contract = await Contract.findById(seatInfo.contract_id);
        if (contract) {
          contracts.push({
            id: contract._id,
            name: contract.contract_name,
            public_id: contract.public_id,
            status: contract.status,
            role: seatInfo.role || 'owner'
          });
        }
      }
      
      return NextResponse.json({ contracts });
    }

    // Get specific contract details
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Check if user has access to this contract via ContractSeat
    const userSeat = await ContractSeat.findUserSeatForContract(session.user.id, contractId);
    if (!userSeat && contract.owner_id.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get contract stores and seats
    const stores = await Store.find({ contract_id: contractId, is_deleted: { $ne: true } });
    const seats = await ContractSeat.findByContract(contractId);

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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contractId, email, role = 'member' } = body;

    if (!contractId || !email) {
      return NextResponse.json(
        { error: 'Contract ID and email are required' },
        { status: 400 }
      );
    }

    // Get contract and check ownership
    const contract = await ContractModel.getContractById(contractId);
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    if (contract.owner_id.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Only contract owner can add users' }, { status: 403 });
    }

    // Ensure mongoose connection
    await connectToDatabase();

    // Find user by email
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has access
    if (userToAdd.contract_access?.some(ca => ca.contract_id.toString() === contractId)) {
      return NextResponse.json({ error: 'User already has access to this contract' }, { status: 400 });
    }

    // Add user to contract
    try {
      await ContractModel.addUserToContract(contractId, userToAdd._id.toString(), role);
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contractId, updates } = body;

    if (!contractId) {
      return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 });
    }

    // Get contract and check ownership
    const contract = await ContractModel.getContractById(contractId);
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    if (contract.owner_id.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Only contract owner can update contract' }, { status: 403 });
    }

    // Update contract
    const allowedUpdates = ['name', 'billing_email', 'billing_plan', 'max_stores', 'max_users'];
    const filteredUpdates = {};
    
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    await ContractModel.updateContract(contractId, filteredUpdates);

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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Get contract and check ownership
    const contract = await ContractModel.getContractById(contractId);
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    if (contract.owner_id.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Only contract owner can remove users' }, { status: 403 });
    }

    // Can't remove the owner
    if (userId === contract.owner_id.toString()) {
      return NextResponse.json({ error: 'Cannot remove contract owner' }, { status: 400 });
    }

    // Remove user from contract
    await ContractModel.removeUserFromContract(contractId, userId);
    
    // Decrement user count
    await ContractModel.updateContract(contractId, {
      $inc: { current_users_count: -1 }
    });

    return NextResponse.json({
      message: 'User removed from contract successfully'
    });
  } catch (error) {
    console.error('Contract DELETE error:', error);
    return NextResponse.json({ error: 'Failed to remove user from contract' }, { status: 500 });
  }
}