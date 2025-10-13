import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import AuditLog from '@/models/AuditLog';
import User from '@/models/User';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Simple superuser check
    const user = await User.findOne({ email: session.user.email });
    
    if (!user?.is_super_user) {
      return NextResponse.json({ 
        error: 'Superuser access required' 
      }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const hours = parseInt(searchParams.get('hours')) || 24;
    const days = parseInt(searchParams.get('days')) || 30;

    let data = {};

    switch (type) {
      case 'overview':
        // Get compliance overview metrics
        const now = new Date();
        const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

        // Get counts for different periods
        const [dailyLogs, weeklyLogs, monthlyLogs, criticalEvents, failedLogins] = await Promise.all([
          AuditLog.countDocuments({ timestamp: { $gte: dayAgo } }),
          AuditLog.countDocuments({ timestamp: { $gte: weekAgo } }),
          AuditLog.countDocuments({ timestamp: { $gte: monthAgo } }),
          AuditLog.countDocuments({ 
            timestamp: { $gte: weekAgo },
            riskLevel: { $in: ['high', 'critical'] }
          }),
          AuditLog.countDocuments({
            timestamp: { $gte: dayAgo },
            action: 'FAILED_LOGIN'
          })
        ]);

        // Get recent high-risk events
        const recentHighRisk = await AuditLog.find({
          timestamp: { $gte: dayAgo },
          riskLevel: { $in: ['high', 'critical'] }
        })
        .sort({ timestamp: -1 })
        .limit(10)
        .populate('userId', 'email name')
        .lean();

        // Compliance status checks
        const complianceChecks = {
          auditLogging: dailyLogs > 0,
          securityHeaders: true, // Set by middleware
          encryption: process.env.NODE_ENV === 'production',
          accessControl: true, // NextAuth is configured
          monitoring: !!process.env.SENTRY_DSN,
          dataRetention: true, // TTL indexes configured
          passwordPolicy: true, // Can be enhanced
          mfa: false, // To be implemented
        };

        const complianceScore = Object.values(complianceChecks).filter(Boolean).length / Object.keys(complianceChecks).length * 100;

        data = {
          metrics: {
            dailyLogs,
            weeklyLogs,
            monthlyLogs,
            criticalEvents,
            failedLogins,
            complianceScore: Math.round(complianceScore)
          },
          complianceChecks,
          recentHighRisk,
          lastUpdated: new Date()
        };
        break;

      case 'audit-logs':
        // Get paginated audit logs
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 50;
        const skip = (page - 1) * limit;
        
        const filter = {};
        
        // Add filters if provided
        const action = searchParams.get('action');
        const riskLevel = searchParams.get('riskLevel');
        const userId = searchParams.get('userId');
        
        if (action) filter.action = action;
        if (riskLevel) filter.riskLevel = riskLevel;
        if (userId) filter.userId = userId;
        
        // Time range filter
        const since = new Date(now - hours * 60 * 60 * 1000);
        filter.timestamp = { $gte: since };

        const [logs, total] = await Promise.all([
          AuditLog.find(filter)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'email name')
            .lean(),
          AuditLog.countDocuments(filter)
        ]);

        data = {
          logs,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
        break;

      case 'report':
        // Generate compliance report
        const startDate = searchParams.get('startDate') || new Date(now - days * 24 * 60 * 60 * 1000);
        const endDate = searchParams.get('endDate') || new Date();
        
        const report = await AuditLog.getComplianceReport(startDate, endDate);
        
        // Get user activity summary
        const userActivity = await AuditLog.aggregate([
          {
            $match: {
              timestamp: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
              }
            }
          },
          {
            $group: {
              _id: '$userId',
              actions: { $sum: 1 },
              lastAction: { $max: '$timestamp' }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: '$user'
          },
          {
            $project: {
              email: '$user.email',
              name: '$user.name',
              actions: 1,
              lastAction: 1
            }
          },
          {
            $sort: { actions: -1 }
          },
          {
            $limit: 20
          }
        ]);

        data = {
          report,
          userActivity,
          period: {
            start: startDate,
            end: endDate
          }
        };
        break;

      case 'security-events':
        // Get recent security events
        const securityEvents = await AuditLog.getSecurityEvents(hours);
        
        // Group by type
        const eventsByType = securityEvents.reduce((acc, event) => {
          if (!acc[event.action]) {
            acc[event.action] = [];
          }
          acc[event.action].push(event);
          return acc;
        }, {});

        data = {
          events: securityEvents,
          byType: eventsByType,
          total: securityEvents.length,
          period: hours
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Superuser API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}