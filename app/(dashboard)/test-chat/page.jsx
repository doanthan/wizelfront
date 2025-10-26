"use client";

import { useState, useEffect } from "react";
import { useAI } from "@/app/contexts/ai-context";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";

export default function TestChatPage() {
  const { setAIState } = useAI();
  const [activeScenario, setActiveScenario] = useState(null);

  // Base AI context structure for all tests
  const baseAIContext = {
    pageType: "test",
    isLoading: false,
    selectedStores: [],
    selectedKlaviyoIds: [],
    storeMetadata: {},
    dateRange: {
      start: new Date(),
      end: new Date(),
      preset: "test",
      daysSpan: 0
    },
    rawData: {
      campaigns: [],
      totalItems: 0
    },
    filters: {
      stores: [],
      channels: [],
      campaigns: [],
      flows: [],
      tags: [],
      status: [],
      segmentType: [],
      searchQuery: ''
    },
    insights: {
      automated: [],
      patterns: {},
      recommendations: [],
      opportunities: [],
      warnings: []
    },
    userContext: {
      recentQueries: [],
      currentIntent: '',
      focusArea: ''
    }
  };

  // Test scenarios with different data patterns
  const testScenarios = [
    {
      id: "icon-test",
      name: "Icon Replacement Test",
      description: "Tests ICON_N pattern replacement with proper Lucide icons",
      mockResponse: `Here's a test of all icon patterns:

ICON_0 This should show a check icon
ICON_1 This should show a trend icon
ICON_2 This should show a warning icon
ICON_3 This should show a tip/lightbulb icon
ICON_4 This should show a search icon
ICON_5 This should show a goal/target icon
ICON_6 This should show a revenue/dollar icon
ICON_7 This should show another revenue icon
ICON_8 This should show yet another revenue icon
ICON_9 This should show an email icon
ICON_10 This should show another email icon
ICON_11 This should show another warning icon
ICON_12 This should show a time/clock icon

All ICON_N patterns should be replaced with actual icons!`,
      aiContext: {
        ...baseAIContext,
        currentPage: "test-chat-icons",
        pageTitle: "Icon Test"
      }
    },
    {
      id: "markdown-test",
      name: "Markdown Cleanup Test",
      description: "Tests removal of ## headers and ** patterns",
      mockResponse: `**Testing Markdown Cleanup

##Main Header Test
This line should not have a header marker

###Sub Header Test
This should also be clean

**Another Header:**
Should have no ** at start

Some text with **bold text** in the middle (this should stay bold)

Next Steps:**
This should not have ** at the end`,
      aiContext: {
        ...baseAIContext,
        currentPage: "test-chat-markdown",
        pageTitle: "Markdown Test"
      }
    },
    {
      id: "double-bullet-test",
      name: "Double Bullet Test",
      description: "Tests removal of double bullet points (• followed by -)",
      mockResponse: `Testing bullet point cleanup:

Regular bullets (should work):
- First item
- Second item
- Third item

Double bullets (should be fixed):
•
- First double bullet
•
- Second double bullet
•
- Third double bullet

Mixed bullets:
• - This has both bullet and dash
• - Another one
• - And another

Standalone bullets:
•
This has a bullet on its own line`,
      aiContext: {
        ...baseAIContext,
        currentPage: "test-chat-bullets",
        pageTitle: "Bullet Test"
      }
    },
    {
      id: "emoji-test",
      name: "Emoji Replacement Test",
      description: "Tests emoji to icon replacement",
      mockResponse: `Testing emoji to icon conversion:

✅ This should be a check icon
📈 This should be a trending up icon
⚠️ This should be a warning icon
💡 This should be a lightbulb icon
🔍 This should be a search icon
📊 This should be a bar chart icon

These emojis should all be replaced with Lucide icons!

Hey there! 👋 No emoji should appear
Let me know what you'd like to dive into! 🚀 No rocket emoji`,
      aiContext: {
        ...baseAIContext,
        currentPage: "test-chat-emojis",
        pageTitle: "Emoji Test"
      }
    },
    {
      id: "combined-test",
      name: "Combined Test (All Issues)",
      description: "Tests all formatting issues together",
      mockResponse: `**Campaign Performance Analysis

##Overall Results:**
ICON_0 Revenue up 15% vs last period
ICON_1 Open rates trending upward
ICON_2 Watch out for spam complaints

**Key Metrics:
•
- Total Revenue: $45,000
•
- Average Open Rate: 28.5%
•
- Click Rate: 3.2%

###Next Steps:**
ICON_3 Consider A/B testing subject lines
ICON_4 Review segmentation strategy
ICON_5 Target high-value customers

Some **bold text** should stay bold here.

✅ Tracking is configured correctly
📈 Revenue trending up
⚠️ List growth has slowed

Would you like more details? 🚀`,
      aiContext: {
        ...baseAIContext,
        currentPage: "test-chat-combined",
        pageTitle: "Combined Test"
      }
    },
    {
      id: "loading-test",
      name: "Loading State Test",
      description: "Tests chat disabled state when data is loading",
      mockResponse: `This scenario simulates data loading. The chat input should be disabled with a loading spinner in the send button.`,
      aiContext: {
        ...baseAIContext,
        currentPage: "test-chat-loading",
        pageTitle: "Loading Test",
        isLoading: true  // This should disable the chat
      }
    },
    {
      id: "campaign-data-test",
      name: "Campaign Data Test",
      description: "Tests with realistic campaign data context",
      mockResponse: `**Past 30 Days Performance

**Overall Comparison:**
ICON_6 Revenue: $67.8K (down 8.1% from previous period)
ICON_0 Campaigns: 29 sent
ICON_1 Recipients: 151.7K total

###Key Insights:**
•
- Revenue per recipient improved 80%
•
- Reaching 49% fewer people
•
- Need to expand audience targeting

**Top Performers:
ICON_7 Oct 15: $3.2K revenue
ICON_8 Oct 10: $4.8K combined SMS/Email
ICON_9 Oct 8: $5.2K from newsletter

Next Steps:**
ICON_3 Investigate list size drop
ICON_4 Review segmentation changes
ICON_5 Expand reach while maintaining efficiency`,
      aiContext: {
        ...baseAIContext,
        currentPage: "test-chat-campaign-data",
        pageTitle: "Campaign Data Test",
        rawData: {
          campaigns: [
            { name: "Newsletter - Oct 15", revenue: 3200, openRate: 29.5, recipients: 10000 },
            { name: "SMS Campaign - Oct 10", revenue: 4800, openRate: 0, recipients: 5000 },
            { name: "Email - Oct 8", revenue: 5200, openRate: 36.2, recipients: 12000 }
          ],
          totalItems: 3
        }
      }
    },
    {
      id: "real-world-test",
      name: "Real World Response",
      description: "The actual problematic response from earlier",
      mockResponse: `Hey there! 👋

I'm not quite sure what you're looking for with "adasdasd" — that doesn't ring a bell!

Here's what I can help you with:

•
- Campaign Performance: Open rates, click rates, revenue from your email campaigns
•
- Audience Insights: Segmentation performance, subscriber engagement
•
- Revenue Analysis: Which campaigns and flows are driving the most revenue
•
- Campaign Comparisons: How your campaigns stack up against each other
•
- Performance Trends: Week-over-week or month-over-month comparisons
•
- Optimization Recommendations: What's working and what needs improvement

What would you like to know about your campaigns?** For example:
•
- "Show me my top-performing campaigns this month"
•
- "How did my email revenue compare last week vs this week?"
•
- "Which audience segment has the highest engagement?"
•
- "What's my overall campaign performance?"

Let me know what you'd like to dive into! 🚀`,
      aiContext: {
        ...baseAIContext,
        currentPage: "test-chat-real-world",
        pageTitle: "Real World Test"
      }
    }
  ];

  const loadScenario = (scenario) => {
    console.log('🧪 Loading test scenario:', scenario.name);
    setActiveScenario(scenario);

    // Set AI context for this scenario
    setAIState(scenario.aiContext);

    // Add mock message to chat
    // We'll inject this into the chat via localStorage for testing
    const mockMessage = {
      role: 'assistant',
      content: scenario.mockResponse,
      timestamp: new Date().toISOString()
    };

    // Store in localStorage so chat can pick it up
    localStorage.setItem('wizel-test-message', JSON.stringify(mockMessage));

    // Trigger a custom event to notify chat
    window.dispatchEvent(new CustomEvent('wizel-test-scenario', {
      detail: mockMessage
    }));
  };

  const clearTest = () => {
    setActiveScenario(null);
    localStorage.removeItem('wizel-test-message');
    setAIState(null);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Wizel Chat Test Suite
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test different scenarios to ensure chat formatting works correctly.
          Click "Load Scenario" to inject test data into the chat widget.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {testScenarios.map((scenario) => (
          <Card key={scenario.id} className={activeScenario?.id === scenario.id ? "border-sky-blue border-2" : ""}>
            <CardHeader>
              <CardTitle className="text-lg">{scenario.name}</CardTitle>
              <CardDescription>{scenario.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expected Result:
                  </p>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {scenario.id === 'icon-test' && (
                      <>
                        <li>• All ICON_N patterns replaced with actual icons</li>
                        <li>• No "ICON_0", "ICON_1", etc. visible</li>
                      </>
                    )}
                    {scenario.id === 'markdown-test' && (
                      <>
                        <li>• No ## or ### visible</li>
                        <li>• No ** at start/end of lines</li>
                        <li>• **bold** in middle of text should work</li>
                      </>
                    )}
                    {scenario.id === 'double-bullet-test' && (
                      <>
                        <li>• No • followed by - on next line</li>
                        <li>• Single - bullet points only</li>
                      </>
                    )}
                    {scenario.id === 'emoji-test' && (
                      <>
                        <li>• All emojis replaced with Lucide icons</li>
                        <li>• No 👋 🚀 📈 ✅ emojis visible</li>
                      </>
                    )}
                    {scenario.id === 'loading-test' && (
                      <>
                        <li>• Chat input should be disabled</li>
                        <li>• Send button shows loading spinner</li>
                        <li>• Placeholder says "Loading data..."</li>
                      </>
                    )}
                    {scenario.id === 'combined-test' && (
                      <>
                        <li>• All icons replaced (no ICON_N)</li>
                        <li>• No ## headers or ** artifacts</li>
                        <li>• No double bullets</li>
                        <li>• No emojis</li>
                      </>
                    )}
                    {scenario.id === 'real-world-test' && (
                      <>
                        <li>• No 👋 or 🚀 emojis</li>
                        <li>• No double bullets (• followed by -)</li>
                        <li>• No ** at end of "campaigns?**"</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => loadScenario(scenario)}
                    className="flex-1 bg-sky-blue hover:bg-royal-blue text-white"
                  >
                    Load Scenario
                  </Button>
                  {activeScenario?.id === scenario.id && (
                    <Button
                      onClick={clearTest}
                      variant="outline"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8 border-amber-500 border-2">
        <CardHeader>
          <CardTitle className="text-amber-700 dark:text-amber-400">
            Testing Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Click "Load Scenario" on any test case above</li>
            <li>Open the Wizel chat widget (bottom right corner)</li>
            <li>The test message will appear in the chat</li>
            <li>Verify the formatting matches the "Expected Result"</li>
            <li>Check the browser console for debug logs</li>
            <li>Try another scenario or click "Clear" to reset</li>
          </ol>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Pro Tip:</strong> Open browser DevTools (F12) and check the Console tab.
              You should see logs like "🔄 Replacing N instances of ICON_X" showing the icon replacement is working.
            </p>
          </div>
        </CardContent>
      </Card>

      {activeScenario && (
        <Card className="mt-6 border-green-500 border-2">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-400">
              Active Scenario: {activeScenario.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Raw Response (what AI generated):
              </p>
              <pre className="text-xs bg-white dark:bg-gray-900 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                {activeScenario.mockResponse}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
