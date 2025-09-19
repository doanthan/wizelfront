import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Store from "@/models/Store";
import User from "@/models/User";

export async function GET(request) {
  try {
    await connectToDatabase();

    // Find the user
    const user = await User.findOne({ email: "doanthan@gmail.com" });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all stores
    const stores = await Store.find({}).select('_id name public_id');

    // Assign all stores to the user
    const storeIds = stores.map(s => s._id);

    user.store_ids = storeIds;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "User stores updated",
      user: {
        email: user.email,
        store_count: storeIds.length,
        stores: stores.map(s => ({
          name: s.name,
          public_id: s.public_id
        }))
      }
    });

  } catch (error) {
    console.error('Fix user stores error:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}