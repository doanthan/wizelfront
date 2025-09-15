import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { StorePermissions } from '@/lib/store-permissions';
import { UserModel } from '@/lib/user-model';

// Get user's permissions for a specific store
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId } = params;
    
    // Get user's permissions for this store
    const permissions = await StorePermissions.getUserStorePermissions(
      session.user.id,
      storeId
    );

    if (!permissions) {
      return NextResponse.json(
        { error: 'No access to this store' },
        { status: 403 }
      );
    }

    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

// Grant or update user permissions for a store
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId } = params;
    const body = await request.json();
    const { userId, role } = body;

    // Check if current user can manage users for this store
    const canManage = await StorePermissions.userHasPermission(
      session.user.id,
      storeId,
      'canManageUsers'
    );

    if (!canManage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage users for this store' },
        { status: 403 }
      );
    }

    // Check if user already has permissions
    const existingPermissions = await StorePermissions.getUserStorePermissions(
      userId,
      storeId
    );

    if (existingPermissions) {
      // Update existing role
      await StorePermissions.updateUserRole(userId, storeId, role);
      return NextResponse.json({ 
        message: 'User role updated successfully',
        role: role 
      });
    } else {
      // Grant new access
      await StorePermissions.grantStoreAccess(
        userId,
        storeId,
        role,
        session.user.id
      );
      return NextResponse.json({ 
        message: 'Store access granted successfully',
        role: role 
      });
    }
  } catch (error) {
    console.error('Error updating permissions:', error);
    return NextResponse.json(
      { error: 'Failed to update permissions' },
      { status: 500 }
    );
  }
}

// Revoke user's access to a store
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Check if current user can manage users for this store
    const canManage = await StorePermissions.userHasPermission(
      session.user.id,
      storeId,
      'canManageUsers'
    );

    if (!canManage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage users for this store' },
        { status: 403 }
      );
    }

    // Revoke access
    await StorePermissions.revokeStoreAccess(userId, storeId);

    return NextResponse.json({ 
      message: 'Store access revoked successfully' 
    });
  } catch (error) {
    console.error('Error revoking permissions:', error);
    return NextResponse.json(
      { error: 'Failed to revoke permissions' },
      { status: 500 }
    );
  }
}