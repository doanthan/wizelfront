import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import Store from '@/models/Store';
import User from '@/models/User';
import Contract from '@/models/Contract';
import ContractSeat from '@/models/ContractSeat';
import Role from '@/models/Role';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/lib/mongoose';

export async function GET(request) {
  try {
    await connectToDatabase();

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Debug: Checking store access for user:', session.user.email);

    // Get user details
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all stores owned by this user
    const ownedStores = await Store.find({
      owner_id: session.user.id,
      is_deleted: { $ne: true }
    }).lean();

    console.log(`User owns ${ownedStores.length} stores`);

    // Get all contracts for these stores
    const contractIds = [...new Set(ownedStores.map(s => s.contract_id?.toString()).filter(Boolean))];
    console.log(`Found ${contractIds.length} unique contracts`);

    // Get or create owner role
    let ownerRole = await Role.findOne({ name: 'owner' });
    if (!ownerRole) {
      console.log('Creating owner role...');
      ownerRole = new Role({
        name: 'owner',
        display_name: 'Owner',
        permissions: {
          stores: { create: true, read: true, update: true, delete: true },
          campaigns: { create: true, read: true, update: true, delete: true },
          analytics: { read: true, export: true },
          team: { invite: true, remove: true, manage: true },
          billing: { manage: true },
          settings: { manage: true }
        }
      });
      await ownerRole.save();
    }

    const fixes = [];

    // Check each contract
    for (const contractId of contractIds) {
      const contract = await Contract.findById(contractId);
      if (!contract) {
        console.log(`Contract ${contractId} not found`);
        continue;
      }

      // Check if user has a seat in this contract
      let seat = await ContractSeat.findOne({
        user_id: session.user.id,
        contract_id: contractId
      });

      if (!seat) {
        console.log(`Creating seat for contract ${contractId}`);
        seat = new ContractSeat({
          contract_id: contractId,
          user_id: session.user.id,
          default_role_id: ownerRole._id,
          status: 'active',
          invited_by: session.user.id,
          activated_at: new Date(),
          store_access: [] // Empty array means access to ALL stores in contract
        });
        await seat.save();

        // Update user's active_seats
        user.addSeat(contractId, contract.contract_name || 'My Contract', seat._id);
        await user.save();

        fixes.push({
          type: 'seat_created',
          contract_id: contractId,
          contract_name: contract.contract_name
        });
      } else {
        // Make sure seat is active and has proper role
        if (seat.status !== 'active') {
          seat.status = 'active';
          seat.activated_at = new Date();
          await seat.save();
          fixes.push({
            type: 'seat_activated',
            contract_id: contractId,
            contract_name: contract.contract_name
          });
        }

        // If user owns stores in this contract, ensure they have owner role
        const contractOwnedStores = ownedStores.filter(s =>
          s.contract_id?.toString() === contractId.toString()
        );

        if (contractOwnedStores.length > 0 && seat.default_role_id?.toString() !== ownerRole._id.toString()) {
          seat.default_role_id = ownerRole._id;
          await seat.save();
          fixes.push({
            type: 'role_updated',
            contract_id: contractId,
            contract_name: contract.contract_name,
            role: 'owner'
          });
        }

        // Clear store_access array to grant access to all stores
        if (seat.store_access && seat.store_access.length > 0) {
          console.log(`Clearing store_access restrictions for seat in contract ${contractId}`);
          seat.store_access = [];
          await seat.save();
          fixes.push({
            type: 'access_restrictions_cleared',
            contract_id: contractId,
            contract_name: contract.contract_name,
            message: 'Removed store-specific restrictions, now has access to all stores'
          });
        }
      }
    }

    // Now test access to store "zp7vNlc"
    const testStore = await Store.findOne({ public_id: 'zp7vNlc' });
    let canAccessTestStore = false;

    if (testStore) {
      const testSeat = await ContractSeat.findOne({
        user_id: session.user.id,
        contract_id: testStore.contract_id,
        status: 'active'
      });

      if (testSeat) {
        canAccessTestStore = testSeat.hasStoreAccess(testStore._id);
      }
    }

    // Get final list of accessible stores
    const userSeats = await ContractSeat.find({
      user_id: session.user.id,
      status: 'active'
    }).populate('default_role_id');

    const accessibleStores = [];

    for (const seat of userSeats) {
      const contractStores = await Store.find({
        contract_id: seat.contract_id,
        is_deleted: { $ne: true }
      }).lean();

      for (const store of contractStores) {
        if (seat.hasStoreAccess(store._id)) {
          accessibleStores.push({
            public_id: store.public_id,
            name: store.name,
            contract_id: seat.contract_id.toString(),
            has_access: true,
            role: seat.default_role_id?.name || 'unknown'
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      user_email: session.user.email,
      owned_stores: ownedStores.map(s => ({
        public_id: s.public_id,
        name: s.name,
        contract_id: s.contract_id?.toString()
      })),
      contracts_found: contractIds.length,
      seats_checked: userSeats.length,
      fixes_applied: fixes,
      test_store_zp7vNlc: {
        found: !!testStore,
        can_access: canAccessTestStore,
        contract_id: testStore?.contract_id?.toString()
      },
      accessible_stores: accessibleStores,
      total_accessible_stores: accessibleStores.length,
      message: fixes.length > 0 ?
        'Applied fixes to your ContractSeat entries. You should now have access to all your stores.' :
        'No fixes needed. Your ContractSeat entries look correct.'
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Failed to check/fix store access', details: error.message },
      { status: 500 }
    );
  }
}