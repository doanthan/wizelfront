import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getVerticalsByCategory, getAllVerticals } from '@/lib/benchmark-service';

/**
 * GET /api/benchmarks/verticals
 *
 * Get list of all available verticals with benchmarks
 * Query params:
 *   - grouped=true: Return verticals grouped by category
 *   - grouped=false: Return flat list (default)
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const grouped = searchParams.get('grouped') === 'true';

    if (grouped) {
      // Return verticals grouped by category
      const categories = await getVerticalsByCategory();

      return NextResponse.json({
        grouped: true,
        categories,
        total: Object.values(categories).flat().length
      });
    } else {
      // Return flat list of all verticals
      const verticals = await getAllVerticals();

      return NextResponse.json({
        grouped: false,
        verticals,
        total: verticals.length
      });
    }

  } catch (error) {
    console.error('Verticals API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
