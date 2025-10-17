import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    // Simple superuser check - ignore complex roles/permissions
    const user = await User.findOne({ email: session.user.email });
    
    if (!user?.is_super_user) {
      return NextResponse.json({ 
        error: "Superuser access required" 
      }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build query for non-super users
    let query = {
      is_super_user: { $ne: true },
      status: { $in: ['active', 'inactive'] }
    };

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);

    // Fetch users with pagination
    const users = await User.find(query)
      .select('name email status last_login stores active_seats createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Enhanced user data with store information
    const enhancedUsers = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      status: user.status,
      last_login: user.last_login,
      created_at: user.createdAt,
      store_count: (user.stores?.length || 0) + (user.active_seats?.length || 0),
      store_names: [
        ...(user.stores?.map(s => s.store_public_id) || []),
        ...(user.active_seats?.map(s => s.contract_name) || [])
      ].slice(0, 3) // Show first 3 stores
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalUsers / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Log superuser action for audit purposes
    console.log(`[AUDIT] Superuser ${user.email} accessed user list at ${new Date().toISOString()}`);

    return NextResponse.json({
      users: enhancedUsers,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        limit,
        hasNextPage,
        hasPreviousPage
      }
    });

  } catch (error) {
    console.error('Superuser API error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}