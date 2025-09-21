import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from '@/lib/mongoose';
import mongoose from 'mongoose';
import Store from '@/models/Store';

export async function GET(request) {
  try {
    // Verify user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const db = mongoose.connection.db;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '90');
    const storeId = searchParams.get('storeId');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const previousStartDate = new Date();
    previousStartDate.setDate(previousStartDate.getDate() - (days * 2));
    const previousEndDate = new Date();
    previousEndDate.setDate(previousEndDate.getDate() - days);

    // Build query
    let query = {
      created_at: { $gte: startDate, $lte: endDate }
    };

    let previousQuery = {
      created_at: { $gte: previousStartDate, $lte: previousEndDate }
    };

    // If specific store selected, add to query
    if (storeId && storeId !== 'all') {
      const store = await Store.findOne({ public_id: storeId });
      if (store && store.klaviyo_integration?.public_id) {
        query.klaviyo_public_id = store.klaviyo_integration.public_id;
        previousQuery.klaviyo_public_id = store.klaviyo_integration.public_id;
      }
    }

    // Fetch current period data
    const [
      orders,
      campaignStats,
      flowStats,
      previousOrders,
      stores
    ] = await Promise.all([
      // Current period orders
      db.collection('orders').aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            total_revenue: { $sum: '$value' },
            total_orders: { $sum: 1 },
            unique_customers: { $addToSet: '$email' },
            avg_order_value: { $avg: '$value' }
          }
        }
      ]).toArray(),

      // Campaign attributed revenue
      db.collection('campaignstats').aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            attributed_revenue: { $sum: '$attributed_revenue' },
            total_recipients: { $sum: '$recipients' }
          }
        }
      ]).toArray(),

      // Flow attributed revenue
      db.collection('flowstats').aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            flow_revenue: { $sum: '$attributed_revenue' }
          }
        }
      ]).toArray(),

      // Previous period orders
      db.collection('orders').aggregate([
        { $match: previousQuery },
        {
          $group: {
            _id: null,
            total_revenue: { $sum: '$value' },
            total_orders: { $sum: 1 },
            unique_customers: { $addToSet: '$email' },
            avg_order_value: { $avg: '$value' }
          }
        }
      ]).toArray(),

      // Get store info
      Store.find({}).select('name public_id klaviyo_integration').lean()
    ]);

    // Process current period data
    const currentData = orders[0] || {
      total_revenue: 0,
      total_orders: 0,
      unique_customers: [],
      avg_order_value: 0
    };

    const campaignData = campaignStats[0] || { attributed_revenue: 0 };
    const flowData = flowStats[0] || { flow_revenue: 0 };

    // Process previous period data
    const previousData = previousOrders[0] || {
      total_revenue: 0,
      total_orders: 0,
      unique_customers: [],
      avg_order_value: 0
    };

    // Calculate customer metrics
    const uniqueCustomers = currentData.unique_customers?.length || 0;
    const previousUniqueCustomers = previousData.unique_customers?.length || 0;

    // Get new vs returning customers (simplified calculation)
    const newCustomersCount = Math.floor(uniqueCustomers * 0.72); // Approximate
    const returningCustomers = uniqueCustomers - newCustomersCount;
    const repeatRate = uniqueCustomers > 0 ? (returningCustomers / uniqueCustomers) * 100 : 0;

    // Calculate attributed revenue
    const attributedRevenue = campaignData.attributed_revenue + flowData.flow_revenue;
    const attributedPercentage = currentData.total_revenue > 0
      ? (attributedRevenue / currentData.total_revenue) * 100
      : 0;

    // Get brand info (store specific or aggregated)
    let brandInfo = {
      name: 'All Accounts',
      total_campaigns: 0,
      active_flows: 0,
      segments: 0
    };

    if (storeId && storeId !== 'all') {
      const selectedStore = stores.find(s => s.public_id === storeId);
      if (selectedStore) {
        brandInfo.name = selectedStore.name;

        // Get campaign and flow counts for this store
        const [campaignCount, flowCount] = await Promise.all([
          db.collection('campaignstats').countDocuments({
            klaviyo_public_id: selectedStore.klaviyo_integration?.public_id,
            created_at: { $gte: startDate }
          }),
          db.collection('flowstats').distinct('flow_id', {
            klaviyo_public_id: selectedStore.klaviyo_integration?.public_id
          })
        ]);

        brandInfo.total_campaigns = campaignCount;
        brandInfo.active_flows = flowCount.length;
        brandInfo.segments = Math.floor(Math.random() * 50) + 20; // Mock for now
      }
    } else {
      // Aggregate stats for all stores
      const [totalCampaigns, totalFlows] = await Promise.all([
        db.collection('campaignstats').countDocuments({ created_at: { $gte: startDate } }),
        db.collection('flowstats').distinct('flow_id')
      ]);

      brandInfo.total_campaigns = totalCampaigns;
      brandInfo.active_flows = totalFlows.length;
      brandInfo.segments = stores.length * 25; // Mock estimate
    }

    // Build response
    const response = {
      overall_revenue: currentData.total_revenue || 0,
      attributed_revenue: attributedRevenue,
      attributed_percentage: attributedPercentage,
      total_orders: currentData.total_orders || 0,
      unique_customers: uniqueCustomers,
      avg_order_value: currentData.avg_order_value || 0,
      new_customers: newCustomersCount,
      returning_customers: returningCustomers,
      repeat_rate: repeatRate,

      // Period comparison
      previous_period: {
        overall_revenue: previousData.total_revenue || 0,
        attributed_revenue: 0, // Would need to calculate from previous period
        total_orders: previousData.total_orders || 0,
        unique_customers: previousUniqueCustomers,
        avg_order_value: previousData.avg_order_value || 0,
        new_customers: Math.floor(previousUniqueCustomers * 0.72),
        returning_customers: previousUniqueCustomers - Math.floor(previousUniqueCustomers * 0.72)
      },

      // Brand/Store info
      brand: brandInfo,

      // Additional metrics
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: days
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Revenue report error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue report' },
      { status: 500 }
    );
  }
}