import { NextResponse } from 'next/server';
import { withStoreAccess } from '@/middleware/storeAccess';
import mongoose from 'mongoose';

export const GET = withStoreAccess(async (request, context) => {
  try {
    const { store, seat } = request;

    // Get tags for this store - access the Map directly since the method might not be available
    const storeIdStr = store._id.toString();
    const tags = seat.storeTags?.get(storeIdStr) || [];

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('Error fetching store tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store tags' },
      { status: 500 }
    );
  }
});

export const POST = withStoreAccess(async (request, context) => {
  try {
    const { store, seat, role } = request;
    const { tag } = await request.json();

    if (!tag || typeof tag !== 'string') {
      return NextResponse.json({ error: 'Invalid tag' }, { status: 400 });
    }

    // Check if user has manage permission
    if (!role?.permissions?.stores?.manage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage store tags' },
        { status: 403 }
      );
    }

    // Add the tag - access the Map directly
    const storeIdStr = store._id.toString();
    const currentTags = seat.storeTags?.get(storeIdStr) || [];
    if (!currentTags.includes(tag)) {
      currentTags.push(tag);
      if (!seat.storeTags) {
        seat.storeTags = new Map();
      }
      seat.storeTags.set(storeIdStr, currentTags);
    }
    await seat.save();
    const updatedTags = currentTags;

    return NextResponse.json({ tags: updatedTags });
  } catch (error) {
    console.error('Error adding store tag:', error);
    return NextResponse.json(
      { error: 'Failed to add store tag' },
      { status: 500 }
    );
  }
});

export const PUT = withStoreAccess(async (request, context) => {
  try {
    const { store, seat, role } = request;
    const { tags } = await request.json();

    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: 'Invalid tags' }, { status: 400 });
    }

    // Check if user has manage permission
    if (!role?.permissions?.stores?.manage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage store tags' },
        { status: 403 }
      );
    }

    // Set all tags - access the Map directly
    const storeIdStr = store._id.toString();
    if (!seat.storeTags) {
      seat.storeTags = new Map();
    }
    if (tags && tags.length > 0) {
      seat.storeTags.set(storeIdStr, tags);
    } else {
      seat.storeTags.delete(storeIdStr);
    }
    await seat.save();
    const updatedTags = tags || [];

    return NextResponse.json({ tags: updatedTags });
  } catch (error) {
    console.error('Error updating store tags:', error);
    return NextResponse.json(
      { error: 'Failed to update store tags' },
      { status: 500 }
    );
  }
});

export const DELETE = withStoreAccess(async (request, context) => {
  try {
    const { store, seat, role } = request;
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');

    if (!tag) {
      return NextResponse.json({ error: 'Tag parameter required' }, { status: 400 });
    }

    // Check if user has manage permission
    if (!role?.permissions?.stores?.manage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage store tags' },
        { status: 403 }
      );
    }

    // Remove the tag - access the Map directly
    const storeIdStr = store._id.toString();
    const currentTags = seat.storeTags?.get(storeIdStr) || [];
    const updatedTags = currentTags.filter(t => t !== tag);

    if (!seat.storeTags) {
      seat.storeTags = new Map();
    }

    if (updatedTags.length > 0) {
      seat.storeTags.set(storeIdStr, updatedTags);
    } else {
      seat.storeTags.delete(storeIdStr);
    }
    await seat.save();

    return NextResponse.json({ tags: updatedTags });
  } catch (error) {
    console.error('Error removing store tag:', error);
    return NextResponse.json(
      { error: 'Failed to remove store tag' },
      { status: 500 }
    );
  }
});