"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/app/contexts/theme-context";
import { Button } from "@/app/components/ui/button";
import { Sun, Moon, Palette, BarChart3, TrendingUp, Users, Layers, Table } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

// Import the 5 chart style variations + Tables
import GradientModernStyle from './styles/GradientModernStyle';
import MinimalistCleanStyle from './styles/MinimalistCleanStyle';
import BoldCorporateStyle from './styles/BoldCorporateStyle';
import SoftPastelStyle from './styles/SoftPastelStyle';
import CombinedStyle from './styles/CombinedStyle';
import TablesStyle from './styles/TablesStyle';

export default function GraphsPage() {
  const { theme, toggleTheme } = useTheme();
  const [selectedStyle, setSelectedStyle] = useState('combined');
  const [compareMode, setCompareMode] = useState(false);

  // Chart design styles
  const chartStyles = [
    {
      id: 'combined',
      name: 'Combined (Recommended)',
      description: 'Minimalist cards + Gradient Modern charts',
      icon: Layers,
      component: CombinedStyle,
      preview: 'bg-gradient-to-r from-gray-200 via-sky-blue to-vivid-violet',
    },
    {
      id: 'tables',
      name: 'Data Tables',
      description: 'Sortable tables with various patterns and styles',
      icon: Table,
      component: TablesStyle,
      preview: 'bg-white dark:bg-gray-900 border-2 border-gray-300',
    },
    {
      id: 'gradient',
      name: 'Gradient Modern',
      description: 'Vibrant gradients with shadows and bold colors',
      icon: TrendingUp,
      component: GradientModernStyle,
      preview: 'bg-gradient-to-r from-sky-blue to-vivid-violet',
    },
    {
      id: 'minimalist',
      name: 'Minimalist Clean',
      description: 'Subtle colors, clean borders, and simple styling',
      icon: BarChart3,
      component: MinimalistCleanStyle,
      preview: 'bg-gray-100 dark:bg-gray-800 border-2 border-gray-300',
    },
    {
      id: 'corporate',
      name: 'Bold Corporate',
      description: 'Strong colors, clear hierarchy, professional',
      icon: Users,
      component: BoldCorporateStyle,
      preview: 'bg-blue-600',
    },
    {
      id: 'pastel',
      name: 'Soft Pastel',
      description: 'Muted tones, gentle styling, calming aesthetics',
      icon: Palette,
      component: SoftPastelStyle,
      preview: 'bg-gradient-to-r from-pink-200 to-purple-200',
    },
  ];

  const selectedStyleData = chartStyles.find(s => s.id === selectedStyle);
  const SelectedStyleComponent = selectedStyleData?.component;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Chart Design Principles
          </h2>
          <p className="text-sm text-gray-900 dark:text-gray-400">
            Explore different chart styles for consistent dashboard design
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCompareMode(!compareMode)}
            className={compareMode ? 'bg-sky-blue text-white' : ''}
          >
            {compareMode ? 'Single View' : 'Compare All'}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Style Selector Cards */}
      {!compareMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {chartStyles.map((style) => {
            const Icon = style.icon;
            return (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                  selectedStyle === style.id
                    ? 'border-sky-blue bg-sky-50 dark:bg-gray-800 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-sky-blue'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-full h-16 rounded ${style.preview}`}></div>
                  <Icon className="h-6 w-6 text-gray-900 dark:text-gray-100" />
                  <div className="text-center">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      {style.name}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {style.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Style Display */}
      {!compareMode && SelectedStyleComponent && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-sky-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              {selectedStyleData.name}
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {selectedStyleData.description}
            </p>
          </div>

          <SelectedStyleComponent />
        </div>
      )}

      {/* Compare All Styles */}
      {compareMode && (
        <div className="space-y-8">
          {chartStyles.map((style) => {
            const StyleComponent = style.component;
            return (
              <div key={style.id} className="space-y-3">
                <div className="flex items-center gap-3 pb-2 border-b-2 border-gray-200 dark:border-gray-700">
                  <div className={`w-8 h-8 rounded ${style.preview}`}></div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {style.name}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {style.description}
                    </p>
                  </div>
                </div>
                <StyleComponent />
              </div>
            );
          })}
        </div>
      )}

      {/* Design Principles Summary */}
      <div className="mt-8 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
          Chart Design Principles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-sm text-sky-blue mb-2">Color Usage</h4>
            <ul className="text-sm text-gray-900 dark:text-gray-300 space-y-1">
              <li>• Use brand colors (Sky Blue #60A5FA, Vivid Violet #8B5CF6)</li>
              <li>• Ensure 4.5:1 contrast ratio for text</li>
              <li>• Apply semantic colors (green=success, red=danger)</li>
              <li>• Dark mode: increase opacity for better visibility</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-sky-blue mb-2">Chart Components</h4>
            <ul className="text-sm text-gray-900 dark:text-gray-300 space-y-1">
              <li>• Use centralized formatters from /lib/utils.js</li>
              <li>• Grid lines: subtle gray (10-20% opacity)</li>
              <li>• Tooltips: solid backgrounds with borders</li>
              <li>• Labels: text-gray-900 dark:text-gray-100</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-sky-blue mb-2">Typography</h4>
            <ul className="text-sm text-gray-900 dark:text-gray-300 space-y-1">
              <li>• Chart titles: text-lg font-semibold</li>
              <li>• Axis labels: text-xs text-gray-600</li>
              <li>• Data labels: text-sm font-medium</li>
              <li>• Legends: text-xs with icon indicators</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-sky-blue mb-2">Spacing & Layout</h4>
            <ul className="text-sm text-gray-900 dark:text-gray-300 space-y-1">
              <li>• Card padding: p-6 for charts</li>
              <li>• Chart margins: 16px all sides</li>
              <li>• Grid spacing: 4px base unit</li>
              <li>• Responsive: min-h-[300px] for charts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
