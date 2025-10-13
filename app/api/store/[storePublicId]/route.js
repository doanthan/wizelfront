import { NextResponse } from 'next/server';
import { withStoreAccess } from '@/middleware/storeAccess';

// GET - Get single store by public ID
export const GET = withStoreAccess(async (request, context) => {
  try {
    // Access validated entities from request
    const { store, user, seat, role, contract } = request;

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
        contract_id: contract._id,
        contract_name: contract.contract_name,
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
});

// PUT - Update store by public ID
export const PUT = withStoreAccess(async (request, context) => {
  try {
    // Access validated entities from request
    const { store, user, seat, role, contract } = request;

    const body = await request.json();
    const { name, url, timezone, currency } = body;

    // Validate required fields
    if (!name?.trim() || !url?.trim()) {
      return NextResponse.json(
        { error: 'Store name and URL are required' },
        { status: 400 }
      );
    }

    // Check if user has edit permissions for this store
    if (!role?.permissions?.stores?.edit && !user.is_super_user) {
      return NextResponse.json(
        { error: 'Insufficient permissions to edit this store' },
        { status: 403 }
      );
    }

    // Check if store name is unique within the contract (case-insensitive)
    const Store = (await import('@/models/Store')).default;
    const existingStore = await Store.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      contract_id: contract._id,
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
});

// DELETE - Delete store by public ID
export const DELETE = withStoreAccess(async (request, context) => {
  try {
    // Access validated entities from request
    const { store, user, seat, role, contract } = request;

    // Check if user has delete permissions for this store
    if (!role?.permissions?.stores?.delete && !user.is_super_user) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this store' },
        { status: 403 }
      );
    }

    // Soft delete all brands associated with this store
    const BrandSettings = (await import('@/models/Brand')).default;
    await BrandSettings.updateMany(
      { store_id: store._id },
      { isActive: false, isDeleted: true }
    );
    console.log(`Soft deleted all brands for store ${store.public_id}`);

    // Remove store access from all seats
    const ContractSeat = (await import('@/models/ContractSeat')).default;
    await ContractSeat.updateMany(
      { 'store_access.store_id': store._id },
      { $pull: { store_access: { store_id: store._id } } }
    );

    // Remove store tags from all ContractSeats
    const storeIdStr = store._id.toString();
    await ContractSeat.updateMany(
      { [`storeTags.${storeIdStr}`]: { $exists: true } },
      { $unset: { [`storeTags.${storeIdStr}`]: "" } }
    );
    console.log(`Removed tags for store ${store.public_id} from all contract seats`);

    // Update user's store access (legacy)
    const User = (await import('@/models/User')).default;
    await User.updateMany(
      { 'store_permissions.store_id': store._id },
      { $pull: { store_permissions: { store_id: store._id } } }
    );

    await User.updateMany(
      { 'stores.store_id': store._id },
      { $pull: { stores: { store_id: store._id } } }
    );

    // Decrement store count in contract
    const Contract = (await import('@/models/Contract')).default;
    const contractDoc = await Contract.findById(contract._id);
    if (contractDoc) {
      await contractDoc.decrementStoreCount();
    }

    // Soft delete the store - mark as deleted but keep in database
    store.isActive = false;
    store.is_deleted = true;
    store.deletedAt = new Date();
    store.deletedBy = user._id;
    await store.save();
    console.log(`Store ${store.public_id} soft deleted`);

    return NextResponse.json({
      message: 'Store deleted successfully'
    });

  } catch (error) {
    console.error('Store DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete store' }, { status: 500 });
  }
});