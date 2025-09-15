import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import mongoose from 'mongoose';
import Store from '@/models/Store';
import ContractSeat from '@/models/ContractSeat';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storePublicId } = await params;
    await connectToDatabase();

    // Find the store
    const store = await Store.findOne({ public_id: storePublicId });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Find user's contract seat
    const contractSeat = await ContractSeat.findUserAccessToStore(
      session.user.id,
      store._id
    );

    if (!contractSeat) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get tags for this store - access the Map directly since the method might not be available
    const storeIdStr = store._id.toString();
    const tags = contractSeat.storeTags?.get(storeIdStr) || [];

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('Error fetching store tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store tags' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storePublicId } = await params;
    const { tag } = await request.json();

    if (!tag || typeof tag !== 'string') {
      return NextResponse.json({ error: 'Invalid tag' }, { status: 400 });
    }

    await connectToDatabase();

    // Find the store
    const store = await Store.findOne({ public_id: storePublicId });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Find user's contract seat
    const contractSeat = await ContractSeat.findUserAccessToStore(
      session.user.id,
      store._id
    );

    if (!contractSeat) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if user has manage permission
    const storeRole = contractSeat.getStoreRole(store._id);
    const Role = mongoose.model('Role');
    const role = await Role.findById(storeRole);
    
    if (!role || !role.permissions.stores?.manage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage store tags' },
        { status: 403 }
      );
    }

    // Add the tag - access the Map directly
    const storeIdStr = store._id.toString();
    const currentTags = contractSeat.storeTags?.get(storeIdStr) || [];
    if (!currentTags.includes(tag)) {
      currentTags.push(tag);
      if (!contractSeat.storeTags) {
        contractSeat.storeTags = new Map();
      }
      contractSeat.storeTags.set(storeIdStr, currentTags);
    }
    await contractSeat.save();
    const updatedTags = currentTags;

    return NextResponse.json({ tags: updatedTags });
  } catch (error) {
    console.error('Error adding store tag:', error);
    return NextResponse.json(
      { error: 'Failed to add store tag' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storePublicId } = await params;
    const { tags } = await request.json();

    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: 'Invalid tags' }, { status: 400 });
    }

    await connectToDatabase();

    // Find the store
    const store = await Store.findOne({ public_id: storePublicId });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Find user's contract seat
    const contractSeat = await ContractSeat.findUserAccessToStore(
      session.user.id,
      store._id
    );

    if (!contractSeat) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if user has manage permission
    const storeRole = contractSeat.getStoreRole(store._id);
    const Role = mongoose.model('Role');
    const role = await Role.findById(storeRole);
    
    if (!role || !role.permissions.stores?.manage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage store tags' },
        { status: 403 }
      );
    }

    // Set all tags - access the Map directly
    const storeIdStr = store._id.toString();
    if (!contractSeat.storeTags) {
      contractSeat.storeTags = new Map();
    }
    if (tags && tags.length > 0) {
      contractSeat.storeTags.set(storeIdStr, tags);
    } else {
      contractSeat.storeTags.delete(storeIdStr);
    }
    await contractSeat.save();
    const updatedTags = tags || [];

    return NextResponse.json({ tags: updatedTags });
  } catch (error) {
    console.error('Error updating store tags:', error);
    return NextResponse.json(
      { error: 'Failed to update store tags' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storePublicId } = await params;
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');

    if (!tag) {
      return NextResponse.json({ error: 'Tag parameter required' }, { status: 400 });
    }

    await connectToDatabase();

    // Find the store
    const store = await Store.findOne({ public_id: storePublicId });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Find user's contract seat
    const contractSeat = await ContractSeat.findUserAccessToStore(
      session.user.id,
      store._id
    );

    if (!contractSeat) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if user has manage permission
    const storeRole = contractSeat.getStoreRole(store._id);
    const Role = mongoose.model('Role');
    const role = await Role.findById(storeRole);
    
    if (!role || !role.permissions.stores?.manage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage store tags' },
        { status: 403 }
      );
    }

    // Remove the tag - access the Map directly
    const storeIdStr = store._id.toString();
    const currentTags = contractSeat.storeTags?.get(storeIdStr) || [];
    const updatedTags = currentTags.filter(t => t !== tag);
    
    if (!contractSeat.storeTags) {
      contractSeat.storeTags = new Map();
    }
    
    if (updatedTags.length > 0) {
      contractSeat.storeTags.set(storeIdStr, updatedTags);
    } else {
      contractSeat.storeTags.delete(storeIdStr);
    }
    await contractSeat.save();

    return NextResponse.json({ tags: updatedTags });
  } catch (error) {
    console.error('Error removing store tag:', error);
    return NextResponse.json(
      { error: 'Failed to remove store tag' },
      { status: 500 }
    );
  }
}