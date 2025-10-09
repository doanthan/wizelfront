'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { useToast } from '@/app/components/ui/use-toast';
import MorphingLoader from '@/app/components/ui/loading';
import {
  Palette,
  Type,
  Layout,
  Mail,
  Eye,
  Trash2,
  Plus,
  Download,
  Globe,
  Building2
} from 'lucide-react';

/**
 * Brand Styles Management Page
 *
 * Allows users to view, create, and manage brand design systems
 * Features:
 * - List all brand styles
 * - Preview brand colors and typography
 * - Generate CSS/Email styles
 * - Delete brand styles
 */
export default function BrandStylesPage() {
  const [brandStyles, setBrandStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const { toast } = useToast();

  // Fetch brand styles
  useEffect(() => {
    fetchBrandStyles();
  }, []);

  const fetchBrandStyles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/brand-styles?public=true');
      if (response.ok) {
        const data = await response.json();
        setBrandStyles(data.brandStyles || []);
      } else {
        throw new Error('Failed to fetch brand styles');
      }
    } catch (error) {
      console.error('Error fetching brand styles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load brand styles',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete brand style
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this brand style?')) return;

    try {
      const response = await fetch(`/api/brand-styles/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Brand style deleted successfully'
        });
        fetchBrandStyles();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting brand style:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete brand style',
        variant: 'destructive'
      });
    }
  };

  // Generate styles preview
  const handleGenerateStyles = async (brandId) => {
    try {
      const response = await fetch(`/api/brand-styles/${brandId}/styles?format=both`);
      if (response.ok) {
        const data = await response.json();
        console.log('Generated styles:', data);

        // Download CSS file
        const cssContent = data.cssString || '';
        const blob = new Blob([`:root {\n${cssContent}\n}`], { type: 'text/css' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.brandName.toLowerCase().replace(/\s/g, '-')}-styles.css`;
        a.click();

        toast({
          title: 'Success',
          description: 'CSS styles downloaded successfully'
        });
      }
    } catch (error) {
      console.error('Error generating styles:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate styles',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <MorphingLoader size="large" showText={true} text="Loading brand styles..." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Brand Styles
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage brand design systems for email templates
          </p>
        </div>
        <Button className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white">
          <Plus className="h-4 w-4 mr-2" />
          New Brand Style
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Total Brands
            </CardTitle>
            <Building2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {brandStyles.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Public Styles
            </CardTitle>
            <Globe className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {brandStyles.filter(b => b.isPublic).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Industries
            </CardTitle>
            <Layout className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {new Set(brandStyles.map(b => b.metadata?.industry).filter(Boolean)).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Email Ready
            </CardTitle>
            <Mail className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {brandStyles.filter(b => b.emailDefaults?.maxWidth).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brand Styles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brandStyles.map(brand => (
          <Card key={brand._id} className="border border-gray-300 dark:border-gray-600">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                    {brand.brandName}
                    {brand.isPublic && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        <Globe className="h-3 w-3" />
                        Public
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {brand.metadata?.industry || 'Unknown Industry'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              {/* Color Palette Preview */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Colors
                  </span>
                </div>
                <div className="flex gap-2">
                  {brand.colors?.primary && (
                    <div
                      className="w-10 h-10 rounded-md border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: brand.colors.primary }}
                      title={`Primary: ${brand.colors.primary}`}
                    />
                  )}
                  {brand.colors?.secondary && (
                    <div
                      className="w-10 h-10 rounded-md border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: brand.colors.secondary }}
                      title={`Secondary: ${brand.colors.secondary}`}
                    />
                  )}
                  {brand.colors?.accent && (
                    <div
                      className="w-10 h-10 rounded-md border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: brand.colors.accent }}
                      title={`Accent: ${brand.colors.accent}`}
                    />
                  )}
                  {brand.colors?.palette?.slice(0, 3).map((color, idx) => (
                    <div
                      key={idx}
                      className="w-10 h-10 rounded-md border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: color.value }}
                      title={`${color.name}: ${color.value}`}
                    />
                  ))}
                </div>

                {/* Typography Preview */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Type className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Typography
                    </span>
                  </div>
                  <p
                    className="text-sm text-gray-700 dark:text-gray-200"
                    style={{ fontFamily: brand.typography?.fontFamilies?.primary }}
                  >
                    {brand.typography?.fontFamilies?.primary?.split(',')[0]?.replace(/['"]/g, '') || 'Default Font'}
                  </p>
                </div>

                {/* Metadata */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div>Confidence: {((brand.metadata?.confidence || 0) * 100).toFixed(0)}%</div>
                    <div>Version: {brand.metadata?.version || 1}</div>
                    <div className="truncate" title={brand.websiteUrl}>
                      Source: {brand.websiteUrl}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedBrand(brand)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateStyles(brand._id)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    CSS
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(brand._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {brandStyles.length === 0 && (
        <Card className="border border-gray-300 dark:border-gray-600">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Palette className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Brand Styles Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create your first brand style to get started with on-brand email templates
              </p>
              <Button className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Brand Style
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
