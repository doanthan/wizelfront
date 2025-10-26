import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import Store from '@/models/Store';
import { getBenchmarkForStore, compareStoreToBenchmark, calculatePerformanceScore } from '@/lib/benchmark-service';

/**
 * GET /api/store/[storePublicId]/benchmark
 *
 * Get benchmark data for a store's vertical
 * Returns benchmark metrics, industry insights, and comparison (if store metrics provided)
 */
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storePublicId } = await params;
    await connectToDatabase();

    // Get store
    const store = await Store.findOne({ public_id: storePublicId });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get benchmark for store's vertical
    const benchmark = await getBenchmarkForStore(store);

    if (!benchmark) {
      return NextResponse.json({
        error: 'No benchmark available',
        vertical: store.vertical,
        message: `No benchmark data found for vertical: ${store.vertical || 'undefined'}`,
        suggestion: 'Try setting the store vertical to a supported industry category'
      }, { status: 404 });
    }

    // Check if store metrics provided in query params (for comparison)
    const { searchParams } = new URL(request.url);
    const metricsParam = searchParams.get('metrics');

    let comparison = null;
    let performanceScore = null;

    if (metricsParam) {
      try {
        const storeMetrics = JSON.parse(metricsParam);
        comparison = compareStoreToBenchmark(storeMetrics, benchmark);

        if (!comparison.error) {
          performanceScore = calculatePerformanceScore(comparison);
        }
      } catch (error) {
        console.error('Error parsing metrics:', error);
      }
    }

    // Return benchmark data
    const response = {
      store: {
        id: store.public_id,
        name: store.name,
        vertical: store.vertical
      },
      benchmark: {
        vertical: benchmark.vertical,
        display_name: benchmark.display_name,
        category: benchmark.category,
        version: benchmark.version,
        year: benchmark.year,
        campaigns: benchmark.campaigns,
        flows: benchmark.flows,
        sms: benchmark.sms,
        segmentedCampaigns: benchmark.segmentedCampaigns,
        insights: benchmark.insights,
        data_source: benchmark.data_source,
        sample_size: benchmark.sample_size
      }
    };

    if (comparison) {
      response.comparison = comparison;
    }

    if (performanceScore !== null) {
      response.performance_score = performanceScore;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Benchmark API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * POST /api/store/[storePublicId]/benchmark/compare
 *
 * Compare store metrics to benchmark
 * Body: { campaigns: {...}, flows: {...}, sms: {...} }
 */
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storePublicId } = await params;
    await connectToDatabase();

    // Get store
    const store = await Store.findOne({ public_id: storePublicId });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get benchmark
    const benchmark = await getBenchmarkForStore(store);

    if (!benchmark) {
      return NextResponse.json({
        error: 'No benchmark available',
        vertical: store.vertical
      }, { status: 404 });
    }

    // Get store metrics from request body
    const storeMetrics = await request.json();

    // Perform comparison
    const comparison = compareStoreToBenchmark(storeMetrics, benchmark);

    if (comparison.error) {
      return NextResponse.json({
        error: 'Comparison failed',
        details: comparison.error
      }, { status: 400 });
    }

    // Calculate performance score
    const performanceScore = calculatePerformanceScore(comparison);

    return NextResponse.json({
      store: {
        id: store.public_id,
        name: store.name,
        vertical: store.vertical
      },
      benchmark: {
        vertical: benchmark.vertical,
        display_name: benchmark.display_name,
        version: benchmark.version
      },
      comparison,
      performance_score: performanceScore,
      insights: benchmark.insights
    });

  } catch (error) {
    console.error('Benchmark comparison API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
