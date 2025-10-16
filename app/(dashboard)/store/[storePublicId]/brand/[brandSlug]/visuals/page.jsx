"use client";

import React, { useState } from "react";
import { useBrand } from "@/app/hooks/use-brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Slider } from "@/app/components/ui/slider";
import { ColorPicker } from "@/app/components/ui/color-picker";
import {
  Edit2, X, Check, Plus, Palette, Type, Image as ImageIcon,
  ExternalLink, Globe, Shield, Earth, Handshake, Monitor, Smartphone,
  Beef, CheckCircle, Heart, MapPin, Leaf, ShieldCheck, Truck,
  Star, Clock, CreditCard, Gift, Percent, RefreshCw, Lock,
  Headphones, BadgeCheck, Sparkles, Rocket, ThumbsUp, ShoppingCart,
  DollarSign, Tag, Package, Zap, Award, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BrandVisualsPage() {
  const {
    brand,
    setBrand,
    isLoading,
    setHasChanges
  } = useBrand();

  const [activeSection, setActiveSection] = useState("color-palette");

  // Visual settings state
  const [visualSettings, setVisualSettings] = useState({
    typography: {
      fontFamily: brand?.customFontFamily || "Avenir Next LT W02 Bold",
      fontSize: {
        h1: "28px",
        h2: "23px",
        h3: "18px",
        body: "16px",
        small: "14px"
      }
    },
    buttons: {
      backgroundColor: brand?.buttonBackgroundColor || "#020202",
      textColor: brand?.buttonTextColor || "#ffffff",
      borderRadius: brand?.buttonBorderRadius || 4,
      padding: {
        top: 16,
        right: 24,
        bottom: 16,
        left: 24
      },
      shadow: {
        enabled: false,
        offsetX: 0,
        offsetY: 2,
        blur: 4,
        spread: 0,
        color: "rgba(0, 0, 0, 0.1)"
      }
    }
  });

  const [customFonts, setCustomFonts] = useState([
    "Avenir Next LT W02 Bold",
    "Helvetica",
    "Arial",
    "Georgia",
    "Times New Roman",
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Playfair Display"
  ]);

  const [showColorDialog, setShowColorDialog] = useState(null);
  const [showFontDialog, setShowFontDialog] = useState(false);
  const [showLogoDialog, setShowLogoDialog] = useState(false);
  const [fontUploadMethod, setFontUploadMethod] = useState('url');
  const [fontName, setFontName] = useState('');
  const [fontUrl, setFontUrl] = useState('');
  const [fontFile, setFontFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop' or 'mobile'
  const [showBenefitDialog, setShowBenefitDialog] = useState(false);
  const [newBenefit, setNewBenefit] = useState({
    name: '',
    description: '',
    icon: 'Star'
  });
  const [badgeColorScheme, setBadgeColorScheme] = useState('primary'); // 'primary', 'secondary1', 'secondary2', etc.

  // Navigation items for sidebar
  const navigationItems = [
    { id: "color-palette", label: "Color Palette", icon: Palette },
    { id: "brand-logo", label: "Brand Logo", icon: ImageIcon },
    { id: "typography", label: "Typography", icon: Type },
    { id: "button-design", label: "Button Design", icon: Monitor },
    { id: "trust-badges", label: "Trust & Benefits", icon: BadgeCheck },
    { id: "preview", label: "Live Preview", icon: Smartphone },
  ];

  // Observe sections for active highlighting
  React.useEffect(() => {
    if (isLoading) return; // Don't set up observer while loading

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: "-100px 0px -50% 0px" }
    );

    navigationItems.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [isLoading]); // Added isLoading as dependency

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-sky-blue border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-neutral-gray dark:text-gray-400">Loading visual design...</p>
        </div>
      </div>
    );
  }

  const handleAddColor = (isPrimary) => {
    if (newColorHex && newColorName) {
      const newColor = { hex: newColorHex, name: newColorName };
      setBrand(prev => ({
        ...prev,
        [isPrimary ? 'primaryColor' : 'secondaryColors']: isPrimary 
          ? [newColor]
          : [...(prev.secondaryColors || []), newColor]
      }));
      setHasChanges(true);
      setShowColorDialog(null);
      setNewColorName('');
      setNewColorHex('#000000');
    }
  };

  const handleRemoveColor = (index, isPrimary) => {
    setBrand(prev => ({
      ...prev,
      secondaryColors: prev.secondaryColors?.filter((_, i) => i !== index) || []
    }));
    setHasChanges(true);
  };

  const handleAddFont = () => {
    if (fontUploadMethod === 'url' && fontName && fontUrl) {
      const newFont = fontName.trim();
      if (!customFonts.includes(newFont)) {
        setCustomFonts(prev => [...prev, newFont]);
        const link = document.createElement('link');
        link.href = fontUrl;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
    }
    setShowFontDialog(false);
    setFontName('');
    setFontUrl('');
    setFontFile(null);
    setFontUploadMethod('url');
  };

  const handleLogoUpload = () => {
    if (logoFile) {
      const previewUrl = URL.createObjectURL(logoFile);
      setBrand(prev => ({
        ...prev,
        logo: {
          ...prev.logo,
          primary_logo_url: previewUrl,
          logo_alt_text: `${brand.brandName} logo`,
          logo_type: "image",
          brand_name: brand.brandName
        }
      }));
      setHasChanges(true);
      setShowLogoDialog(false);
      setLogoFile(null);
      setLogoPreview(null);
    }
  };

  const handleLogoFileChange = (file) => {
    setLogoFile(file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    } else {
      setLogoPreview(null);
    }
  };

  const generateButtonCSS = () => {
    const { buttons } = visualSettings;
    const shadowCSS = buttons.shadow.enabled
      ? `box-shadow: ${buttons.shadow.offsetX}px ${buttons.shadow.offsetY}px ${buttons.shadow.blur}px ${buttons.shadow.spread}px ${buttons.shadow.color};`
      : '';

    return `
background-color: ${buttons.backgroundColor};
color: ${buttons.textColor};
border-radius: ${buttons.borderRadius}px;
padding: ${buttons.padding.top}px ${buttons.padding.right}px ${buttons.padding.bottom}px ${buttons.padding.left}px;
${shadowCSS}
font-weight: 600;
cursor: pointer;
transition: all 0.3s ease;`.trim();
  };

  // Scroll to section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -100; // Offset for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  return (
    <>
      <div className="flex gap-4">
        {/* Left Sidebar - Navigation */}
        <aside className="w-64 flex-shrink-0">
          <Card className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-gray-900 dark:text-white">Visual Settings</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Jump to section
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {navigationItems.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all",
                      "hover:bg-gray-50 dark:hover:bg-gray-800",
                      activeSection === id
                        ? "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border-r-2 border-sky-600"
                        : "text-gray-700 dark:text-gray-300"
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4",
                      activeSection === id ? "text-sky-600 dark:text-sky-400" : "text-gray-400 dark:text-gray-500"
                    )} />
                    <span className="flex-1 text-left">{label}</span>
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform",
                      activeSection === id ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                    )} />
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </aside>

        {/* Right Panel - Content Sections */}
        <div className="flex-1 space-y-8 min-w-0">
          {/* Color Palette */}
          <Card id="color-palette" className="scroll-mt-24">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Color Palette</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Brand colors for visual consistency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Primary Color</label>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-gray-600 cursor-pointer hover:border-sky-blue transition-colors"
                    style={{ backgroundColor: brand?.primaryColor?.[0]?.hex || '#000000' }}
                    onClick={() => setShowColorDialog('primary')}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-200">{brand?.primaryColor?.[0]?.name || 'Primary Color'}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-400">{brand?.primaryColor?.[0]?.hex || '#000000'}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowColorDialog('primary')}
                  >
                    Edit
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Secondary Colors</label>
                <div className="space-y-2">
                  {brand?.secondaryColors?.map((color, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg border-2 border-gray-200 dark:border-gray-600"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{color.name}</p>
                        <p className="text-xs text-gray-700 dark:text-gray-400">{color.hex}</p>
                      </div>
                      <button onClick={() => handleRemoveColor(idx, false)}>
                        <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setShowColorDialog('secondary')}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Color
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Brand Logo */}
          <Card id="brand-logo" className="scroll-mt-24">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Brand Logo</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Upload and manage your brand logo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="w-32 h-20 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center p-3">
                  {brand?.logo?.primary_logo_url ? (
                    <img 
                      src={brand.logo.primary_logo_url.startsWith('//') ? `https:${brand.logo.primary_logo_url}` : brand.logo.primary_logo_url} 
                      alt={brand.logo.logo_alt_text} 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="text-gray-400 text-xs mb-1">No Logo</div>
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowLogoDialog(true)}
                    className="mb-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {brand?.logo?.primary_logo_url ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Recommended: PNG, JPG, or SVG • 400x200px minimum
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card id="typography" className="scroll-mt-24">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Typography</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Font settings and text styling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-gray dark:text-gray-200">Font Family</label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowFontDialog(true)}
                    className="text-xs"
                  >
                    + Add Font
                  </Button>
                </div>
                <Select 
                  value={visualSettings.typography.fontFamily}
                  onValueChange={(value) => {
                    setVisualSettings(prev => ({
                      ...prev,
                      typography: { ...prev.typography, fontFamily: value }
                    }));
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {customFonts.map(font => (
                      <SelectItem key={font} value={font}>{font}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Font Sizes</label>
                <div className="space-y-3">
                  {Object.entries(visualSettings.typography.fontSize).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{key === 'h1' ? 'Heading 1' : key === 'h2' ? 'Heading 2' : key === 'h3' ? 'Heading 3' : key}</span>
                      <Input 
                        value={value} 
                        onChange={(e) => {
                          setVisualSettings(prev => ({
                            ...prev,
                            typography: {
                              ...prev.typography,
                              fontSize: { ...prev.typography.fontSize, [key]: e.target.value }
                            }
                          }));
                          setHasChanges(true);
                        }}
                        className="w-20 h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Button Design */}
          <Card id="button-design" className="scroll-mt-24">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Button Design</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Customize button appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Background</label>
                  <ColorPicker 
                    value={visualSettings.buttons.backgroundColor}
                    onChange={(e) => {
                      setVisualSettings(prev => ({
                        ...prev,
                        buttons: { ...prev.buttons, backgroundColor: e.target.value }
                      }));
                      setHasChanges(true);
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Text Color</label>
                  <ColorPicker 
                    value={visualSettings.buttons.textColor}
                    onChange={(e) => {
                      setVisualSettings(prev => ({
                        ...prev,
                        buttons: { ...prev.buttons, textColor: e.target.value }
                      }));
                      setHasChanges(true);
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">
                  Border Radius: {visualSettings.buttons.borderRadius}px
                </label>
                <Slider 
                  value={[visualSettings.buttons.borderRadius]}
                  onValueChange={([value]) => {
                    setVisualSettings(prev => ({
                      ...prev,
                      buttons: { ...prev.buttons, borderRadius: value }
                    }));
                    setHasChanges(true);
                  }}
                  min={0}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Padding</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">Vertical</label>
                    <Slider 
                      value={[visualSettings.buttons.padding.top]}
                      onValueChange={([value]) => {
                        setVisualSettings(prev => ({
                          ...prev,
                          buttons: { 
                            ...prev.buttons, 
                            padding: { ...prev.buttons.padding, top: value, bottom: value }
                          }
                        }));
                        setHasChanges(true);
                      }}
                      min={8}
                      max={32}
                      step={1}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{visualSettings.buttons.padding.top}px</span>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">Horizontal</label>
                    <Slider 
                      value={[visualSettings.buttons.padding.right]}
                      onValueChange={([value]) => {
                        setVisualSettings(prev => ({
                          ...prev,
                          buttons: { 
                            ...prev.buttons, 
                            padding: { ...prev.buttons.padding, left: value, right: value }
                          }
                        }));
                        setHasChanges(true);
                      }}
                      min={12}
                      max={48}
                      step={1}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{visualSettings.buttons.padding.right}px</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <input 
                    type="checkbox" 
                    checked={visualSettings.buttons.shadow.enabled}
                    onChange={(e) => {
                      setVisualSettings(prev => ({
                        ...prev,
                        buttons: { 
                          ...prev.buttons, 
                          shadow: { ...prev.buttons.shadow, enabled: e.target.checked }
                        }
                      }));
                      setHasChanges(true);
                    }}
                    className="rounded"
                  />
                  <label className="text-sm font-medium text-slate-gray dark:text-gray-200">Shadow</label>
                </div>
                {visualSettings.buttons.shadow.enabled && (
                  <div className="space-y-3 pl-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">X Offset</label>
                        <Slider 
                          value={[visualSettings.buttons.shadow.offsetX]}
                          onValueChange={([value]) => {
                            setVisualSettings(prev => ({
                              ...prev,
                              buttons: { 
                                ...prev.buttons, 
                                shadow: { ...prev.buttons.shadow, offsetX: value }
                              }
                            }));
                            setHasChanges(true);
                          }}
                          min={-20}
                          max={20}
                          step={1}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Y Offset</label>
                        <Slider 
                          value={[visualSettings.buttons.shadow.offsetY]}
                          onValueChange={([value]) => {
                            setVisualSettings(prev => ({
                              ...prev,
                              buttons: { 
                                ...prev.buttons, 
                                shadow: { ...prev.buttons.shadow, offsetY: value }
                              }
                            }));
                            setHasChanges(true);
                          }}
                          min={-20}
                          max={20}
                          step={1}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Generated CSS */}
          <Card className="scroll-mt-24">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Generated CSS</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Copy this CSS for your email templates</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-x-auto">
                <code className="text-gray-800 dark:text-gray-200">{generateButtonCSS()}</code>
              </pre>
            </CardContent>
          </Card>

          {/* Trust Badges & Selected Benefits */}
          <Card id="trust-badges" className="scroll-mt-24">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">Trust Badges & Benefits</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">Build customer confidence with trust signals</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Color:</label>
                  <Select
                    value={badgeColorScheme}
                    onValueChange={(value) => {
                      setBadgeColorScheme(value);
                      setHasChanges(true);
                    }}
                  >
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {brand?.primaryColor?.[0] && (
                        <SelectItem value="primary">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: brand.primaryColor[0].hex }} />
                            {brand.primaryColor[0].name}
                          </div>
                        </SelectItem>
                      )}
                      {brand?.secondaryColors?.map((color, idx) => (
                        <SelectItem key={idx} value={`secondary${idx}`}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: color.hex }} />
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                      <SelectItem value="black">Black</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Trust Badges */}
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2 block">Trust Badges</label>
                <div className="space-y-2">
                  {brand?.trustBadges?.map((badge, idx) => {
                    const getIcon = (iconName) => {
                      const getBadgeColor = () => {
                        if (badgeColorScheme === 'primary' && brand?.primaryColor?.[0]) {
                          return brand.primaryColor[0].hex;
                        } else if (badgeColorScheme.startsWith('secondary')) {
                          const idx = parseInt(badgeColorScheme.replace('secondary', ''));
                          return brand?.secondaryColors?.[idx]?.hex || '#000000';
                        }
                        return '#000000';
                      };
                      const iconColor = getBadgeColor();
                      const iconProps = "h-5 w-5";
                      const style = { color: iconColor };
                      
                      switch(iconName) {
                        case 'Cow':
                        case 'Beef':
                          return <Beef className={iconProps} style={style} />;
                        case 'CheckCircle':
                          return <CheckCircle className={iconProps} style={style} />;
                        case 'Heart':
                          return <Heart className={iconProps} style={style} />;
                        case 'MapPin':
                          return <MapPin className={iconProps} style={style} />;
                        case 'Shield':
                          return <Shield className={iconProps} style={style} />;
                        case 'Leaf':
                          return <Leaf className={iconProps} style={style} />;
                        case 'ShieldCheck':
                          return <ShieldCheck className={iconProps} style={style} />;
                        case 'Truck':
                          return <Truck className={iconProps} style={style} />;
                        default:
                          return <Shield className={iconProps} style={style} />;
                      }
                    };

                    return (
                      <div key={idx} className="flex items-start gap-3 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="w-9 h-9 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                          {getIcon(badge.icon)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-xs text-slate-gray dark:text-gray-200">{badge.text}</p>
                          {badge.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{badge.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Benefits */}
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2 block">Selected Benefits</label>
                <div className="grid grid-cols-2 gap-2">
                  {brand?.selectedBenefits?.map((benefit, idx) => {
                    const getBenefitIcon = (iconName) => {
                      const getBadgeColor = () => {
                        if (badgeColorScheme === 'primary' && brand?.primaryColor?.[0]) {
                          return brand.primaryColor[0].hex;
                        } else if (badgeColorScheme.startsWith('secondary')) {
                          const idx = parseInt(badgeColorScheme.replace('secondary', ''));
                          return brand?.secondaryColors?.[idx]?.hex || '#000000';
                        }
                        return '#000000';
                      };
                      const iconColor = getBadgeColor();
                      const iconProps = "h-4 w-4";
                      const style = { color: iconColor };
                      const iconMap = {
                        Star: <Star className={iconProps} style={style} />,
                        Shield: <Shield className={iconProps} style={style} />,
                        Truck: <Truck className={iconProps} style={style} />,
                        Leaf: <Leaf className={iconProps} style={style} />,
                        Heart: <Heart className={iconProps} style={style} />,
                        Clock: <Clock className={iconProps} style={style} />,
                        CreditCard: <CreditCard className={iconProps} style={style} />,
                        Gift: <Gift className={iconProps} style={style} />,
                        Percent: <Percent className={iconProps} style={style} />,
                        RefreshCw: <RefreshCw className={iconProps} style={style} />,
                        Lock: <Lock className={iconProps} style={style} />,
                        Globe: <Globe className={iconProps} style={style} />,
                        Headphones: <Headphones className={iconProps} style={style} />,
                        BadgeCheck: <BadgeCheck className={iconProps} style={style} />,
                        ShieldCheck: <ShieldCheck className={iconProps} style={style} />,
                        Sparkles: <Sparkles className={iconProps} style={style} />,
                        Rocket: <Rocket className={iconProps} style={style} />,
                        ThumbsUp: <ThumbsUp className={iconProps} style={style} />,
                        ShoppingCart: <ShoppingCart className={iconProps} style={style} />,
                        DollarSign: <DollarSign className={iconProps} style={style} />,
                        Tag: <Tag className={iconProps} style={style} />,
                        CheckCircle: <CheckCircle className={iconProps} style={style} />,
                        Package: <Package className={iconProps} style={style} />,
                        Zap: <Zap className={iconProps} style={style} />,
                        MapPin: <MapPin className={iconProps} style={style} />,
                        X: <X className={iconProps} style={style} />,
                      };
                      return iconMap[iconName] || <Award className={iconProps} style={style} />;
                    };

                    return (
                      <div key={benefit.id || idx} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="w-7 h-7 bg-gray-50 dark:bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
                          {getBenefitIcon(benefit.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-gray dark:text-gray-200 truncate">{benefit.name}</p>
                        </div>
                        <button
                          onClick={() => {
                            setBrand(prev => ({
                              ...prev,
                              selectedBenefits: prev.selectedBenefits?.filter((_, i) => i !== idx)
                            }));
                            setHasChanges(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        >
                          <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    );
                  })}
                  
                  {/* Add Benefit Button */}
                  <button
                    onClick={() => setShowBenefitDialog(true)}
                    className="flex items-center justify-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-sky-blue dark:hover:border-sky-blue transition-colors min-h-[36px]"
                  >
                    <Plus className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Add Benefit</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card id="preview" className="scroll-mt-24">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">Live Email Preview</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">See your design in action</CardDescription>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <button
                      onClick={() => setPreviewMode('desktop')}
                      className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-all ${
                        previewMode === 'desktop' 
                          ? 'bg-white dark:bg-gray-700 shadow-sm text-sky-blue' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <Monitor className="h-4 w-4" />
                      Desktop
                    </button>
                    <button
                      onClick={() => setPreviewMode('mobile')}
                      className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-all ${
                        previewMode === 'mobile' 
                          ? 'bg-white dark:bg-gray-700 shadow-sm text-sky-blue' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <Smartphone className="h-4 w-4" />
                      Mobile
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`border dark:border-gray-700 rounded-lg overflow-hidden transition-all ${
                  previewMode === 'mobile' 
                    ? 'max-w-[375px] mx-auto' 
                    : 'w-full'
                }`}>
                  <div className={`bg-white ${
                    previewMode === 'mobile' ? 'p-4' : 'p-8'
                  }`} style={{ fontFamily: visualSettings.typography.fontFamily }}>
                    {/* Email Header */}
                    <div className={`text-center ${
                      previewMode === 'mobile' ? 'mb-6' : 'mb-8'
                    }`}>
                      {brand?.logo?.primary_logo_url && (
                        <img 
                          src={brand.logo.primary_logo_url.startsWith('//') ? `https:${brand.logo.primary_logo_url}` : brand.logo.primary_logo_url}
                          alt={brand.brandName}
                          className={`mx-auto mb-4 ${
                            previewMode === 'mobile' ? 'h-10' : 'h-12'
                          }`}
                        />
                      )}
                      <h1 style={{ 
                        fontSize: previewMode === 'mobile' ? '24px' : visualSettings.typography.fontSize.h1, 
                        color: brand?.primaryColor?.[0]?.hex || '#000' 
                      }}>
                        {brand?.brandName}
                      </h1>
                    </div>

                    {/* Email Content */}
                    <div className={`${
                      previewMode === 'mobile' ? 'space-y-4' : 'space-y-6'
                    }`}>
                      <h2 style={{ 
                        fontSize: previewMode === 'mobile' ? '20px' : visualSettings.typography.fontSize.h2, 
                        textAlign: 'center',
                        color: '#1f2937',
                        fontWeight: '600',
                        marginBottom: '16px'
                      }}>
                        Special Offer Just for You
                      </h2>
                      <p style={{ 
                        fontSize: previewMode === 'mobile' ? '14px' : visualSettings.typography.fontSize.body, 
                        lineHeight: 1.6,
                        color: '#374151',
                        textAlign: 'center',
                        marginBottom: '24px'
                      }}>
                        {brand?.customerPromise || 'Experience the difference with our premium products.'}
                      </p>
                      
                      {/* Sample Button */}
                      <div className="text-center">
                        <button style={{
                          backgroundColor: visualSettings.buttons.backgroundColor,
                          color: visualSettings.buttons.textColor,
                          borderRadius: `${visualSettings.buttons.borderRadius}px`,
                          padding: previewMode === 'mobile' 
                            ? `${visualSettings.buttons.padding.top * 0.8}px ${visualSettings.buttons.padding.right * 0.8}px`
                            : `${visualSettings.buttons.padding.top}px ${visualSettings.buttons.padding.right}px`,
                          border: 'none',
                          fontSize: previewMode === 'mobile' ? '14px' : visualSettings.typography.fontSize.body,
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: visualSettings.buttons.shadow.enabled 
                            ? `${visualSettings.buttons.shadow.offsetX}px ${visualSettings.buttons.shadow.offsetY}px ${visualSettings.buttons.shadow.blur}px ${visualSettings.buttons.shadow.spread}px ${visualSettings.buttons.shadow.color}`
                            : 'none'
                        }}>
                          Shop Now
                        </button>
                      </div>

                      {/* Trust Badges with Icons in Preview */}
                      <div className={`flex justify-center gap-${previewMode === 'mobile' ? '2' : '4'} pt-4`}>
                        {brand?.trustBadges?.slice(0, previewMode === 'mobile' ? 2 : 3).map((badge, idx) => {
                          const getPreviewIcon = (iconName) => {
                            const iconProps = previewMode === 'mobile' ? "h-3 w-3" : "h-4 w-4";
                            switch(iconName) {
                              case 'Cow':
                              case 'Beef':
                                return <Beef className={`${iconProps} text-green-600`} />;
                              case 'CheckCircle':
                                return <CheckCircle className={`${iconProps} text-blue-600`} />;
                              case 'Heart':
                                return <Heart className={`${iconProps} text-red-500`} />;
                              case 'MapPin':
                                return <MapPin className={`${iconProps} text-purple-600`} />;
                              case 'Shield':
                                return <Shield className={`${iconProps} text-green-600`} />;
                              case 'Leaf':
                                return <Leaf className={`${iconProps} text-green-500`} />;
                              case 'ShieldCheck':
                                return <ShieldCheck className={`${iconProps} text-blue-600`} />;
                              case 'Truck':
                                return <Truck className={`${iconProps} text-indigo-600`} />;
                              default:
                                return <Shield className={`${iconProps} text-gray-600`} />;
                            }
                          };

                          return (
                            <div key={idx} className="text-center">
                              <div className={`bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-1 flex items-center justify-center ${
                                previewMode === 'mobile' ? 'w-6 h-6' : 'w-8 h-8'
                              }`}>
                                {getPreviewIcon(badge.icon)}
                              </div>
                              <p className={previewMode === 'mobile' ? 'text-[10px]' : 'text-xs'} style={{color: '#6b7280'}}>
                                {badge.text}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      {/* Dialogs */}
      <Dialog open={showColorDialog !== null} onOpenChange={() => setShowColorDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showColorDialog === 'primary' ? 'Edit Primary Color' : 'Add Secondary Color'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Color Name</label>
              <Input
                placeholder="e.g., Sky Blue, Forest Green"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Color Value</label>
              <ColorPicker
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setShowColorDialog(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleAddColor(showColorDialog === 'primary')}
              className="bg-sky-blue hover:bg-royal-blue text-white"
            >
              {showColorDialog === 'primary' ? 'Update' : 'Add'} Color
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Font Dialog */}
      <Dialog open={showFontDialog} onOpenChange={setShowFontDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Add Custom Font</DialogTitle>
            <DialogDescription>Upload a font file or add from URL</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-3 block">Upload Method</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setFontUploadMethod('url')}
                  className={`flex-1 p-4 border-2 rounded-lg text-left transition-colors ${
                    fontUploadMethod === 'url' 
                      ? 'border-sky-blue bg-sky-tint/20 text-sky-blue' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="font-medium mb-1">From URL</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Google Fonts, Adobe Fonts, etc.</div>
                </button>
                <button
                  onClick={() => setFontUploadMethod('upload')}
                  className={`flex-1 p-4 border-2 rounded-lg text-left transition-colors ${
                    fontUploadMethod === 'upload' 
                      ? 'border-sky-blue bg-sky-tint/20 text-sky-blue' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="font-medium mb-1">Upload File</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">TTF, OTF, WOFF files</div>
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Font Name</label>
              <Input
                placeholder="e.g., Poppins, Montserrat, Open Sans"
                value={fontName}
                onChange={(e) => setFontName(e.target.value)}
              />
            </div>

            {fontUploadMethod === 'url' && (
              <div>
                <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Font URL</label>
                <Input
                  placeholder="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
                  value={fontUrl}
                  onChange={(e) => setFontUrl(e.target.value)}
                />
              </div>
            )}

            {fontUploadMethod === 'upload' && (
              <div>
                <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Font File</label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-sky-blue dark:hover:border-sky-blue transition-colors">
                  <input
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    onChange={(e) => setFontFile(e.target.files[0])}
                    className="hidden"
                    id="font-file-input"
                  />
                  <label htmlFor="font-file-input" className="cursor-pointer">
                    {fontFile ? (
                      <div>
                        <div className="text-sm font-medium text-sky-blue">{fontFile.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {(fontFile.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload font file</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Supports TTF, OTF, WOFF, WOFF2 formats</div>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setShowFontDialog(false)}>Cancel</Button>
            <Button onClick={handleAddFont} className="bg-sky-blue hover:bg-royal-blue text-white">
              Add Font
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logo Upload Dialog */}
      <Dialog open={showLogoDialog} onOpenChange={setShowLogoDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Upload Brand Logo</DialogTitle>
            <DialogDescription>Upload your brand logo for email campaigns</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-3 block">Logo File</label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-sky-blue dark:hover:border-sky-blue transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoFileChange(e.target.files[0])}
                  className="hidden"
                  id="logo-file-input"
                />
                <label htmlFor="logo-file-input" className="cursor-pointer">
                  {logoPreview ? (
                    <div className="space-y-4">
                      <div className="w-32 h-20 mx-auto bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg flex items-center justify-center p-2">
                        <img 
                          src={logoPreview} 
                          alt="Logo preview" 
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-sky-blue">{logoFile?.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {logoFile ? `${(logoFile.size / 1024).toFixed(1)} KB • Click to change` : ''}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <Plus className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload logo</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG, SVG up to 5MB</div>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setShowLogoDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleLogoUpload}
              disabled={!logoFile}
              className="bg-sky-blue hover:bg-royal-blue text-white"
            >
              Upload Logo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Benefit Dialog */}
      <Dialog open={showBenefitDialog} onOpenChange={setShowBenefitDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Add Selected Benefit</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Choose an icon and describe a key benefit for your customers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Icon Selection */}
            <div>
              <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-3 block">Choose Icon</label>
              <div className="grid grid-cols-6 gap-2">
                {[
                  { icon: Star, name: 'Star' },
                  { icon: Shield, name: 'Shield' },
                  { icon: Truck, name: 'Truck' },
                  { icon: Leaf, name: 'Leaf' },
                  { icon: Heart, name: 'Heart' },
                  { icon: Clock, name: 'Clock' },
                  { icon: CreditCard, name: 'CreditCard' },
                  { icon: Gift, name: 'Gift' },
                  { icon: Percent, name: 'Percent' },
                  { icon: RefreshCw, name: 'RefreshCw' },
                  { icon: Lock, name: 'Lock' },
                  { icon: Globe, name: 'Globe' },
                  { icon: Headphones, name: 'Headphones' },
                  { icon: BadgeCheck, name: 'BadgeCheck' },
                  { icon: Sparkles, name: 'Sparkles' },
                  { icon: Rocket, name: 'Rocket' },
                  { icon: ThumbsUp, name: 'ThumbsUp' },
                  { icon: ShoppingCart, name: 'ShoppingCart' },
                  { icon: DollarSign, name: 'DollarSign' },
                  { icon: Tag, name: 'Tag' },
                  { icon: CheckCircle, name: 'CheckCircle' },
                  { icon: Package, name: 'Package' },
                  { icon: Zap, name: 'Zap' },
                  { icon: MapPin, name: 'MapPin' },
                ].map(({ icon: Icon, name }) => {
                  const getBadgeColor = () => {
                    if (badgeColorScheme === 'primary' && brand?.primaryColor?.[0]) {
                      return brand.primaryColor[0].hex;
                    } else if (badgeColorScheme.startsWith('secondary')) {
                      const idx = parseInt(badgeColorScheme.replace('secondary', ''));
                      return brand?.secondaryColors?.[idx]?.hex || '#000000';
                    }
                    return '#000000';
                  };
                  
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setNewBenefit(prev => ({ ...prev, icon: name }))}
                      className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                        newBenefit.icon === name 
                          ? 'border-sky-blue bg-sky-tint dark:bg-sky-blue/20' 
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <Icon className="h-5 w-5 mx-auto" style={{ color: getBadgeColor() }} />
                      <span className="text-[10px] mt-1 block text-gray-600 dark:text-gray-400">{name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Benefit Details */}
            <div>
              <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Benefit Name</label>
              <Input
                placeholder="e.g., Free Shipping, 30-Day Returns, Lab Tested"
                value={newBenefit.name}
                onChange={(e) => setNewBenefit(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Description (Optional)</label>
              <Textarea
                placeholder="Brief description of this benefit..."
                value={newBenefit.description}
                onChange={(e) => setNewBenefit(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>

            {/* Preview */}
            <div>
              <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Preview</label>
              <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                    {(() => {
                      const iconMap = {
                        Star, Shield, Truck, Leaf, Heart, Clock, CreditCard, Gift, Percent,
                        RefreshCw, Lock, Globe, Headphones, BadgeCheck, Sparkles, Rocket,
                        ThumbsUp, ShoppingCart, DollarSign, Tag, CheckCircle, Package, Zap, MapPin
                      };
                      const IconComponent = iconMap[newBenefit.icon] || Star;
                      const getBadgeColor = () => {
                        if (badgeColorScheme === 'primary' && brand?.primaryColor?.[0]) {
                          return brand.primaryColor[0].hex;
                        } else if (badgeColorScheme.startsWith('secondary')) {
                          const idx = parseInt(badgeColorScheme.replace('secondary', ''));
                          return brand?.secondaryColors?.[idx]?.hex || '#000000';
                        }
                        return '#000000';
                      };
                      return <IconComponent className="h-5 w-5" style={{ color: getBadgeColor() }} />;
                    })()}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-slate-gray dark:text-gray-200 mb-1">
                      {newBenefit.name || 'Benefit Name'}
                    </h4>
                    {newBenefit.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{newBenefit.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setShowBenefitDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (newBenefit.name) {
                  setBrand(prev => ({
                    ...prev,
                    selectedBenefits: [...(prev.selectedBenefits || []), {
                      id: `benefit-${Date.now()}`,
                      ...newBenefit
                    }]
                  }));
                  setHasChanges(true);
                  setShowBenefitDialog(false);
                  setNewBenefit({ name: '', description: '', icon: 'Star' });
                }
              }}
              disabled={!newBenefit.name}
              className="bg-sky-blue hover:bg-royal-blue text-white"
            >
              Add Benefit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}