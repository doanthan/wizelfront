"use client";
// SIMPLIFIED EMOJI HANDLING v2.1: Emojis from AI responses are detected directly and converted to Lucide icons
// No marker conversion (like [TREND]) - just pure emoji → icon transformation
// Added: Variation selector stripping + aggressive double bullet removal + debug logging
import { useState, useRef, useEffect } from 'react';
import { useAI } from '@/app/contexts/ai-context';
import { useChat } from '@/app/contexts/chat-context';
import { useStores } from '@/app/contexts/store-context';
import {
  Send,
  Sparkles,
  Table as TableIcon,
  BarChart3,
  X,
  Minimize2,
  Maximize2,
  Code2,
  HelpCircle,
  Bot,
  ChevronDown,
  Download,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Search,
  TrendingDown,
  Mail,
  Users,
  DollarSign,
  Zap,
  Target,
  Clock,
  XCircle,
  ArrowDown,
  Trash2
} from 'lucide-react';
import MorphingLoader from '@/app/components/ui/loading';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/app/hooks/use-toast';
import { formatSystemContextForDisplay } from '@/lib/ai/build-system-context';
import {
  LineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import ChatStoreSelector from '@/app/components/ai/chat-store-selector';

// Chart colors from design system
const CHART_COLORS = ['#60A5FA', '#8B5CF6', '#34D399', '#FBBF24', '#F87171'];

// Simple markdown formatter component - REWRITTEN FOR CLEAN OUTPUT
function FormattedMessage({ content }) {
  // DEBUG: Log that component is being called
  console.log('📝 FormattedMessage called with content length:', content?.length);

  // Safety check - handle undefined/null content
  if (!content) {
    console.error('❌ FormattedMessage received undefined/null content');
    return <span className="text-red-500">Error: No content to display</span>;
  }

  // Icon mapping - converts BOTH emojis AND text markers to Lucide icons
  // Note: Variation selectors (U+FE0F) are stripped during preprocessing for consistent matching
  const iconMap = {
    // Common emojis that AI generates
    '👋': { icon: null, text: 'Hi' },
    '🚀': { icon: Zap, color: 'text-sky-600 dark:text-sky-400' },
    '✅': { icon: CheckCircle2, color: 'text-green-600 dark:text-green-400' },
    '📈': { icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400' },
    '📉': { icon: TrendingDown, color: 'text-red-600 dark:text-red-400' },
    '⚠': { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400' },
    '💡': { icon: Lightbulb, color: 'text-purple-600 dark:text-purple-400' },
    '🔍': { icon: Search, color: 'text-sky-600 dark:text-sky-400' },
    '📊': { icon: BarChart3, color: 'text-indigo-600 dark:text-indigo-400' },
    '🎯': { icon: Target, color: 'text-indigo-600 dark:text-indigo-400' },
    '💰': { icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400' },
    '🏆': { icon: Target, color: 'text-yellow-600 dark:text-yellow-400' },
    '📧': { icon: Mail, color: 'text-blue-600 dark:text-blue-400' },
    '💬': { icon: Mail, color: 'text-green-600 dark:text-green-400' },
    '👥': { icon: Users, color: 'text-violet-600 dark:text-violet-400' },
    '⏰': { icon: Clock, color: 'text-orange-600 dark:text-orange-400' },
    '❌': { icon: XCircle, color: 'text-red-600 dark:text-red-400' },
    '🚨': { icon: AlertTriangle, color: 'text-red-600 dark:text-red-400' },

    // Text markers (AI system prompt uses these)
    '[CHECK]': { icon: CheckCircle2, color: 'text-green-600 dark:text-green-400' },
    '[TREND]': { icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400' },
    '[DOWN]': { icon: TrendingDown, color: 'text-red-600 dark:text-red-400' },
    '[WARNING]': { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400' },
    '[TIP]': { icon: Lightbulb, color: 'text-purple-600 dark:text-purple-400' },
    '[SEARCH]': { icon: Search, color: 'text-sky-600 dark:text-sky-400' },
    '[GOAL]': { icon: Target, color: 'text-indigo-600 dark:text-indigo-400' },
    '[AUDIENCE]': { icon: Users, color: 'text-violet-600 dark:text-violet-400' },
    '[REVENUE]': { icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400' },
    '[EMAIL]': { icon: Mail, color: 'text-blue-600 dark:text-blue-400' },
    '[QUICK]': { icon: Zap, color: 'text-yellow-600 dark:text-yellow-400' },
    '[TIME]': { icon: Clock, color: 'text-orange-600 dark:text-orange-400' },
    '[ERROR]': { icon: XCircle, color: 'text-red-600 dark:text-red-400' }
  };

  // COMPLETELY REWRITTEN: Parse text into structured tokens for clean rendering
  const formatText = (text) => {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 1: Pre-processing - Clean up text BEFORE parsing
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    let cleanText = text;

    // SIMPLIFIED: No preprocessing of emojis needed - they'll be detected directly by tokenRegex
    // This ensures emojis from AI responses are converted to Lucide icons during rendering

    // Normalize emoji variations (remove variation selectors for consistent matching)
    // Some emojis have U+FE0F (variation selector) which can cause lookup issues
    cleanText = cleanText.replace(/[\uFE00-\uFE0F]/g, '');

    // Debug: Log if we find any emojis
    if (process.env.NODE_ENV === 'development') {
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
      const foundEmojis = cleanText.match(emojiRegex);
      if (foundEmojis && foundEmojis.length > 0) {
        console.log('🔍 Found emojis in text:', foundEmojis.join(', '));
        console.log('📝 Text sample:', cleanText.substring(0, 200));
      }
    }

    // 1.3: Fix common AI output issues
    cleanText = cleanText
      // Fix missing spaces after punctuation
      .replace(/([a-z])([A-Z])/g, '$1 $2')  // "conversionindicates" → "conversion indicates"
      .replace(/(\d+\.\d+%)([a-z])/gi, '$1 $2')  // "1.35%conversion" → "1.35% conversion"

      // Remove standalone separators
      .replace(/^\s*---\s*$/gm, '')

      // Remove orphaned ** that aren't part of **text** pairs
      .replace(/\*\*([^*\s][^*]*?)([^*\s])\*\*/g, '⟪BOLD⟫$1$2⟪/BOLD⟫')  // Save valid bold
      .replace(/\*\*/g, '')  // Remove all remaining **
      .replace(/⟪BOLD⟫/g, '**')  // Restore valid bold
      .replace(/⟪\/BOLD⟫/g, '**')

      // Convert markdown headers to bold
      .replace(/^#{1,6}\s+(.+)$/gm, '**$1**');

    // 1.4: Fix bullet points - CRITICAL FIX
    // Remove ALL double bullet patterns (•\n-)
    cleanText = cleanText
      // MOST IMPORTANT: Remove "•\n- " pattern completely (removes both bullet and dash)
      // This fixes: "•\n- Recipients: 2K" → "Recipients: 2K"
      .replace(/•\s*\n\s*-\s+/g, '')

      // Remove standalone bullets on their own lines
      .replace(/^\s*•\s*$/gm, '')
      .replace(/^\s*-\s*$/gm, '')
      .replace(/^\s*\*\s*$/gm, '')

      // Remove bullets between text lines
      .replace(/\n\s*•\s*\n/gm, '\n')

      // Remove bullets followed immediately by newline
      .replace(/^•\s*\n/gm, '')
      .replace(/\n•\s*\n/gm, '\n')

      // Normalize remaining bullet markers to dashes (only those with content after them)
      .replace(/^\s*•\s+([^\n])/gm, '- $1')
      .replace(/^\s*\*\s+(?!\*)([^\n])/gm, '- $1')

      // Clean up multiple consecutive newlines (max 2)
      .replace(/\n{3,}/g, '\n\n')

      // Trim trailing spaces
      .replace(/\s+$/gm, '');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 2: Parse text into lines and render
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const lines = cleanText.split('\n');

    // Detect and render markdown tables
    const tableRegex = /^\|(.+)\|$/;
    const elements = [];
    let currentTableLines = [];
    let inTable = false;

    lines.forEach((line, lineIndex) => {
      const isTableRow = tableRegex.test(line.trim());

      if (isTableRow) {
        // Start or continue table
        if (!inTable) {
          inTable = true;
          currentTableLines = [];
        }
        currentTableLines.push(line);
      } else if (inTable) {
        // End of table - render it
        if (currentTableLines.length > 0) {
          elements.push(renderMarkdownTable(currentTableLines, `table-${lineIndex}`));
          currentTableLines = [];
        }
        inTable = false;
        // Process non-table line
        elements.push(renderLine(line, lineIndex));
      } else {
        // Normal line
        elements.push(renderLine(line, lineIndex));
      }
    });

    // Handle table at end of content
    if (inTable && currentTableLines.length > 0) {
      elements.push(renderMarkdownTable(currentTableLines, `table-end`));
    }

    return elements;
  };

  // Helper function to render a markdown table
  const renderMarkdownTable = (tableLines, key) => {
    if (tableLines.length < 2) return null;

    // Parse header
    const headerCells = tableLines[0]
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0);

    // Skip separator line (line with dashes)
    const dataLines = tableLines.slice(2);

    // Parse data rows
    const dataRows = dataLines.map(line =>
      line
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0)
    );

    return (
      <div key={key} className="my-4 overflow-x-auto">
        <table className="w-full border-collapse bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          <thead>
            <tr className="bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
              {headerCells.map((cell, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                >
                  {renderTableCell(cell, `header-${idx}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                  >
                    {renderTableCell(cell, `cell-${rowIdx}-${cellIdx}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Helper function to render table cell content with icon support and gradient bold text
  const renderTableCell = (cellText, key) => {
    // Check if cell contains bold text (needs gradient) or icon placeholders
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const iconPlaceholderRegex = /⟪ICON_(\d+)⟫/g;

    const hasBold = boldRegex.test(cellText);
    const hasIcons = iconPlaceholderRegex.test(cellText);

    // Reset regexes for actual processing
    boldRegex.lastIndex = 0;
    iconPlaceholderRegex.lastIndex = 0;

    if (!hasBold && !hasIcons) {
      // No formatting needed, return plain text
      return cellText;
    }

    // Combined regex to match both bold text and icon placeholders
    const combinedRegex = /(\*\*[^*]+\*\*|⟪ICON_(\d+)⟫)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let partKey = 0;

    while ((match = combinedRegex.exec(cellText)) !== null) {
      // Add plain text before the match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`${key}-text-${partKey++}`}>
            {cellText.substring(lastIndex, match.index)}
          </span>
        );
      }

      const matched = match[0];

      // Check if it's bold text
      if (matched.startsWith('**') && matched.endsWith('**')) {
        const boldContent = matched.slice(2, -2);
        parts.push(
          <span
            key={`${key}-bold-${partKey++}`}
            className="font-extrabold"
            style={{ color: '#8B5CF6' }}
          >
            {boldContent}
          </span>
        );
      }
      // Check if it's an icon placeholder
      else if (matched.startsWith('⟪ICON_')) {
        const iconIndex = parseInt(match[2]);
        const emojiReplacements = getEmojiReplacements();

        if (emojiReplacements[iconIndex]) {
          parts.push(
            <span key={`${key}-icon-${partKey++}`} className="inline-flex items-center mx-0.5">
              {emojiReplacements[iconIndex].icon}
            </span>
          );
        }
      }

      lastIndex = combinedRegex.lastIndex;
    }

    // Add remaining text after the last match
    if (lastIndex < cellText.length) {
      parts.push(
        <span key={`${key}-text-${partKey++}`}>
          {cellText.substring(lastIndex)}
        </span>
      );
    }

    return <span className="flex items-center gap-1">{parts}</span>;
  };

  // Helper function to get emoji replacements mapping
  const getEmojiReplacements = () => {
    // This mapping needs to match the emojiReplacements array created during formatText
    // For tables, we'll use a direct icon mapping
    return [
      { icon: <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 inline-block" /> },
      { icon: <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400 inline-block" /> },
      { icon: <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 inline-block" /> }, // ICON_2
      { icon: <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400 inline-block" /> }, // ICON_3
      { icon: <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400 inline-block" /> }, // ICON_4
      { icon: <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400 inline-block" /> }, // ICON_5
      { icon: <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400 inline-block" /> }, // ICON_6
      { icon: <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 inline-block" /> }, // ICON_7
      { icon: <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400 inline-block" /> }, // ICON_8
      { icon: <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 inline-block" /> }, // ICON_9
      { icon: <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 inline-block" /> }, // ICON_10
    ];
  };

  // Helper function to render a single line with icons and bold text
  const renderLine = (line, lineIndex) => {
      if (!line.trim()) {
        return <br key={`br-${lineIndex}`} />;
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // Parse line into tokens: text | bold | icon
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      const tokens = [];
      let remaining = line;
      let tokenKey = 0;

      // Match bold text, text markers ([TREND], [WARNING], etc.), OR emojis
      // Comprehensive emoji Unicode ranges (variation selectors are stripped during preprocessing)
      const tokenRegex = /(\*\*[^*]+\*\*|\[[A-Z]+\]|[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}])/gu;

      let lastIndex = 0;
      let match;

      while ((match = tokenRegex.exec(remaining)) !== null) {
        // Add plain text before the match
        if (match.index > lastIndex) {
          const plainText = remaining.substring(lastIndex, match.index);
          if (plainText) {
            tokens.push({
              type: 'text',
              content: plainText,
              key: `${lineIndex}-${tokenKey++}`
            });
          }
        }

        const matched = match[0];

        // SIMPLIFIED: Determine token type - only bold text or emojis
        if (matched.startsWith('**') && matched.endsWith('**')) {
          // Bold text - will render as purple
          tokens.push({
            type: 'bold',
            content: matched.slice(2, -2),  // Remove **
            key: `${lineIndex}-${tokenKey++}`
          });
        } else if (iconMap[matched]) {
          // Emoji - convert to icon
          const iconConfig = iconMap[matched];

          // Debug: Log emoji conversion
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Converting emoji "${matched}" to ${iconConfig.icon?.name || 'icon'}`);
          }

          tokens.push({
            type: 'icon',
            config: iconConfig,
            emoji: matched,
            key: `${lineIndex}-${tokenKey++}`
          });
        } else {
          // Unknown emoji or character, treat as text (don't strip it)
          if (process.env.NODE_ENV === 'development' && /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu.test(matched)) {
            console.warn(`⚠️ Unknown emoji found: "${matched}" (U+${matched.codePointAt(0).toString(16).toUpperCase()})`);
          }

          tokens.push({
            type: 'text',
            content: matched,
            key: `${lineIndex}-${tokenKey++}`
          });
        }

        lastIndex = match.index + matched.length;
      }

      // Add remaining text after last match
      if (lastIndex < remaining.length) {
        const plainText = remaining.substring(lastIndex);
        if (plainText) {
          tokens.push({
            type: 'text',
            content: plainText,
            key: `${lineIndex}-${tokenKey++}`
          });
        }
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // Render tokens into React elements
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      const renderedTokens = tokens.map(token => {
        switch (token.type) {
          case 'bold':
          case 'gradient':
            // ALL BOLD TEXT NOW USES VIVID VIOLET
            return (
              <span
                key={token.key}
                className="font-extrabold text-vivid-violet"
                style={{ color: '#8B5CF6' }}
              >
                {token.content}
              </span>
            );

          case 'icon':
            const IconComponent = token.config?.icon;
            if (IconComponent) {
              return (
                <span key={token.key} className="inline-flex items-center mx-1">
                  <IconComponent className={`h-4 w-4 flex-shrink-0 ${token.config.color}`} />
                </span>
              );
            } else if (token.config?.text) {
              // Text replacement like "Hi" for 👋
              return <span key={token.key}>{token.config.text}</span>;
            }
            // If no icon config, render as text instead of hiding it
            if (process.env.NODE_ENV === 'development') {
              console.warn(`⚠️ Icon config missing for: "${token.emoji || token.marker}"`);
            }
            // Show the original text instead of nothing
            return <span key={token.key} className="text-gray-500">{token.emoji || token.marker || '[ICON]'}</span>;

          case 'text':
          default:
            return <span key={token.key}>{token.content}</span>;
        }
      });

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // Detect list items and apply styling
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      const isListItem = line.trim().match(/^[-•*]\s/) || line.trim().match(/^\d+\.\s/);
      const isNumberedList = line.trim().match(/^\d+\.\s/);
      const isIndented = line.match(/^  /); // Indented sub-item

      if (isListItem) {
        // Determine bullet type and remove it from rendered tokens
        let bulletElement = <span className="text-sky-blue font-semibold">•</span>;

        if (isNumberedList) {
          const numberMatch = line.trim().match(/^(\d+\.)/);
          const bulletSymbol = numberMatch[1];
          bulletElement = <span className="text-sky-blue font-semibold">{bulletSymbol}</span>;
        }

        // Remove the bullet character from the first text token
        const adjustedTokens = renderedTokens.map((token, idx) => {
          if (idx === 0 && token.type === 'span' && typeof token.props?.children === 'string') {
            const cleaned = token.props.children.replace(/^[-•*]\s*|\d+\.\s*/, '');
            return <span key={token.key}>{cleaned}</span>;
          }
          return token;
        });

        return (
          <div
            key={`line-${lineIndex}`}
            className={`flex gap-2 my-1.5 items-start ${isIndented ? 'ml-6' : ''}`}
          >
            <span className="flex-shrink-0 mt-0.5">{bulletElement}</span>
            <span className="flex-1">{adjustedTokens}</span>
          </div>
        );
      }

      // Regular line (not a list item)
      return (
        <div key={`line-${lineIndex}`} className="my-1.5 leading-relaxed">
          {renderedTokens}
        </div>
      );
  };

  return <div className="text-sm">{formatText(content)}</div>;
}

export default function WizelChat() {
  const { isChatOpen, setIsChatOpen, activeTab: contextActiveTab, setActiveTab: setContextActiveTab } = useChat();
  const { stores } = useStores();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");
  const [isMinimized, setIsMinimized] = useState(false);
  const [isXLModal, setIsXLModal] = useState(false);
  const { getAIContext } = useAI();
  const { toast } = useToast();

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [lastPrompts, setLastPrompts] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Store selection for AI context - null = all stores, string = single store public_id
  const [selectedStore, setSelectedStore] = useState(null);

  // Load selected store from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('wizel-chat-selected-store');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSelectedStore(parsed);
      } catch (error) {
        console.error('Error parsing saved chat store:', error);
      }
    }
  }, []);

  // Save selected store to localStorage when changed
  useEffect(() => {
    localStorage.setItem('wizel-chat-selected-store', JSON.stringify(selectedStore));
  }, [selectedStore]);

  // Check if page data is loading (from AI context)
  const aiContext = getAIContext();
  const isPageDataLoading = aiContext?.isLoading || false;

  // Check if in development mode
  const isDev = process.env.NEXT_PUBLIC_NODE_ENV === 'development';

  // Sync with context
  useEffect(() => {
    setIsOpen(isChatOpen);
  }, [isChatOpen]);

  useEffect(() => {
    setActiveTab(contextActiveTab);
  }, [contextActiveTab]);

  useEffect(() => {
    setIsChatOpen(isOpen);
  }, [isOpen, setIsChatOpen]);

  useEffect(() => {
    setContextActiveTab(activeTab);
  }, [activeTab, setContextActiveTab]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get welcome message based on selected store (Australian English)
  const getWelcomeMessage = () => {
    if (!selectedStore) {
      return "I can analyse the data on your screen and answer questions about your campaigns, flows, and performance metrics in **ALL STORES**. What would you like to know?";
    }

    const store = stores.find(s => s.public_id === selectedStore);
    const storeName = store?.name || 'this store';
    return `I can analyse the data on your screen and answer questions about your campaigns, flows, and performance metrics in **${storeName.toUpperCase()}**. What would you like to know?`;
  };

  // Initialize with welcome message and update when store selection changes
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 1,
        type: "ai",
        content: getWelcomeMessage(),
        timestamp: new Date()
      }]);
    }
  }, []);

  // Update welcome message when store selection changes
  useEffect(() => {
    if (messages.length > 0 && messages[0].id === 1) {
      setMessages(prev => [
        {
          ...prev[0],
          content: getWelcomeMessage()
        },
        ...prev.slice(1)
      ]);
    }
  }, [selectedStore, stores]);

  // Listen for test scenarios from test-chat page
  useEffect(() => {
    const handleTestScenario = (event) => {
      console.log('🧪 Test scenario received:', event.detail);
      const testMessage = event.detail;

      // Add test message to chat
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: "ai",
        content: testMessage.content,
        timestamp: new Date(testMessage.timestamp)
      }]);

      // Open chat if not already open
      setIsOpen(true);
      setActiveTab("ai");

      // Scroll to show new message
      setTimeout(scrollToBottom, 100);
    };

    window.addEventListener('wizel-test-scenario', handleTestScenario);

    return () => {
      window.removeEventListener('wizel-test-scenario', handleTestScenario);
    };
  }, []);

  const sendMessage = async (messageText = inputValue) => {
    if (!messageText.trim()) return;

    // Handle slash commands
    if (messageText.startsWith('/')) {
      handleSlashCommand(messageText);
      setInputValue('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      return;
    }

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsTyping(true);
    setAiLoading(true);

    try {
      const aiContext = getAIContext();

      // Pass the FULL context including rawData for Tier 1 routing
      const pageContext = {
        url: window.location.pathname,
        ...aiContext, // Include ALL context data (rawData, selectedStores, dateRange, etc.)
        aiState: aiContext.aiState,
        formattedContext: aiContext.formattedContext,
        // Add chat-specific store selection (overrides page context if set)
        chatSelectedStore: selectedStore || null
      };

      const response = await fetch("/api/chat/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          context: pageContext,
          history: messages.slice(-5)
        }),
      });

      const data = await response.json();

      // Capture debug prompts if available (development mode only)
      if (data._debug?.prompts) {
        setLastPrompts(data._debug.prompts);
      }

      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          type: "ai",
          content: data.response || "I can help you analyze the data shown on your screen. Try asking me about specific metrics or trends you see.",
          data: data.data,
          toolsUsed: data.toolsUsed,
          timestamp: new Date()
        }]);
      }, 500);
    } catch (error) {
      console.error('Chat error:', error);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        type: "ai",
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        error: true,
        timestamp: new Date()
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSlashCommand = (command) => {
    const cmd = command.toLowerCase();

    if (cmd === '/table') {
      const exampleTableData = {
        type: 'table',
        columns: ['Campaign Name', 'Recipients', 'Open Rate', 'Revenue'],
        rows: [
          ['Black Friday Sale', '15,234', '45.2%', '$12,450'],
          ['Welcome Series', '8,421', '52.1%', '$8,230'],
          ['Weekly Newsletter', '23,567', '38.4%', '$5,670'],
          ['Product Launch', '12,098', '41.8%', '$15,320'],
          ['Re-engagement', '6,543', '29.3%', '$3,120']
        ],
        summary: 'Top 5 campaigns by revenue in the last 30 days'
      };

      setMessages(prev => [...prev,
        { id: prev.length + 1, type: 'user', content: '/table', timestamp: new Date() },
        {
          id: prev.length + 2,
          type: 'assistant',
          content: '📊 Here\'s an example table showing campaign performance:',
          data: exampleTableData,
          timestamp: new Date()
        }
      ]);
    } else if (cmd === '/chart') {
      const exampleChartData = {
        type: 'chart',
        chartType: 'bar',
        data: [
          { name: 'Mon', revenue: 4200, orders: 23 },
          { name: 'Tue', revenue: 5800, orders: 31 },
          { name: 'Wed', revenue: 6100, orders: 28 },
          { name: 'Thu', revenue: 7400, orders: 42 },
          { name: 'Fri', revenue: 9200, orders: 51 },
          { name: 'Sat', revenue: 8300, orders: 45 },
          { name: 'Sun', revenue: 5600, orders: 33 }
        ],
        metrics: ['revenue', 'orders'],
        title: 'Weekly Revenue & Orders'
      };

      setMessages(prev => [...prev,
        { id: prev.length + 1, type: 'user', content: '/chart', timestamp: new Date() },
        {
          id: prev.length + 2,
          type: 'assistant',
          content: '📈 Here\'s an example bar chart showing weekly performance:',
          data: exampleChartData,
          timestamp: new Date()
        }
      ]);
    }
  };

  // Export chat conversation
  const clearChat = () => {
    // Reset to just the welcome message
    setMessages([{
      id: 1,
      type: "ai",
      content: getWelcomeMessage(),
      timestamp: new Date()
    }]);
    toast({
      title: "Chat cleared",
      description: "Started a fresh conversation.",
      variant: "default"
    });
  };

  const exportChat = () => {
    if (messages.length <= 1) {
      toast({
        title: "No messages to export",
        description: "Start a conversation first, then you can export it.",
        variant: "default"
      });
      return;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `wizel-chat-${timestamp}.txt`;

      let content = `Wizel AI Chat Export\n`;
      content += `Exported: ${new Date().toLocaleString()}\n`;
      content += `Total Messages: ${messages.length}\n`;
      content += `\n${'='.repeat(80)}\n\n`;

      messages.forEach((msg) => {
        const role = msg.type === 'user' ? 'You' : 'Wizel AI';
        const time = new Date(msg.timestamp).toLocaleTimeString();

        content += `[${time}] ${role}:\n`;
        content += `${msg.content}\n`;
        content += `\n${'-'.repeat(80)}\n\n`;
      });

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Chat exported!",
        description: `Saved as ${filename}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your chat.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      {/* Floating Action Button - Flush bottom-right */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-0 right-0 z-[9999] w-16 h-16 bg-gradient-to-br from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center rounded-tl-2xl group hover:scale-105"
          aria-label="Open Wizel AI Assistant"
          title="Chat with Wizel"
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src="/wizel-logo.svg"
              alt="Wizel Logo"
              className="w-10 h-10 transition-transform duration-200 group-hover:rotate-12"
            />
            <div className="absolute top-2 left-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </button>
      )}

      {/* Chat Modal */}
      {isOpen && (
        <>
          {/* XL Modal Backdrop */}
          {isXLModal && (
            <div className="fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-300" />
          )}

          <div
            className={cn(
              "fixed z-[9999] transition-all duration-300",
              isXLModal
                ? "inset-4"
                : isMinimized
                  ? "bottom-0 right-0 w-80"
                  : "bottom-0 right-0 w-[440px] max-w-[calc(100vw)]"
            )}
          >
            <Card className={cn(
              "shadow-2xl border-l border-t border-gray-200 dark:border-gray-700 transition-all duration-200 flex flex-col bg-white dark:bg-gray-900",
              isXLModal
                ? "h-full rounded-xl"
                : isMinimized
                  ? "h-14 rounded-tl-xl"
                  : "h-[600px] max-h-[100vh] rounded-tl-xl"
            )}>
              {/* Header */}
              <div className="bg-gradient-to-r from-sky-blue to-vivid-violet p-3 text-white rounded-tl-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      {activeTab === "ai" ? (
                        <Sparkles className="h-3.5 w-3.5" />
                      ) : (
                        <HelpCircle className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <span className="font-medium text-sm">
                      {activeTab === "ai" ? "Wizel" : activeTab === "support" ? "Support" : "DEV"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {activeTab === "ai" && messages.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-white hover:bg-white/20 transition-colors duration-200"
                          onClick={clearChat}
                          title="Clear chat"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-white hover:bg-white/20 transition-colors duration-200"
                          onClick={exportChat}
                          title="Export chat"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-white hover:bg-white/20 transition-colors duration-200"
                      onClick={() => {
                        setIsXLModal(!isXLModal);
                        if (isMinimized) setIsMinimized(false);
                      }}
                      title={isXLModal ? "Exit full screen" : "Full screen"}
                    >
                      {isXLModal ? (
                        <Minimize2 className="h-3.5 w-3.5" />
                      ) : (
                        <Maximize2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    {!isXLModal && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white hover:bg-white/20 transition-colors duration-200"
                        onClick={() => setIsMinimized(!isMinimized)}
                        title={isMinimized ? "Expand" : "Minimize"}
                      >
                        <ChevronDown className={cn(
                          "h-3.5 w-3.5 transition-transform",
                          isMinimized ? "rotate-180" : ""
                        )} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-white hover:bg-white/20 transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                      title="Close"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {!isMinimized && (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                  {/* Tabs */}
                  <div className="w-full border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-900">
                    <div className="flex">
                      <button
                        onClick={() => setActiveTab("ai")}
                        className={cn(
                          "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200",
                          activeTab === "ai"
                            ? "border-sky-blue text-sky-blue"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        )}
                      >
                        <Bot className="h-4 w-4" />
                        AI Chat
                      </button>
                      <button
                        onClick={() => setActiveTab("support")}
                        className={cn(
                          "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200",
                          activeTab === "support"
                            ? "border-sky-blue text-sky-blue"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        )}
                      >
                        <HelpCircle className="h-4 w-4" />
                        Support
                      </button>
                      {isDev && (
                        <button
                          onClick={() => setActiveTab("dev")}
                          className={cn(
                            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200",
                            activeTab === "dev"
                              ? "border-orange-500 text-orange-600 dark:text-orange-400"
                              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          )}
                        >
                          <Code2 className="h-4 w-4" />
                          DEV
                        </button>
                      )}
                    </div>
                  </div>

                  {/* AI Chat Tab */}
                  <div className={cn(
                    "flex-1 flex flex-col mt-0 p-0 min-h-0 absolute inset-0 top-[49px]",
                    activeTab === "ai" ? "flex" : "hidden"
                  )}>
                    <div className={cn(
                      "flex-1 overflow-y-auto min-h-0",
                      isXLModal ? "p-6" : "p-3"
                    )}>
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              "flex gap-3",
                              message.type === "user" ? "justify-end" : ""
                            )}
                          >
                            {message.type === "ai" && (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-blue to-vivid-violet flex items-center justify-center flex-shrink-0">
                                <Bot className="h-4 w-4 text-white" />
                              </div>
                            )}
                            <div className="max-w-[90%] space-y-3">
                              <div
                                className={cn(
                                  "rounded-lg px-4 py-3",
                                  isXLModal ? "max-w-[75%]" : "max-w-[85%]",
                                  message.type === "user"
                                    ? "bg-gradient-to-r from-sky-blue to-vivid-violet text-white"
                                    : message.error
                                      ? "bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100"
                                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                )}
                              >
                                {message.type === "user" ? (
                                  <p className="text-sm leading-relaxed">{message.content}</p>
                                ) : (
                                  <FormattedMessage content={message.content} />
                                )}
                                {message.toolsUsed && message.toolsUsed.length > 0 && (
                                  <p className="text-xs mt-2 opacity-70 flex items-center gap-1">
                                    <BarChart3 className="h-3 w-3" />
                                    {message.toolsUsed.join(', ')}
                                  </p>
                                )}
                              </div>

                              {/* Data visualization */}
                              {message.data && message.data.type === 'table' && (
                                <DataTable data={message.data} />
                              )}
                              {message.data && message.data.type === 'chart' && (
                                <DataChart data={message.data} />
                              )}
                            </div>
                          </div>
                        ))}
                        {isTyping && (
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-blue to-vivid-violet flex items-center justify-center">
                              <Bot className="h-4 w-4 text-white" />
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                              <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    <div className={cn(
                      "border-t bg-white dark:bg-gray-900",
                      isXLModal ? "p-6 pt-4" : "p-3 pt-2"
                    )}>
                      {/* Store Selector - Inline with Label */}
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                          Context:
                        </label>
                        <ChatStoreSelector
                          value={selectedStore}
                          onChange={setSelectedStore}
                          className="flex-1"
                        />
                      </div>

                      <div className="flex gap-2 items-end">
                        <textarea
                          ref={textareaRef}
                          value={inputValue}
                          onChange={(e) => {
                            setInputValue(e.target.value);
                            // Auto-resize textarea as user types
                            if (textareaRef.current) {
                              textareaRef.current.style.height = 'auto';
                              textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey && !isPageDataLoading) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                          placeholder={isPageDataLoading ? "Loading data..." : "Ask about your data..."}
                          className="flex-1 min-h-[40px] max-h-[120px] resize-none rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 ring-offset-background placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:focus-visible:ring-sky-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-y-auto"
                          disabled={aiLoading || isPageDataLoading}
                          rows={1}
                        />
                        <Button
                          onClick={() => sendMessage()}
                          disabled={aiLoading || isPageDataLoading || !inputValue.trim()}
                          className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white transition-all duration-200 shadow-md hover:shadow-lg shrink-0"
                          title={isPageDataLoading ? "Wait for data to load before asking questions" : "Send message"}
                        >
                          {aiLoading || isPageDataLoading ? (
                            <MorphingLoader size="small" showThemeText={false} />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Support Tab */}
                  <div className={cn(
                    "flex-1 flex flex-col mt-0 p-0 min-h-0 absolute inset-0 top-[49px]",
                    activeTab === "support" ? "flex" : "hidden"
                  )}>
                    <div className={cn(
                      "flex-1 overflow-y-auto min-h-0 flex items-center justify-center",
                      isXLModal ? "p-6" : "p-3"
                    )}>
                      <div className="text-center">
                        <HelpCircle className="h-12 w-12 mx-auto mb-4 text-sky-400" />
                        <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">Need Help?</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Contact our support team for assistance
                        </p>
                        <Button className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white">
                          Contact Support
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* DEV Tab */}
                  {isDev && (
                    <div className={cn(
                      "flex-1 flex flex-col mt-0 p-0 min-h-0 absolute inset-0 top-[49px]",
                      activeTab === "dev" ? "flex" : "hidden"
                    )}>
                      <div className={cn(
                        "flex-1 overflow-y-auto min-h-0",
                        isXLModal ? "p-6" : "p-3"
                      )}>
                        <DevContextViewer aiContext={getAIContext()} lastPrompts={lastPrompts} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}

function DataTable({ data }) {
  const { columns, rows, summary } = data;

  return (
    <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {rows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {row.map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {summary && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">{summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DataChart({ data }) {
  const { chartType, data: chartData, metrics, title } = data;

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
              <XAxis
                dataKey="name"
                className="text-gray-900 dark:text-gray-100"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className="text-gray-900 dark:text-gray-100"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#111827' }}
              />
              <Legend />
              {metrics.map((metric, idx) => (
                <Bar
                  key={metric}
                  dataKey={metric}
                  fill={CHART_COLORS[idx % CHART_COLORS.length]}
                  radius={[8, 8, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
              <XAxis
                dataKey="name"
                className="text-gray-900 dark:text-gray-100"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className="text-gray-900 dark:text-gray-100"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {metrics.map((metric, idx) => (
                <Line
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
      <CardContent className="p-4">
        {title && (
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">{title}</h4>
        )}
        {renderChart()}
      </CardContent>
    </Card>
  );
}

function DevContextViewer({ aiContext, lastPrompts }) {
  const [sampleQuestion, setSampleQuestion] = useState("What's my open rate?");

  const buildIntentDetectionPrompt = () => {
    const hasOnScreenContext = aiContext?.data != null;
    const currentPage = aiContext?.currentPage || 'unknown';
    const selectedStores = aiContext?.selectedStores || [];
    const dateRange = aiContext?.dateRange?.preset || 'unknown';

    return `You are an intelligent query router for a marketing analytics platform.

Your job is to classify user questions into 3 tiers:

**TIER 1 - On-Screen Context (CHEAPEST, FASTEST)**
Use when: Question is about data currently visible on screen
Examples:
- "What's this number?"
- "Explain this metric"
- "What's my current open rate?"
- "Which campaign is at the top?"
Indicators: References "this", "that", "here", "above", "current page"
${hasOnScreenContext ? '✅ User HAS on-screen context available' : '❌ No on-screen context available (less likely to be Tier 1)'}

**TIER 2 - SQL Database Query (ANALYTICAL)**
Use when: Question requires historical data analysis, trends, or comparisons
Examples:
- "What were my top 10 campaigns last month?"
- "Show me revenue trends over the last quarter"
- "Which products have the highest LTV?"
- "Compare campaign performance last 30 days vs previous 30 days"
Indicators: Time ranges (last month, past week), rankings (top/bottom), aggregations (total, average), trends, comparisons

**TIER 3 - Real-Time MCP API (CURRENT STATE)**
Use when: Question requires live/current Klaviyo configuration or state
Examples:
- "How many profiles are in my VIP segment right now?"
- "What flows are currently active?"
- "List all my segments"
- "Show me my campaign schedule for today"
Indicators: "now", "current", "right now", "live", "active", "list my", "show my"

CONTEXT:
- Current page: ${currentPage}
- Has on-screen data: ${hasOnScreenContext ? 'YES' : 'NO'}
${selectedStores.length > 0 ? `- Selected stores: ${selectedStores.map(s => s.label).join(', ')}` : ''}
${dateRange !== 'unknown' ? `- Date range: ${dateRange}` : ''}

User question: "${sampleQuestion}"

Return JSON only:
{
  "tier": 1 | 2 | 3,
  "confidence": "low" | "medium" | "high",
  "reason": "Brief explanation of why this tier",
  "alternative": "If unsure, which tier would be second choice?"
}`;
  };

  const buildUserPrompt = () => {
    if (!aiContext) {
      return `Question: ${sampleQuestion}

AI Context: No context available (not on a reporting page)`;
    }

    const contextStr = JSON.stringify(aiContext, null, 2);
    return `Question: ${sampleQuestion}

AI Context from the current page:
\`\`\`json
${contextStr}
\`\`\`

Please answer the question based on the context above.`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              Current AI Context (System Prompt Format)
            </h4>
            <button
              onClick={() => {
                const formattedContext = formatSystemContextForDisplay(aiContext);
                copyToClipboard(formattedContext || JSON.stringify(aiContext, null, 2));
              }}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 rounded transition-colors"
            >
              Copy
            </button>
          </div>
          {aiContext ? (
            <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {formatSystemContextForDisplay(aiContext) || JSON.stringify(aiContext, null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              No AI context available. Navigate to a reporting page to see context data.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              Raw AI Context Object (Full Data Structure)
            </h4>
            <button
              onClick={() => copyToClipboard(JSON.stringify(aiContext, null, 2))}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 rounded transition-colors"
            >
              Copy JSON
            </button>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Complete AI context object sent to <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-gray-900 dark:text-gray-100">/api/chat/ai</code>.
            Includes all dashboard data, campaigns, stores, metrics, and time series.
          </p>
          {aiContext ? (
            <div className="space-y-2">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                  <div className="text-gray-600 dark:text-gray-400">Tier</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {aiContext.routeToTier || 'N/A'}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                  <div className="text-gray-600 dark:text-gray-400">Data Size</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {aiContext.dataSize?.estimatedTokens
                      ? `${aiContext.dataSize.estimatedTokens.toLocaleString()} tokens`
                      : 'N/A'}
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                  <div className="text-gray-600 dark:text-gray-400">Stores</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {aiContext.selectedStores?.length || 0}
                  </div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                  <div className="text-gray-600 dark:text-gray-400">Page Type</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {aiContext.pageType || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Key Data Counts */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-xs">
                <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Summary Data (Sent to AI):</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Campaigns:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {aiContext.summaryData?.campaigns?.total || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Top Performers Sent:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {aiContext.summaryData?.campaigns?.topPerformers?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Flows:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {aiContext.summaryData?.flows?.total || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Top Flows Sent:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {aiContext.summaryData?.flows?.topPerformers?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Time Series (Sampled):</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {aiContext.summaryData?.timeSeries?.length || 0} pts
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">By-Account Summaries:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {aiContext.summaryData?.byAccount?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Summary Stats Preview */}
                {aiContext.summaryData?.campaigns?.summaryStats && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Campaign Summary Stats:</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Sent:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {(aiContext.summaryData.campaigns.summaryStats.totalSent || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Avg Open Rate:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {aiContext.summaryData.campaigns.summaryStats.avgOpenRate}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Revenue:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          ${(aiContext.summaryData.campaigns.summaryStats.totalRevenue || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Raw Data Kept Locally */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Raw Data (NOT sent to AI):</div>
                  <div className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                    ⚠️ Full arrays kept locally for UI/calculations only
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Full Campaigns Array:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {aiContext.rawData?.campaigns?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Full Flows Array:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {aiContext.rawData?.flows?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Raw JSON */}
              <details className="text-xs">
                <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 py-2">
                  Show Full JSON Object ({Object.keys(aiContext || {}).length} fields)
                </summary>
                <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto text-gray-900 dark:text-gray-100 whitespace-pre-wrap mt-2 max-h-96 overflow-y-auto">
                  {JSON.stringify(aiContext, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              No AI context available. Navigate to a reporting page to see context data.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              Intent Detection Prompt (3-Tier Routing)
            </h4>
            <button
              onClick={() => copyToClipboard(buildIntentDetectionPrompt())}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 rounded transition-colors"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            This prompt is sent to Haiku 4.5 to determine which tier should handle your question.
          </p>
          <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap text-gray-900 dark:text-gray-100">
            {buildIntentDetectionPrompt()}
          </pre>
        </CardContent>
      </Card>

      {lastPrompts && (
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                Last System Prompt Used (Tier 1)
              </h4>
              <button
                onClick={() => copyToClipboard(lastPrompts.systemPrompt || '')}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 rounded transition-colors"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              This is the actual system prompt sent to the AI model when your last question was routed to Tier 1 (on-screen context).
            </p>
            <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap text-gray-900 dark:text-gray-100">
              {lastPrompts.systemPrompt || 'No system prompt captured yet. Ask a question to see the prompt.'}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              Sample User Message
            </h4>
            <button
              onClick={() => copyToClipboard(buildUserPrompt())}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 rounded transition-colors"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            This is what your user message would look like when sent to Haiku.
          </p>
          <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap text-gray-900 dark:text-gray-100">
            {buildUserPrompt()}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
