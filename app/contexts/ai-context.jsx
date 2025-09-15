"use client";

import { createContext, useContext, useState, useCallback } from 'react';

const AIContext = createContext({});

export function AIProvider({ children }) {
  const [aiState, setAIState] = useState({
    currentPage: '',
    pageTitle: '',
    data: {},
    filters: {},
    metrics: {},
    insights: [],
    timestamp: new Date().toISOString()
  });

  const updateAIState = useCallback((newState) => {
    setAIState(prevState => ({
      ...prevState,
      ...newState,
      timestamp: new Date().toISOString()
    }));
  }, []);

  const getAIContext = useCallback(() => {
    return {
      ...aiState,
      formattedContext: formatAIContext(aiState)
    };
  }, [aiState]);

  return (
    <AIContext.Provider value={{ 
      aiState, 
      updateAIState, 
      getAIContext 
    }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}

// Helper function to format AI context for Claude
function formatAIContext(state) {
  const { currentPage, pageTitle, data, filters, metrics, insights } = state;
  
  let context = `Current Page: ${pageTitle || currentPage}\n\n`;
  
  // Add filter information
  if (filters && Object.keys(filters).length > 0) {
    context += "Active Filters:\n";
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        context += `- ${key}: ${JSON.stringify(value)}\n`;
      }
    });
    context += "\n";
  }
  
  // Add key metrics
  if (metrics && Object.keys(metrics).length > 0) {
    context += "Key Metrics:\n";
    Object.entries(metrics).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        context += `- ${key}: ${formatMetricValue(value)}\n`;
      }
    });
    context += "\n";
  }
  
  // Add data summary
  if (data) {
    context += "Data Summary:\n";
    if (data.totalRecords) context += `- Total Records: ${data.totalRecords}\n`;
    if (data.dateRange) context += `- Date Range: ${data.dateRange}\n`;
    if (data.topPerformers) {
      context += `- Top Performers: ${JSON.stringify(data.topPerformers)}\n`;
    }
    if (data.trends) {
      context += `- Trends: ${JSON.stringify(data.trends)}\n`;
    }
    context += "\n";
  }
  
  // Add insights
  if (insights && insights.length > 0) {
    context += "Key Insights:\n";
    insights.forEach((insight, index) => {
      context += `${index + 1}. ${insight}\n`;
    });
  }
  
  return context;
}

function formatMetricValue(value) {
  if (typeof value === 'number') {
    // Format large numbers
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
    if (value < 1 && value > 0) return `${(value * 100).toFixed(2)}%`;
    return value.toFixed(2);
  }
  return String(value);
}

export default AIContext;