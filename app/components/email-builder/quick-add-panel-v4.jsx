"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/app/components/ui/button";
import { 
  X, 
  ChevronRight,
  Layers,
  Layout,
  Package,
  Type,
  Star,
  Award,
  Zap,
  ShoppingCart,
  Users,
  Mail
} from "lucide-react";
import { cn } from "@/lib/utils";

// Category definitions with icons and descriptions
const categories = [
  {
    id: 'header',
    name: 'Header',
    description: 'Top section elements',
    icon: Layout,
    iconBg: 'bg-violet-500',
    templates: [
      {
        id: 'header-logo-center',
        name: 'Logo Center',
        html: `
          <div style="padding: 30px; text-align: center; background: #ffffff; border-bottom: 1px solid #e5e7eb;">
            <img src="{{brand.logo}}" alt="{{brand.name}}" style="height: 48px; margin: 0 auto;">
          </div>
        `,
        preview: (
          <div className="w-full h-full flex items-center justify-center bg-white p-4">
            <div className="w-20 h-6 bg-gradient-to-r from-amber-400 to-amber-500 rounded"></div>
          </div>
        )
      },
      {
        id: 'header-logo-nav',
        name: 'Logo with Navigation',
        html: `
          <div style="padding: 20px 40px; background: #ffffff; border-bottom: 1px solid #e5e7eb;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%">
                  <img src="{{brand.logo}}" alt="{{brand.name}}" style="height: 40px;">
                </td>
                <td width="50%" style="text-align: right;">
                  <a href="#" style="color: {{brand.primaryColor}}; text-decoration: none; margin: 0 15px; font-size: 14px;">Shop</a>
                  <a href="#" style="color: {{brand.primaryColor}}; text-decoration: none; margin: 0 15px; font-size: 14px;">About</a>
                  <a href="#" style="color: {{brand.primaryColor}}; text-decoration: none; margin: 0 15px; font-size: 14px;">Contact</a>
                </td>
              </tr>
            </table>
          </div>
        `,
        preview: (
          <div className="w-full h-full bg-white p-3 flex justify-between items-center">
            <div className="w-14 h-4 bg-gradient-to-r from-amber-400 to-amber-500 rounded"></div>
            <div className="flex gap-1">
              <div className="w-6 h-2 bg-gray-300 rounded"></div>
              <div className="w-6 h-2 bg-gray-300 rounded"></div>
              <div className="w-6 h-2 bg-gray-300 rounded"></div>
            </div>
          </div>
        )
      },
      {
        id: 'header-tagline',
        name: 'Logo with Tagline',
        html: `
          <div style="padding: 35px; text-align: center; background: #ffffff; border-bottom: 1px solid #e5e7eb;">
            <img src="{{brand.logo}}" alt="{{brand.name}}" style="height: 50px; margin: 0 auto 12px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">{{brand.tagline}}</p>
          </div>
        `,
        preview: (
          <div className="w-full h-full bg-white p-3 flex flex-col items-center justify-center">
            <div className="w-16 h-5 bg-gradient-to-r from-amber-400 to-amber-500 rounded mb-1"></div>
            <div className="w-24 h-2 bg-gray-300 rounded"></div>
          </div>
        )
      }
    ]
  },
  {
    id: 'hero',
    name: 'Hero',
    description: 'Main banner sections',
    icon: Layers,
    iconBg: 'bg-gray-500',
    templates: [
      {
        id: 'hero-cta',
        name: 'Hero with CTA',
        html: `
          <div style="padding: 80px 40px; background: linear-gradient(135deg, {{brand.primaryColor}} 0%, {{brand.primaryColor}}dd 100%); text-align: center;">
            <h1 style="color: white; font-size: 42px; margin: 0 0 20px; font-weight: bold;">Welcome to {{brand.name}}</h1>
            <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 0 0 35px;">Discover amazing products at unbeatable prices</p>
            <a href="{{brand.websiteUrl}}" style="display: inline-block; background: white; color: {{brand.primaryColor}}; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Shop Now</a>
          </div>
        `,
        preview: (
          <div className="w-full h-full bg-gradient-to-br from-violet-500 to-purple-600 p-3 flex flex-col items-center justify-center">
            <div className="text-white text-center">
              <div className="text-xs font-bold mb-1">Welcome to</div>
              <div className="text-xs mb-1">Our Store</div>
              <div className="text-[8px] opacity-80 mb-2">Discover amazing products at unbeatable prices</div>
              <div className="bg-white text-purple-600 px-2 py-1 rounded text-[8px] font-medium inline-block">Button</div>
            </div>
          </div>
        )
      },
      {
        id: 'hero-sale',
        name: 'Sale Announcement',
        html: `
          <div style="padding: 60px 40px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); text-align: center;">
            <h1 style="color: white; font-size: 48px; margin: 0 0 20px; font-weight: bold;">MEGA SALE</h1>
            <p style="color: white; font-size: 24px; margin: 0 0 30px;">Up to 70% OFF</p>
            <a href="{{brand.websiteUrl}}" style="display: inline-block; background: white; color: #dc2626; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Shop Sale</a>
          </div>
        `,
        preview: (
          <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-600 p-3 flex flex-col items-center justify-center">
            <div className="text-white text-center">
              <div className="text-xs font-bold mb-1">MEGA SALE</div>
              <div className="text-[10px] mb-2">Up to 70% OFF</div>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'products',
    name: 'Products',
    description: 'Product showcases',
    icon: Package,
    iconBg: 'bg-gray-500',
    templates: [
      {
        id: 'product-grid-2',
        name: '2 Column Products',
        html: `
          <div style="padding: 60px 40px; background: white;">
            <h2 style="text-align: center; color: #111827; font-size: 32px; margin: 0 0 40px; font-weight: bold;">Featured Products</h2>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding: 0 15px;">
                  <img src="https://via.placeholder.com/300x300" alt="Product 1" style="width: 100%; height: auto; border-radius: 8px;">
                  <h3 style="color: #111827; font-size: 20px; margin: 16px 0 8px; font-weight: 600;">Product Name</h3>
                  <p style="color: {{brand.primaryColor}}; font-size: 24px; margin: 0 0 12px; font-weight: bold;">$99.99</p>
                  <a href="#" style="color: {{brand.primaryColor}}; text-decoration: none; font-weight: 500;">Shop Now →</a>
                </td>
                <td width="50%" style="padding: 0 15px;">
                  <img src="https://via.placeholder.com/300x300" alt="Product 2" style="width: 100%; height: auto; border-radius: 8px;">
                  <h3 style="color: #111827; font-size: 20px; margin: 16px 0 8px; font-weight: 600;">Product Name</h3>
                  <p style="color: {{brand.primaryColor}}; font-size: 24px; margin: 0 0 12px; font-weight: bold;">$79.99</p>
                  <a href="#" style="color: {{brand.primaryColor}}; text-decoration: none; font-weight: 500;">Shop Now →</a>
                </td>
              </tr>
            </table>
          </div>
        `,
        preview: (
          <div className="w-full h-full bg-white p-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="w-full h-10 bg-gray-200 rounded mb-1"></div>
                <div className="w-8 h-1 bg-gray-400 rounded mb-1"></div>
                <div className="w-6 h-2 bg-violet-500 rounded"></div>
              </div>
              <div>
                <div className="w-full h-10 bg-gray-200 rounded mb-1"></div>
                <div className="w-8 h-1 bg-gray-400 rounded mb-1"></div>
                <div className="w-6 h-2 bg-violet-500 rounded"></div>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'product-spotlight',
        name: 'Product Spotlight',
        html: `
          <div style="padding: 60px 40px; background: #f9fafb;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="40%" style="padding-right: 40px;">
                  <img src="https://via.placeholder.com/400x400" alt="Product" style="width: 100%; height: auto; border-radius: 12px;">
                </td>
                <td width="60%">
                  <span style="color: {{brand.primaryColor}}; font-size: 14px; font-weight: 600; text-transform: uppercase;">New Arrival</span>
                  <h2 style="color: #111827; font-size: 32px; margin: 12px 0 16px; font-weight: bold;">Premium Product</h2>
                  <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">Experience the perfect blend of quality and style.</p>
                  <div style="margin: 0 0 28px;">
                    <span style="color: #9ca3af; font-size: 18px; text-decoration: line-through; margin-right: 12px;">$149.99</span>
                    <span style="color: {{brand.primaryColor}}; font-size: 32px; font-weight: bold;">$99.99</span>
                  </div>
                  <a href="#" style="display: inline-block; background: {{brand.primaryColor}}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Add to Cart</a>
                </td>
              </tr>
            </table>
          </div>
        `,
        preview: (
          <div className="w-full h-full bg-gray-50 p-2 flex gap-2">
            <div className="w-1/3 h-full bg-gray-300 rounded"></div>
            <div className="flex-1 py-1">
              <div className="w-8 h-1 bg-violet-500 rounded mb-1"></div>
              <div className="w-12 h-2 bg-gray-600 rounded mb-1"></div>
              <div className="w-16 h-1 bg-gray-300 rounded mb-1"></div>
              <div className="w-10 h-3 bg-violet-500 rounded"></div>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'content',
    name: 'Content',
    description: 'Text and media blocks',
    icon: Type,
    iconBg: 'bg-gray-500',
    templates: [
      {
        id: 'text-block',
        name: 'Text Block',
        html: `
          <div style="padding: 40px; background: white;">
            <h3 style="color: #111827; font-size: 24px; margin: 0 0 16px; font-weight: bold;">About {{brand.name}}</h3>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">{{brand.missionStatement}}</p>
          </div>
        `,
        preview: (
          <div className="w-full h-full bg-white p-3">
            <div className="w-16 h-2 bg-gray-700 rounded mb-2"></div>
            <div className="w-full h-1 bg-gray-300 rounded mb-1"></div>
            <div className="w-full h-1 bg-gray-300 rounded mb-1"></div>
            <div className="w-20 h-1 bg-gray-300 rounded"></div>
          </div>
        )
      },
      {
        id: 'image-text',
        name: 'Image + Text',
        html: `
          <table width="100%" cellpadding="0" cellspacing="0" style="background: white;">
            <tr>
              <td width="50%" style="padding: 40px;">
                <img src="https://via.placeholder.com/400x300" alt="Content" style="width: 100%; height: auto; border-radius: 8px;">
              </td>
              <td width="50%" style="padding: 40px;">
                <h3 style="color: #111827; font-size: 24px; margin: 0 0 16px; font-weight: bold;">Our Story</h3>
                <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Discover the journey behind {{brand.name}}.</p>
              </td>
            </tr>
          </table>
        `,
        preview: (
          <div className="w-full h-full bg-white p-2 flex gap-2">
            <div className="w-1/2 h-full bg-gray-200 rounded"></div>
            <div className="flex-1 py-2">
              <div className="w-10 h-2 bg-gray-700 rounded mb-2"></div>
              <div className="w-full h-1 bg-gray-300 rounded mb-1"></div>
              <div className="w-12 h-1 bg-gray-300 rounded"></div>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'features',
    name: 'Features',
    description: 'Highlight benefits',
    icon: Star,
    iconBg: 'bg-gray-500',
    templates: [
      {
        id: 'benefits-3col',
        name: '3 Column Benefits',
        html: `
          <div style="padding: 50px 40px; background: #f9fafb;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="33%" style="text-align: center; padding: 0 20px;">
                  <div style="width: 60px; height: 60px; background: {{brand.primaryColor}}20; border-radius: 50%; margin: 0 auto 16px; line-height: 60px; font-size: 24px;">✓</div>
                  <h4 style="color: #111827; font-size: 18px; margin: 0 0 8px; font-weight: 600;">Free Shipping</h4>
                  <p style="color: #6b7280; font-size: 14px;">On orders over $50</p>
                </td>
                <td width="33%" style="text-align: center; padding: 0 20px;">
                  <div style="width: 60px; height: 60px; background: {{brand.primaryColor}}20; border-radius: 50%; margin: 0 auto 16px; line-height: 60px; font-size: 24px;">⚡</div>
                  <h4 style="color: #111827; font-size: 18px; margin: 0 0 8px; font-weight: 600;">Fast Delivery</h4>
                  <p style="color: #6b7280; font-size: 14px;">2-3 business days</p>
                </td>
                <td width="33%" style="text-align: center; padding: 0 20px;">
                  <div style="width: 60px; height: 60px; background: {{brand.primaryColor}}20; border-radius: 50%; margin: 0 auto 16px; line-height: 60px; font-size: 24px;">🛡️</div>
                  <h4 style="color: #111827; font-size: 18px; margin: 0 0 8px; font-weight: 600;">Secure Payment</h4>
                  <p style="color: #6b7280; font-size: 14px;">SSL encrypted</p>
                </td>
              </tr>
            </table>
          </div>
        `,
        preview: (
          <div className="w-full h-full bg-gray-50 p-3">
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="text-center">
                  <div className="w-6 h-6 bg-violet-200 rounded-full mx-auto mb-1"></div>
                  <div className="w-8 h-1 bg-gray-400 rounded mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'social-proof',
    name: 'Social Proof',
    description: 'Trust & credibility',
    icon: Award,
    iconBg: 'bg-gray-500',
    templates: [
      {
        id: 'testimonial',
        name: 'Customer Testimonial',
        html: `
          <div style="padding: 60px 40px; background: white; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto;">
              <div style="color: #fbbf24; font-size: 24px; margin-bottom: 24px;">★★★★★</div>
              <p style="color: #374151; font-size: 20px; line-height: 1.6; font-style: italic; margin: 0 0 24px;">"Amazing products and exceptional service!"</p>
              <p style="color: #111827; font-weight: 600;">— Sarah Johnson</p>
              <p style="color: #6b7280; font-size: 14px;">Verified Customer</p>
            </div>
          </div>
        `,
        preview: (
          <div className="w-full h-full bg-white p-3 text-center">
            <div className="text-yellow-400 text-xs mb-1">★★★★★</div>
            <div className="w-20 h-1 bg-gray-300 rounded mx-auto mb-1"></div>
            <div className="w-16 h-1 bg-gray-300 rounded mx-auto mb-2"></div>
            <div className="w-12 h-1 bg-gray-500 rounded mx-auto"></div>
          </div>
        )
      }
    ]
  },
  {
    id: 'cta',
    name: 'Call to Action',
    description: 'Action prompts',
    icon: Zap,
    iconBg: 'bg-gray-500',
    templates: [
      {
        id: 'cta-centered',
        name: 'Centered CTA',
        html: `
          <div style="padding: 60px 40px; background: linear-gradient(135deg, {{brand.primaryColor}} 0%, {{brand.primaryColor}}dd 100%); text-align: center;">
            <h2 style="color: white; font-size: 32px; margin: 0 0 16px; font-weight: bold;">Ready to Get Started?</h2>
            <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 0 0 32px;">Join thousands of satisfied customers</p>
            <a href="{{brand.websiteUrl}}" style="display: inline-block; background: white; color: {{brand.primaryColor}}; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Shop Now</a>
          </div>
        `,
        preview: (
          <div className="w-full h-full bg-gradient-to-br from-violet-500 to-purple-600 p-3 text-center">
            <div className="w-20 h-2 bg-white/80 rounded mx-auto mb-1"></div>
            <div className="w-24 h-1 bg-white/60 rounded mx-auto mb-2"></div>
            <div className="w-12 h-4 bg-white rounded mx-auto"></div>
          </div>
        )
      }
    ]
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    description: 'Shopping elements',
    icon: ShoppingCart,
    iconBg: 'bg-gray-500',
    templates: [
      {
        id: 'cart-reminder',
        name: 'Cart Reminder',
        html: `
          <div style="padding: 40px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px;">
            <h3 style="color: #111827; font-size: 24px; margin: 0 0 16px; font-weight: bold;">You left something behind!</h3>
            <p style="color: #6b7280; font-size: 16px; margin: 0 0 24px;">Complete your purchase and enjoy free shipping.</p>
            <a href="#" style="display: inline-block; background: {{brand.primaryColor}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">Complete Purchase</a>
          </div>
        `,
        preview: (
          <div className="w-full h-full bg-white border border-gray-200 p-3">
            <div className="w-20 h-2 bg-gray-700 rounded mb-2"></div>
            <div className="w-full h-1 bg-gray-300 rounded mb-1"></div>
            <div className="w-16 h-1 bg-gray-300 rounded mb-2"></div>
            <div className="w-14 h-4 bg-violet-500 rounded"></div>
          </div>
        )
      }
    ]
  },
  {
    id: 'footer',
    name: 'Footer',
    description: 'Bottom sections',
    icon: Mail,
    iconBg: 'bg-gray-500',
    templates: [
      {
        id: 'footer-simple',
        name: 'Simple Footer',
        html: `
          <div style="padding: 40px; background: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
            <div style="margin-bottom: 24px;">
              <a href="#" style="display: inline-block; margin: 0 8px;">
                <img src="https://img.icons8.com/ios-filled/24/6b7280/facebook-new.png" alt="Facebook">
              </a>
              <a href="#" style="display: inline-block; margin: 0 8px;">
                <img src="https://img.icons8.com/ios-filled/24/6b7280/instagram-new.png" alt="Instagram">
              </a>
              <a href="#" style="display: inline-block; margin: 0 8px;">
                <img src="https://img.icons8.com/ios-filled/24/6b7280/twitter.png" alt="Twitter">
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px;">© 2024 {{brand.name}}. All rights reserved.</p>
            <p style="color: #9ca3af; font-size: 12px;">
              <a href="#" style="color: #9ca3af;">Unsubscribe</a> | 
              <a href="#" style="color: #9ca3af;">Privacy</a>
            </p>
          </div>
        `,
        preview: (
          <div className="w-full h-full bg-gray-50 border-t p-2 text-center">
            <div className="flex justify-center gap-1 mb-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-3 h-3 bg-gray-400 rounded-full"></div>
              ))}
            </div>
            <div className="w-16 h-1 bg-gray-300 rounded mx-auto mb-1"></div>
            <div className="w-20 h-1 bg-gray-200 rounded mx-auto"></div>
          </div>
        )
      }
    ]
  }
];

export default function QuickAddPanelV4({ isOpen, onClose, onAddTemplate, storePublicId }) {
  const [brandData, setBrandData] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const hoverTimeoutRef = useRef(null);

  // Smart hover with delay
  const handleCategoryHover = (category) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(category.id);
      setSelectedCategory(category);
    }, 200); // 200ms delay for smart hover
  };

  const handleCategoryLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Fetch brand data when panel opens
  useEffect(() => {
    if (isOpen && storePublicId && !brandData) {
      fetchBrandData();
    }
  }, [isOpen, storePublicId]);

  const fetchBrandData = async () => {
    try {
      const response = await fetch(`/api/store/${storePublicId}/brand`);
      if (response.ok) {
        const data = await response.json();
        setBrandData(data.brand);
      }
    } catch (error) {
      console.error('Error fetching brand data:', error);
    }
  };

  const handleAddTemplate = (template, category) => {
    let processedHtml = template.html;
    
    if (brandData) {
      // Replace brand variables
      processedHtml = processedHtml.replace(/{{brand\.(\w+)}}/g, (match, key) => {
        return brandData[key] || match;
      });
      
      // If no logo is set, use a placeholder
      if (!brandData.logo) {
        processedHtml = processedHtml.replace(/{{brand\.logo}}/g, 
          `https://via.placeholder.com/150x50/8b5cf6/ffffff?text=${encodeURIComponent(brandData.name || 'Logo')}`
        );
      }
    }
    
    onAddTemplate({
      ...template,
      category: category.id,
      html: processedHtml,
      timestamp: Date.now()
    });
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/30 z-40 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Main Container */}
      <div className={cn(
        "fixed left-0 top-0 h-full flex transition-transform z-50",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        
        {/* Categories Panel */}
        <div className="w-[280px] h-full bg-white shadow-xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Quick Add</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-7 w-7 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Categories List */}
          <div className="flex-1 overflow-y-auto">
            {categories.map((category) => (
              <div
                key={category.id}
                onMouseEnter={() => handleCategoryHover(category)}
                onMouseLeave={handleCategoryLeave}
                className={cn(
                  "px-4 py-3 hover:bg-purple-50 cursor-pointer transition-colors border-l-4",
                  hoveredCategory === category.id 
                    ? "bg-purple-50 border-purple-500" 
                    : "border-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center",
                    category.iconBg
                  )}>
                    <category.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
                    <p className="text-xs text-gray-500">{category.description}</p>
                  </div>
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-transform",
                    hoveredCategory === category.id 
                      ? "text-purple-600 translate-x-0.5" 
                      : "text-gray-400"
                  )} />
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {brandData && (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{brandData.name}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Templates Panel - Shows on hover */}
        {selectedCategory && hoveredCategory && (
          <div 
            className="w-[420px] h-full bg-gray-50 shadow-xl overflow-y-auto"
            onMouseEnter={() => setHoveredCategory(selectedCategory.id)}
            onMouseLeave={() => {
              setHoveredCategory(null);
              setSelectedCategory(null);
            }}
          >
            <div className="p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                {selectedCategory.name} Templates
              </h3>
              
              <div className="space-y-4">
                {selectedCategory.templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleAddTemplate(template, selectedCategory)}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="aspect-[2/1] bg-gray-50">
                      {template.preview}
                    </div>
                    <div className="px-4 py-3 border-t border-gray-100">
                      <h4 className="text-sm font-medium text-gray-900">
                        {template.name}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}