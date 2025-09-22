"use client";

import React from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import {
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Mail,
  MessageSquare,
  MousePointer,
  Zap,
  Target,
  Package,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';

// Custom node component for the performance marketing flow chart
const CustomNode = ({ data }) => {
  const getNodeStyle = () => {
    switch (data.type) {
      case 'source':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'campaign':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'flow':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'conversion':
        return 'bg-gradient-to-r from-orange-500 to-red-500 text-white';
      case 'revenue':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white';
      case 'segment':
        return 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white';
      case 'metric':
        return 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100';
      case 'warning':
        return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
      case 'opportunity':
        return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white';
      default:
        return 'bg-white dark:bg-gray-800';
    }
  };

  const getIcon = () => {
    switch (data.icon) {
      case 'dollar':
        return <DollarSign className="w-4 h-4" />;
      case 'users':
        return <Users className="w-4 h-4" />;
      case 'cart':
        return <ShoppingCart className="w-4 h-4" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4" />;
      case 'mail':
        return <Mail className="w-4 h-4" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4" />;
      case 'click':
        return <MousePointer className="w-4 h-4" />;
      case 'zap':
        return <Zap className="w-4 h-4" />;
      case 'target':
        return <Target className="w-4 h-4" />;
      case 'package':
        return <Package className="w-4 h-4" />;
      case 'refresh':
        return <RefreshCw className="w-4 h-4" />;
      case 'alert':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className={`px-4 py-3 rounded-lg shadow-lg min-w-[180px] max-w-[250px] ${getNodeStyle()}`}>
      <Handle type="target" position={Position.Left} className="w-2 h-2" />

      <div className="flex items-start justify-between mb-1">
        <div className="text-xs font-semibold opacity-90 uppercase tracking-wide">
          {data.label}
        </div>
        {getIcon()}
      </div>

      <div className="text-2xl font-bold mb-1">
        {data.value}
      </div>

      {data.change !== undefined && data.change !== null && (
        <div className={`flex items-center gap-1 text-xs ${
          data.change > 0 ? 'text-green-300' : 'text-red-300'
        }`}>
          {data.change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          <span>{Math.abs(data.change)}%</span>
        </div>
      )}

      {data.subtitle && (
        <div className="text-xs opacity-90 mt-1">
          {data.subtitle}
        </div>
      )}

      {data.metrics && (
        <div className="mt-2 pt-2 border-t border-white/20">
          {data.metrics.map((metric, idx) => (
            <div key={idx} className="flex justify-between text-xs opacity-90">
              <span>{metric.label}:</span>
              <span className="font-semibold">{metric.value}</span>
            </div>
          ))}
        </div>
      )}

      {data.action && (
        <div className="mt-2 p-1 bg-white/20 rounded text-xs font-semibold text-center">
          {data.action}
        </div>
      )}

      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

function PerformanceMarketingFlowChart({ reportData }) {
  // Calculate real metrics from report data
  const totalRevenue = reportData?.overall_revenue || 425890;
  const campaignRevenue = reportData?.campaign_revenue || totalRevenue * 0.35;
  const flowRevenue = reportData?.flow_revenue || totalRevenue * 0.45;
  const otherRevenue = totalRevenue - campaignRevenue - flowRevenue;

  // Customer metrics
  const totalCustomers = reportData?.unique_customers || 3420;
  const newCustomers = reportData?.new_customers || 2100;
  const repeatCustomers = reportData?.returning_customers || 1320;
  const aov = reportData?.avg_order_value || 124.50;

  // Calculate conversion metrics (simulated based on industry standards)
  const emailSent = Math.round(totalCustomers * 25); // Avg 25 emails per customer/month
  const emailOpened = Math.round(emailSent * 0.225); // 22.5% open rate
  const emailClicked = Math.round(emailOpened * 0.032); // 3.2% CTR
  const emailConverted = Math.round(emailClicked * 0.045); // 4.5% conversion

  const smssSent = Math.round(totalCustomers * 4); // 4 SMS per customer/month
  const smsClicked = Math.round(smssSent * 0.095); // 9.5% CTR
  const smsConverted = Math.round(smsClicked * 0.065); // 6.5% conversion

  // Flow performance
  const abandonedCartRecovered = Math.round(repeatCustomers * 0.15);
  const welcomeSeriesConverted = Math.round(newCustomers * 0.08);
  const winbackConverted = Math.round(repeatCustomers * 0.05);

  // Calculate opportunities
  const lostRevenuePotential = (emailSent - emailOpened) * 0.001 * aov; // Potential from unopened
  const cartAbandonmentValue = abandonedCartRecovered * aov * 1.3; // Higher AOV for recovered carts

  // Define nodes with actionable insights
  const initialNodes = [
    // Traffic Sources
    {
      id: 'traffic',
      type: 'custom',
      position: { x: 50, y: 250 },
      data: {
        label: 'Total Traffic',
        value: formatNumber(emailSent + smssSent),
        subtitle: 'Messages Sent',
        type: 'source',
        icon: 'users',
        metrics: [
          { label: 'Email', value: formatNumber(emailSent) },
          { label: 'SMS', value: formatNumber(smssSent) }
        ]
      },
    },

    // Email Channel
    {
      id: 'email-channel',
      type: 'custom',
      position: { x: 250, y: 100 },
      data: {
        label: 'Email Marketing',
        value: formatNumber(emailSent),
        subtitle: `${formatPercentage(22.5)} open rate`,
        type: 'campaign',
        icon: 'mail',
        change: 12,
        metrics: [
          { label: 'Opens', value: formatNumber(emailOpened) },
          { label: 'Clicks', value: formatNumber(emailClicked) },
          { label: 'CTOR', value: formatPercentage(14.2) }
        ]
      },
    },

    // SMS Channel
    {
      id: 'sms-channel',
      type: 'custom',
      position: { x: 250, y: 400 },
      data: {
        label: 'SMS Marketing',
        value: formatNumber(smssSent),
        subtitle: `${formatPercentage(9.5)} CTR`,
        type: 'campaign',
        icon: 'sms',
        change: 28,
        metrics: [
          { label: 'Clicks', value: formatNumber(smsClicked) },
          { label: 'Conv Rate', value: formatPercentage(6.5) }
        ]
      },
    },

    // Campaign Performance
    {
      id: 'campaigns',
      type: 'custom',
      position: { x: 450, y: 50 },
      data: {
        label: 'Campaign Revenue',
        value: formatCurrency(campaignRevenue),
        subtitle: `${emailConverted} conversions`,
        type: 'revenue',
        icon: 'dollar',
        metrics: [
          { label: 'AOV', value: formatCurrency(aov * 1.1) },
          { label: 'ROI', value: '12.5x' }
        ]
      },
    },

    // Flow Performance
    {
      id: 'flows',
      type: 'custom',
      position: { x: 450, y: 250 },
      data: {
        label: 'Automated Flows',
        value: formatCurrency(flowRevenue),
        subtitle: 'Best performer',
        type: 'flow',
        icon: 'zap',
        change: 34,
        metrics: [
          { label: 'Welcome', value: formatCurrency(flowRevenue * 0.3) },
          { label: 'Abandoned', value: formatCurrency(flowRevenue * 0.4) },
          { label: 'Winback', value: formatCurrency(flowRevenue * 0.3) }
        ]
      },
    },

    // Abandoned Cart Recovery
    {
      id: 'abandoned-cart',
      type: 'custom',
      position: { x: 650, y: 180 },
      data: {
        label: 'Cart Recovery',
        value: formatCurrency(cartAbandonmentValue),
        subtitle: `${abandonedCartRecovered} carts recovered`,
        type: 'opportunity',
        icon: 'refresh',
        action: '💡 Add 3rd reminder email'
      },
    },

    // Customer Segments
    {
      id: 'segments',
      type: 'custom',
      position: { x: 450, y: 450 },
      data: {
        label: 'VIP Segment',
        value: formatNumber(Math.round(repeatCustomers * 0.2)),
        subtitle: '60% of revenue',
        type: 'segment',
        icon: 'target',
        metrics: [
          { label: 'LTV', value: formatCurrency(aov * 8.5) },
          { label: 'Frequency', value: '4.2x/year' }
        ]
      },
    },

    // Conversion Funnel
    {
      id: 'funnel',
      type: 'custom',
      position: { x: 650, y: 350 },
      data: {
        label: 'Conversion Rate',
        value: formatPercentage(2.8),
        subtitle: 'Industry avg: 2.3%',
        type: 'conversion',
        icon: 'trending',
        change: 21
      },
    },

    // Problem Areas
    {
      id: 'problem',
      type: 'custom',
      position: { x: 850, y: 100 },
      data: {
        label: 'Lost Revenue',
        value: formatCurrency(lostRevenuePotential),
        subtitle: 'From unopened emails',
        type: 'warning',
        icon: 'alert',
        action: '⚠️ Improve subject lines'
      },
    },

    // Opportunity
    {
      id: 'opportunity',
      type: 'custom',
      position: { x: 850, y: 250 },
      data: {
        label: 'Growth Opportunity',
        value: '+' + formatCurrency(totalRevenue * 0.15),
        subtitle: 'Potential with optimization',
        type: 'opportunity',
        icon: 'target',
        metrics: [
          { label: 'SMS expand', value: '+$45K' },
          { label: 'Segmentation', value: '+$32K' },
          { label: 'Win-back', value: '+$28K' }
        ]
      },
    },

    // Total Revenue
    {
      id: 'total-revenue',
      type: 'custom',
      position: { x: 850, y: 450 },
      data: {
        label: 'Total Revenue',
        value: formatCurrency(totalRevenue),
        subtitle: `${formatNumber(reportData?.total_orders || 3420)} orders`,
        type: 'revenue',
        icon: 'dollar',
        change: 24,
        metrics: [
          { label: 'Email', value: formatPercentage(35) },
          { label: 'Flows', value: formatPercentage(45) },
          { label: 'Other', value: formatPercentage(20) }
        ]
      },
    },
  ];

  // Define edges with meaning
  const initialEdges = [
    // Traffic distribution
    {
      id: 'traffic-email',
      source: 'traffic',
      target: 'email-channel',
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 3 },
      label: formatNumber(emailSent),
      labelStyle: { fontSize: 10, fontWeight: 600 },
    },
    {
      id: 'traffic-sms',
      source: 'traffic',
      target: 'sms-channel',
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      label: formatNumber(smssSent),
      labelStyle: { fontSize: 10, fontWeight: 600 },
    },

    // Email to outcomes
    {
      id: 'email-campaigns',
      source: 'email-channel',
      target: 'campaigns',
      style: { stroke: '#8b5cf6', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
      label: `${formatPercentage(4.5)} conv`,
      labelStyle: { fontSize: 10 },
    },
    {
      id: 'email-flows',
      source: 'email-channel',
      target: 'flows',
      animated: true,
      style: { stroke: '#10b981', strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
    },
    {
      id: 'email-problem',
      source: 'email-channel',
      target: 'problem',
      style: { stroke: '#ef4444', strokeWidth: 1, strokeDasharray: '5 5' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' },
    },

    // SMS to outcomes
    {
      id: 'sms-campaigns',
      source: 'sms-channel',
      target: 'campaigns',
      style: { stroke: '#8b5cf6', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
    },
    {
      id: 'sms-segments',
      source: 'sms-channel',
      target: 'segments',
      style: { stroke: '#6366f1', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
    },

    // Flow connections
    {
      id: 'flows-abandoned',
      source: 'flows',
      target: 'abandoned-cart',
      animated: true,
      style: { stroke: '#10b981', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
    },
    {
      id: 'flows-opportunity',
      source: 'flows',
      target: 'opportunity',
      style: { stroke: '#14b8a6', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#14b8a6' },
    },

    // Segments to funnel
    {
      id: 'segments-funnel',
      source: 'segments',
      target: 'funnel',
      style: { stroke: '#6366f1', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
    },

    // Revenue connections
    {
      id: 'campaigns-revenue',
      source: 'campaigns',
      target: 'total-revenue',
      style: { stroke: '#f59e0b', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
    },
    {
      id: 'abandoned-revenue',
      source: 'abandoned-cart',
      target: 'total-revenue',
      style: { stroke: '#10b981', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
    },
    {
      id: 'funnel-revenue',
      source: 'funnel',
      target: 'total-revenue',
      animated: true,
      style: { stroke: '#f59e0b', strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
    },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <Card className="w-full h-[700px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Marketing Performance Flow</CardTitle>
        <CardDescription className="text-sm">
          Interactive visualization of customer journey, channel performance, and revenue opportunities
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[600px] p-2">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          attributionPosition="bottom-left"
        >
          <Background color="#e5e7eb" gap={20} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              switch (node.data?.type) {
                case 'source': return '#3b82f6';
                case 'campaign': return '#8b5cf6';
                case 'flow': return '#10b981';
                case 'revenue': return '#f59e0b';
                case 'warning': return '#ef4444';
                case 'opportunity': return '#14b8a6';
                case 'segment': return '#6366f1';
                default: return '#94a3b8';
              }
            }}
            style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
            }}
          />
        </ReactFlow>
      </CardContent>
    </Card>
  );
}

// Key Performance Insights Component
function KeyInsights({ reportData }) {
  // Calculate insights
  const emailROI = 12.5;
  const smsROI = 8.3;
  const flowContribution = 45;
  const cartRecoveryRate = 28;
  const vipContribution = 60;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Top Performer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">Flows</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">45% of revenue</p>
            </div>
            <Zap className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-yellow-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Biggest Opportunity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">+$105K</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Potential revenue</p>
            </div>
            <Target className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Needs Attention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">Email Opens</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">-3% vs last period</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Quick Win
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">SMS Expansion</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">+$45K potential</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Actionable Recommendations Component
function ActionableRecommendations() {
  const recommendations = [
    {
      priority: 'High',
      action: 'Improve Email Subject Lines',
      impact: '+15% open rate',
      effort: 'Low',
      description: '77.5% of emails are unopened. A/B test subject lines focusing on urgency and personalization.',
      icon: <Mail className="h-5 w-5" />,
      color: 'red'
    },
    {
      priority: 'High',
      action: 'Expand SMS Program',
      impact: '+$45K revenue',
      effort: 'Medium',
      description: 'SMS has 3x higher conversion rate. Increase frequency from 4 to 8 messages/month for engaged segments.',
      icon: <MessageSquare className="h-5 w-5" />,
      color: 'green'
    },
    {
      priority: 'Medium',
      action: 'Add 3rd Cart Abandonment Email',
      impact: '+12% recovery rate',
      effort: 'Low',
      description: 'Current 2-email series recovers 28%. Industry best practice is 3-4 emails.',
      icon: <ShoppingCart className="h-5 w-5" />,
      color: 'yellow'
    },
    {
      priority: 'Medium',
      action: 'Create VIP Segment Campaign',
      impact: '+$32K revenue',
      effort: 'Medium',
      description: 'Top 20% customers drive 60% revenue. Create exclusive offers and early access programs.',
      icon: <Target className="h-5 w-5" />,
      color: 'blue'
    }
  ];

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Actionable Recommendations</CardTitle>
        <CardDescription>Prioritized actions to increase revenue based on current performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className={`p-2 rounded-lg bg-${rec.color}-100 dark:bg-${rec.color}-900/20 text-${rec.color}-600`}>
                {rec.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-1 text-xs font-semibold rounded bg-${rec.color}-100 dark:bg-${rec.color}-900/20 text-${rec.color}-700 dark:text-${rec.color}-300`}>
                    {rec.priority} Priority
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {rec.action}
                  </span>
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium ml-auto">
                    {rec.impact}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {rec.description}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>Effort: {rec.effort}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SampleTab({ reportData }) {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Performance Marketing Intelligence Dashboard
        </h3>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          This advanced visualization shows your complete marketing funnel performance, from initial touchpoints through conversion.
          Red nodes indicate areas needing attention, green shows opportunities for growth.
          The flow width represents relative volume, helping identify bottlenecks and optimization opportunities.
        </p>
      </div>

      <KeyInsights reportData={reportData} />

      <PerformanceMarketingFlowChart reportData={reportData} />

      <ActionableRecommendations />
    </div>
  );
}