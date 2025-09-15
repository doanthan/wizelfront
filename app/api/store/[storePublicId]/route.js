import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Store from '@/models/Store';
import Contract from '@/models/Contract';
import ContractSeat from '@/models/ContractSeat';
import Role from '@/models/Role'; // Import Role to ensure it's registered
import User from '@/models/User';
import connectToDatabase from '@/lib/mongoose';

// GET - Get single store by public ID
export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storePublicId } = await params;
    
    // Find store by public ID (excluding soft-deleted stores)
    const store = await Store.findOne({ 
      public_id: storePublicId,
      is_deleted: { $ne: true }
    }).populate('contract_id');
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Check if user has access to this store via ContractSeat
    const userSeat = await ContractSeat.findUserSeatForContract(
      session.user.id, 
      store.contract_id._id
    );
    
    // Also check if user is the contract owner
    const isOwner = store.contract_id.owner_id?.toString() === session.user.id;
    
    if (!userSeat && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check store-specific permissions
    if (userSeat && !userSeat.hasStoreAccess(store._id)) {
      return NextResponse.json({ error: 'No access to this store' }, { status: 403 });
    }

    return NextResponse.json({
      store: {
        id: store._id,
        name: store.name,
        url: store.url,
        public_id: store.public_id,
        platform: store.platform,
        timezone: store.timezone,
        currency: store.currency,
        subscription_status: store.subscription_status,
        created_at: store.created_at,
        updated_at: store.updated_at,
        contract_id: store.contract_id._id,
        contract_name: store.contract_id.contract_name,
        // Scrape/sync status fields
        scrape_job_id: store.scrape_job_id,
        scrape_status: store.scrape_status,
        scrape_completed_at: store.scrape_completed_at
      }
    });
    
  } catch (error) {
    console.error('Store GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch store' }, { status: 500 });
  }
}

// PUT - Update store by public ID
export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storePublicId } = params;
    const body = await request.json();
    const { name, url, timezone, currency } = body;
    
    // Validate required fields
    if (!name?.trim() || !url?.trim()) {
      return NextResponse.json(
        { error: 'Store name and URL are required' },
        { status: 400 }
      );
    }

    // Find store by public ID (excluding soft-deleted stores)
    const store = await Store.findOne({ 
      public_id: storePublicId,
      is_deleted: { $ne: true }
    }).populate('contract_id');
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Check if user has access to this store via ContractSeat
    const userSeat = await ContractSeat.findUserSeatForContract(
      session.user.id, 
      store.contract_id._id
    );
    
    // Also check if user is the contract owner
    const isOwner = store.contract_id.owner_id?.toString() === session.user.id;
    
    if (!userSeat && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if user has edit permissions for this store
    if (userSeat) {
      const storeRole = userSeat.getStoreRole(store._id);
      const Role = (await import('@/models/Role')).default;
      const role = await Role.findById(storeRole);
      
      // Check if role has store edit permissions
      if (!role?.permissions?.stores?.edit) {
        return NextResponse.json(
          { error: 'Insufficient permissions to edit this store' }, 
          { status: 403 }
        );
      }
    }

    // Check if store name is unique within the contract (case-insensitive)
    const existingStore = await Store.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      contract_id: store.contract_id._id,
      _id: { $ne: store._id }, // Exclude current store
      is_deleted: { $ne: true }
    });
    
    if (existingStore) {
      return NextResponse.json(
        { error: `A store named "${name}" already exists in this contract` },
        { status: 400 }
      );
    }

    // Update store
    const updatedStore = await Store.findByIdAndUpdate(
      store._id,
      {
        name: name.trim(),
        url: url.trim(),
        timezone: timezone || store.timezone,
        currency: currency || store.currency,
        updated_at: new Date()
      },
      { new: true }
    ).populate('contract_id');

    // Note: Credit tracking for store operations could be added here if needed
    // For now, store edits are free

    return NextResponse.json({
      message: 'Store updated successfully',
      store: {
        id: updatedStore._id,
        name: updatedStore.name,
        url: updatedStore.url,
        public_id: updatedStore.public_id,
        platform: updatedStore.platform,
        timezone: updatedStore.timezone,
        currency: updatedStore.currency,
        subscription_status: updatedStore.subscription_status,
        created_at: updatedStore.created_at,
        updated_at: updatedStore.updated_at,
        contract_id: updatedStore.contract_id._id,
        contract_name: updatedStore.contract_id.contract_name
      }
    });
    
  } catch (error) {
    console.error('Store PUT error:', error);
    return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
  }
}

// DELETE - Delete store by public ID
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storePublicId } = params;
    
    // Find store by public ID (excluding soft-deleted stores)
    const store = await Store.findOne({ 
      public_id: storePublicId,
      is_deleted: { $ne: true }
    }).populate('contract_id');
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Check if user has access to this store via ContractSeat
    const userSeat = await ContractSeat.findUserSeatForContract(
      session.user.id, 
      store.contract_id._id
    );
    
    // Also check if user is the contract owner
    const isOwner = store.contract_id.owner_id?.toString() === session.user.id;
    
    if (!userSeat && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if user has delete permissions for this store
    if (userSeat) {
      const storeRole = userSeat.getStoreRole(store._id);
      const Role = (await import('@/models/Role')).default;
      const role = await Role.findById(storeRole);
      
      // Check if role has store delete permissions
      if (!role?.permissions?.stores?.delete) {
        return NextResponse.json(
          { error: 'Insufficient permissions to delete this store' }, 
          { status: 403 }
        );
      }
    }

    // Soft delete all brands associated with this store
    const BrandSettings = (await import('@/models/Brand')).default;
    await BrandSettings.updateMany(
      { store_id: store._id },
      { isActive: false, isDeleted: true }
    );
    console.log(`Soft deleted all brands for store ${store.public_id}`);

    // Remove store access from all seats
    await ContractSeat.updateMany(
      { 'store_access.store_id': store._id },
      { $pull: { store_access: { store_id: store._id } } }
    );

    // Remove store tags from all ContractSeats
    // We need to unset the specific store's tags from the Map
    const storeIdStr = store._id.toString();
    await ContractSeat.updateMany(
      { [`storeTags.${storeIdStr}`]: { $exists: true } },
      { $unset: { [`storeTags.${storeIdStr}`]: "" } }
    );
    console.log(`Removed tags for store ${store.public_id} from all contract seats`);

    // Update user's store access (legacy)
    await User.updateMany(
      { 'store_permissions.store_id': store._id },
      { $pull: { store_permissions: { store_id: store._id } } }
    );
    
    await User.updateMany(
      { 'stores.store_id': store._id },
      { $pull: { stores: { store_id: store._id } } }
    );

    // Decrement store count in contract
    if (store.contract_id) {
      const contract = await Contract.findById(store.contract_id._id);
      if (contract) {
        await contract.decrementStoreCount();
      }
    }

    // Note: Credit tracking for store deletion could be added here if needed
    // Currently no credit consumption is tracked for store operations

    // Soft delete the store - mark as deleted but keep in database
    store.isActive = false;
    store.is_deleted = true;
    store.deletedAt = new Date();
    store.deletedBy = session.user.id;
    await store.save();
    console.log(`Store ${store.public_id} soft deleted`);

    return NextResponse.json({
      message: 'Store deleted successfully'
    });
    
  } catch (error) {
    console.error('Store DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete store' }, { status: 500 });
  }
}