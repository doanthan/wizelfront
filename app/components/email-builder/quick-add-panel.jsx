"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Badge } from "@/app/components/ui/badge";
import { 
  X, 
  Search, 
  Sparkles,
  Layout,
  Package,
  Megaphone,
  Gift,
  ShoppingCart,
  Mail,
  Image,
  Type,
  Star,
  TrendingUp,
  Clock,
  Users,
  Heart,
  ArrowRight,
  Layers,
  Plus,
  Palette,
  Award,
  Zap,
  Target,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

// Pre-designed template sections
const templateSections = {
  brand: [
    {
      id: 'brand-header-complete',
      name: 'Brand Header Complete',
      category: 'brand',
      tags: ['brand', 'header', 'complete'],
      icon: Building2,
      preview: '/templates/brand-header-complete.png',
      html: `
        <div style="background: #ffffff; border-bottom: 1px solid #e5e5e5;">
          <div style="padding: 20px; text-align: center;">
            <img src="{{brand.logo}}" alt="{{brand.name}}" style="height: 50px; margin: 0 auto 10px;">
            <p style="color: {{brand.primaryColor}}; font-size: 14px; margin: 0;">{{brand.tagline}}</p>
          </div>
        </div>
      `
    },
    {
      id: 'brand-benefits-banner',
      name: 'Brand Benefits Bar',
      category: 'brand',
      tags: ['brand', 'benefits', 'trust'],
      icon: Award,
      preview: '/templates/brand-benefits.png',
      html: `
        <div style="background: linear-gradient(135deg, {{brand.primaryColor}}20 0%, {{brand.primaryColor}}10 100%); padding: 15px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="25%" style="text-align: center; padding: 5px;">
                <div style="color: {{brand.primaryColor}};">✓</div>
                <div style="font-size: 12px; color: #666;">Free Shipping</div>
              </td>
              <td width="25%" style="text-align: center; padding: 5px;">
                <div style="color: {{brand.primaryColor}};">⚡</div>
                <div style="font-size: 12px; color: #666;">Fast Delivery</div>
              </td>
              <td width="25%" style="text-align: center; padding: 5px;">
                <div style="color: {{brand.primaryColor}};">🛡️</div>
                <div style="font-size: 12px; color: #666;">Secure Payment</div>
              </td>
              <td width="25%" style="text-align: center; padding: 5px;">
                <div style="color: {{brand.primaryColor}};">🌟</div>
                <div style="font-size: 12px; color: #666;">5-Star Rated</div>
              </td>
            </tr>
          </table>
        </div>
      `
    },
    {
      id: 'brand-color-block',
      name: 'Brand Color Block',
      category: 'brand',
      tags: ['brand', 'color', 'visual'],
      icon: Palette,
      preview: '/templates/brand-color-block.png',
      html: `
        <div style="background: linear-gradient(135deg, {{brand.primaryColor}} 0%, {{brand.primaryColor}}dd 100%); padding: 60px 40px; text-align: center;">
          <h2 style="color: white; font-size: 32px; margin: 0 0 15px;">{{brand.name}}</h2>
          <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 0 0 25px;">{{brand.uniqueValueProposition}}</p>
          <a href="{{brand.websiteUrl}}" style="display: inline-block; background: white; color: {{brand.primaryColor}}; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Shop Now</a>
        </div>
      `
    },
    {
      id: 'brand-mission-statement',
      name: 'Mission Statement',
      category: 'brand',
      tags: ['brand', 'mission', 'about'],
      icon: Target,
      preview: '/templates/brand-mission.png',
      html: `
        <div style="padding: 40px; background: #f8f9fa; text-align: center;">
          <h3 style="color: {{brand.primaryColor}}; font-size: 24px; margin: 0 0 20px;">Our Mission</h3>
          <p style="color: #666; font-size: 16px; line-height: 1.6; max-width: 600px; margin: 0 auto;">{{brand.missionStatement}}</p>
        </div>
      `
    },
    {
      id: 'brand-social-links',
      name: 'Social Media Bar',
      category: 'brand',
      tags: ['brand', 'social', 'footer'],
      icon: Users,
      preview: '/templates/brand-social.png',
      html: `
        <div style="padding: 30px; background: white; text-align: center;">
          <h4 style="color: #333; font-size: 16px; margin: 0 0 20px;">Follow {{brand.name}}</h4>
          <div style="display: inline-block;">
            <a href="{{brand.socialFacebook}}" style="display: inline-block; margin: 0 10px;">
              <img src="https://img.icons8.com/ios-filled/30/{{brand.primaryColor}}/facebook-new.png" alt="Facebook" style="width: 30px; height: 30px;">
            </a>
            <a href="{{brand.socialInstagram}}" style="display: inline-block; margin: 0 10px;">
              <img src="https://img.icons8.com/ios-filled/30/{{brand.primaryColor}}/instagram-new.png" alt="Instagram" style="width: 30px; height: 30px;">
            </a>
            <a href="{{brand.socialTwitterX}}" style="display: inline-block; margin: 0 10px;">
              <img src="https://img.icons8.com/ios-filled/30/{{brand.primaryColor}}/twitter.png" alt="Twitter" style="width: 30px; height: 30px;">
            </a>
            <a href="{{brand.socialLinkedIn}}" style="display: inline-block; margin: 0 10px;">
              <img src="https://img.icons8.com/ios-filled/30/{{brand.primaryColor}}/linkedin.png" alt="LinkedIn" style="width: 30px; height: 30px;">
            </a>
          </div>
        </div>
      `
    },
    {
      id: 'brand-categories',
      name: 'Category Navigation',
      category: 'brand',
      tags: ['brand', 'navigation', 'categories'],
      icon: Package,
      preview: '/templates/brand-categories.png',
      html: `
        <div style="padding: 20px; background: #f8f9fa; text-align: center;">
          <div style="display: inline-block;">
            {{#each brand.categories}}
            <a href="{{link}}" style="display: inline-block; margin: 5px 10px; padding: 8px 16px; background: white; color: {{@root.brand.primaryColor}}; text-decoration: none; border: 1px solid {{@root.brand.primaryColor}}; border-radius: 20px; font-size: 14px;">{{name}}</a>
            {{/each}}
          </div>
        </div>
      `
    },
    {
      id: 'brand-announcement',
      name: 'Announcement Banner',
      category: 'brand',
      tags: ['brand', 'announcement', 'promo'],
      icon: Megaphone,
      preview: '/templates/brand-announcement.png',
      html: `
        <div style="background: linear-gradient(90deg, {{brand.primaryColor}} 0%, {{brand.primaryColor}}dd 100%); padding: 15px; text-align: center;">
          <p style="color: white; font-size: 16px; margin: 0; font-weight: 500;">
            🎉 {{brand.announcement}}
          </p>
        </div>
      `
    }
  ],
  headers: [
    {
      id: 'header-logo-center',
      name: 'Logo Center',
      category: 'headers',
      tags: ['minimal', 'clean'],
      icon: Layout,
      preview: '/templates/header-logo-center.png',
      html: `
        <div style="padding: 30px; text-align: center; background: #ffffff;">
          <img src="{{brand.logo}}" alt="{{brand.name}}" style="height: 40px; margin: 0 auto;">
        </div>
      `
    },
    {
      id: 'header-logo-nav',
      name: 'Logo + Navigation',
      category: 'headers',
      tags: ['navigation', 'menu'],
      icon: Layout,
      preview: '/templates/header-logo-nav.png',
      html: `
        <div style="padding: 20px; background: #ffffff;">
          <table width="100%">
            <tr>
              <td><img src="{{brand.logo}}" alt="{{brand.name}}" style="height: 35px;"></td>
              <td style="text-align: right;">
                <a href="#" style="color: {{brand.primaryColor}}; text-decoration: none; margin: 0 10px;">Shop</a>
                <a href="#" style="color: {{brand.primaryColor}}; text-decoration: none; margin: 0 10px;">About</a>
                <a href="#" style="color: {{brand.primaryColor}}; text-decoration: none; margin: 0 10px;">Contact</a>
              </td>
            </tr>
          </table>
        </div>
      `
    },
    {
      id: 'header-announcement',
      name: 'Announcement Bar',
      category: 'headers',
      tags: ['announcement', 'promo'],
      icon: Megaphone,
      preview: '/templates/header-announcement.png',
      html: `
        <div style="background: {{brand.primaryColor}}; color: white; padding: 12px; text-align: center; font-size: 14px;">
          <strong>🎉 {{brand.announcement}}</strong>
        </div>
      `
    }
  ],
  hero: [
    {
      id: 'hero-image-text',
      name: 'Image + Text Overlay',
      category: 'hero',
      tags: ['hero', 'banner'],
      icon: Image,
      preview: '/templates/hero-image-text.png',
      html: `
        <div style="position: relative; background: url('{{hero.image}}') center/cover; height: 400px;">
          <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
            <div style="text-align: center; color: white; padding: 20px;">
              <h1 style="font-size: 48px; margin: 0 0 20px;">{{hero.title}}</h1>
              <p style="font-size: 18px; margin: 0 0 30px;">{{hero.subtitle}}</p>
              <a href="{{hero.cta.url}}" style="background: {{brand.primaryColor}}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">{{hero.cta.text}}</a>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'hero-split',
      name: 'Split Hero',
      category: 'hero',
      tags: ['hero', 'split'],
      preview: '/templates/hero-split.png',
      html: `
        <table width="100%" style="background: #f8f8f8;">
          <tr>
            <td width="50%" style="padding: 40px;">
              <h2 style="color: {{brand.primaryColor}}; font-size: 32px;">{{hero.title}}</h2>
              <p style="color: #666; line-height: 1.6;">{{hero.description}}</p>
              <a href="{{hero.cta.url}}" style="display: inline-block; background: {{brand.primaryColor}}; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin-top: 20px;">{{hero.cta.text}}</a>
            </td>
            <td width="50%">
              <img src="{{hero.image}}" alt="" style="width: 100%; height: auto;">
            </td>
          </tr>
        </table>
      `
    }
  ],
  promotional: [
    {
      id: 'promo-flash-sale',
      name: 'Flash Sale Banner',
      category: 'promotional',
      tags: ['sale', 'promotion', 'urgent'],
      icon: Zap,
      preview: '/templates/promo-flash-sale.png',
      html: `
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px; text-align: center;">
          <h2 style="color: white; font-size: 36px; margin: 0 0 10px;">⚡ FLASH SALE ⚡</h2>
          <p style="color: white; font-size: 24px; margin: 0 0 20px;">Up to 50% OFF Everything!</p>
          <div style="display: inline-block; background: white; color: #dc2626; padding: 8px 20px; border-radius: 5px; font-size: 18px; font-weight: bold;">
            Use Code: {{brand.promoCode}}
          </div>
        </div>
      `
    },
    {
      id: 'promo-vip-exclusive',
      name: 'VIP Exclusive',
      category: 'promotional',
      tags: ['vip', 'exclusive', 'special'],
      icon: Star,
      preview: '/templates/promo-vip.png',
      html: `
        <div style="background: linear-gradient(135deg, {{brand.primaryColor}} 0%, #1e293b 100%); padding: 50px 40px; text-align: center;">
          <div style="display: inline-block; margin-bottom: 20px;">
            <span style="color: #fbbf24; font-size: 24px;">★ ★ ★ ★ ★</span>
          </div>
          <h2 style="color: white; font-size: 28px; margin: 0 0 15px;">VIP EXCLUSIVE OFFER</h2>
          <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0 0 25px;">As a valued customer of {{brand.name}}, enjoy this special deal</p>
          <a href="{{brand.websiteUrl}}" style="display: inline-block; background: #fbbf24; color: #1e293b; padding: 14px 35px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">CLAIM YOUR REWARD</a>
        </div>
      `
    },
    {
      id: 'promo-limited-time',
      name: 'Limited Time Offer',
      category: 'promotional',
      tags: ['limited', 'urgent', 'countdown'],
      icon: Clock,
      preview: '/templates/promo-limited.png',
      html: `
        <div style="padding: 30px; background: #fff3cd; border: 2px solid #ffc107; border-radius: 10px; text-align: center; margin: 20px;">
          <div style="color: #856404; font-size: 14px; margin-bottom: 10px;">⏰ LIMITED TIME ONLY</div>
          <h3 style="color: #856404; font-size: 24px; margin: 0 0 15px;">Special {{brand.name}} Offer</h3>
          <p style="color: #856404; font-size: 16px; margin: 0 0 20px;">Get {{brand.discount}}% off your next purchase!</p>
          <a href="{{brand.websiteUrl}}" style="display: inline-block; background: #ffc107; color: #212529; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Shop Now →</a>
        </div>
      `
    }
  ],
  products: [
    {
      id: 'product-grid-2',
      name: '2 Column Products',
      category: 'products',
      tags: ['products', 'grid', 'shop'],
      icon: Package,
      preview: '/templates/product-grid-2.png',
      html: `
        <div style="padding: 40px; background: white;">
          <h2 style="text-align: center; color: #333; margin-bottom: 30px;">Featured Products</h2>
          <table width="100%">
            <tr>
              {{#each products}}
              <td width="50%" style="padding: 15px;">
                <img src="{{image}}" alt="{{name}}" style="width: 100%; height: auto;">
                <h3 style="color: #333; margin: 15px 0 5px;">{{name}}</h3>
                <p style="color: #999; font-size: 18px; margin: 10px 0;">{{price}}</p>
                <a href="{{url}}" style="color: {{@root.brand.primaryColor}}; text-decoration: none;">Shop Now →</a>
              </td>
              {{/each}}
            </tr>
          </table>
        </div>
      `
    },
    {
      id: 'product-spotlight',
      name: 'Product Spotlight',
      category: 'products',
      tags: ['products', 'feature', 'spotlight'],
      preview: '/templates/product-spotlight.png',
      html: `
        <div style="padding: 60px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <table width="100%">
            <tr>
              <td width="40%">
                <img src="{{product.image}}" alt="{{product.name}}" style="width: 100%; height: auto; border-radius: 10px;">
              </td>
              <td width="60%" style="padding-left: 40px;">
                <h2 style="color: white; font-size: 28px; margin: 0 0 15px;">{{product.name}}</h2>
                <p style="color: rgba(255,255,255,0.9); line-height: 1.6; margin: 0 0 20px;">{{product.description}}</p>
                <div style="margin: 20px 0;">
                  <span style="color: rgba(255,255,255,0.7); text-decoration: line-through; margin-right: 10px;">{{product.originalPrice}}</span>
                  <span style="color: white; font-size: 24px; font-weight: bold;">{{product.salePrice}}</span>
                </div>
                <a href="{{product.url}}" style="display: inline-block; background: white; color: #764ba2; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Buy Now</a>
              </td>
            </tr>
          </table>
        </div>
      `
    },
    {
      id: 'product-carousel',
      name: 'Product Carousel',
      category: 'products', 
      tags: ['products', 'carousel', 'slider'],
      preview: '/templates/product-carousel.png',
      html: `
        <div style="padding: 40px; background: #f8f8f8;">
          <h2 style="text-align: center; color: #333; margin-bottom: 30px;">Best Sellers</h2>
          <div style="overflow-x: auto; white-space: nowrap;">
            {{#each products}}
            <div style="display: inline-block; width: 200px; margin: 0 10px; vertical-align: top;">
              <img src="{{image}}" alt="{{name}}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">
              <h4 style="color: #333; margin: 10px 0 5px; white-space: normal;">{{name}}</h4>
              <p style="color: {{@root.brand.primaryColor}}; font-weight: bold;">{{price}}</p>
            </div>
            {{/each}}
          </div>
        </div>
      `
    }
  ],
  content: [
    {
      id: 'content-testimonial',
      name: 'Customer Testimonial',
      category: 'content',
      tags: ['testimonial', 'review', 'social proof'],
      preview: '/templates/content-testimonial.png',
      html: `
        <div style="padding: 40px; background: white; text-align: center;">
          <div style="max-width: 600px; margin: 0 auto;">
            <div style="color: #fbbf24; font-size: 24px; margin-bottom: 20px;">★★★★★</div>
            <p style="color: #666; font-size: 18px; line-height: 1.6; font-style: italic; margin: 0 0 20px;">"{{testimonial.text}}"</p>
            <p style="color: #333; font-weight: bold;">— {{testimonial.author}}</p>
          </div>
        </div>
      `
    },
    {
      id: 'content-countdown',
      name: 'Countdown Timer',
      category: 'content',
      tags: ['countdown', 'urgency', 'timer'],
      preview: '/templates/content-countdown.png',
      html: `
        <div style="padding: 30px; background: {{brand.primaryColor}}; text-align: center;">
          <h3 style="color: white; margin: 0 0 20px;">Sale Ends In:</h3>
          <div style="display: flex; justify-content: center; gap: 15px;">
            <div style="background: white; padding: 15px; border-radius: 8px;">
              <div style="font-size: 28px; font-weight: bold; color: {{brand.primaryColor}};">{{countdown.days}}</div>
              <div style="font-size: 12px; color: #666;">DAYS</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px;">
              <div style="font-size: 28px; font-weight: bold; color: {{brand.primaryColor}};">{{countdown.hours}}</div>
              <div style="font-size: 12px; color: #666;">HOURS</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px;">
              <div style="font-size: 28px; font-weight: bold; color: {{brand.primaryColor}};">{{countdown.minutes}}</div>
              <div style="font-size: 12px; color: #666;">MINS</div>
            </div>
          </div>
        </div>
      `
    }
  ],
  footers: [
    {
      id: 'footer-simple',
      name: 'Simple Footer',
      category: 'footers',
      tags: ['footer', 'minimal'],
      preview: '/templates/footer-simple.png',
      html: `
        <div style="padding: 30px; background: #f8f8f8; text-align: center;">
          <div style="margin-bottom: 20px;">
            {{#each brand.socialLinks}}
            <a href="{{url}}" style="margin: 0 10px;"><img src="{{icon}}" alt="{{name}}" style="width: 24px; height: 24px;"></a>
            {{/each}}
          </div>
          <p style="color: #666; font-size: 12px; margin: 10px 0;">© {{brand.year}} {{brand.name}}. All rights reserved.</p>
          <p style="color: #666; font-size: 12px;">
            <a href="{{brand.unsubscribeUrl}}" style="color: #666;">Unsubscribe</a> | 
            <a href="{{brand.preferencesUrl}}" style="color: #666;">Update Preferences</a>
          </p>
        </div>
      `
    },
    {
      id: 'footer-complete',
      name: 'Complete Footer',
      category: 'footers',
      tags: ['footer', 'complete', 'links'],
      preview: '/templates/footer-complete.png',
      html: `
        <div style="padding: 40px; background: #222; color: white;">
          <table width="100%">
            <tr>
              <td width="25%">
                <h4 style="color: white; margin: 0 0 15px;">Shop</h4>
                <p><a href="#" style="color: #999; text-decoration: none; line-height: 1.8;">New Arrivals</a></p>
                <p><a href="#" style="color: #999; text-decoration: none; line-height: 1.8;">Best Sellers</a></p>
                <p><a href="#" style="color: #999; text-decoration: none; line-height: 1.8;">Sale</a></p>
              </td>
              <td width="25%">
                <h4 style="color: white; margin: 0 0 15px;">Help</h4>
                <p><a href="#" style="color: #999; text-decoration: none; line-height: 1.8;">Contact Us</a></p>
                <p><a href="#" style="color: #999; text-decoration: none; line-height: 1.8;">FAQ</a></p>
                <p><a href="#" style="color: #999; text-decoration: none; line-height: 1.8;">Shipping</a></p>
              </td>
              <td width="25%">
                <h4 style="color: white; margin: 0 0 15px;">About</h4>
                <p><a href="#" style="color: #999; text-decoration: none; line-height: 1.8;">Our Story</a></p>
                <p><a href="#" style="color: #999; text-decoration: none; line-height: 1.8;">Press</a></p>
                <p><a href="#" style="color: #999; text-decoration: none; line-height: 1.8;">Careers</a></p>
              </td>
              <td width="25%">
                <h4 style="color: white; margin: 0 0 15px;">Connect</h4>
                <div style="margin-bottom: 15px;">
                  {{#each brand.socialLinks}}
                  <a href="{{url}}" style="margin-right: 10px;"><img src="{{icon}}" alt="{{name}}" style="width: 20px; height: 20px; filter: brightness(0) invert(1);"></a>
                  {{/each}}
                </div>
              </td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #444; margin: 30px 0;">
          <p style="text-align: center; color: #666; font-size: 12px;">
            © {{brand.year}} {{brand.name}} | 
            <a href="{{brand.privacyUrl}}" style="color: #666;">Privacy</a> | 
            <a href="{{brand.termsUrl}}" style="color: #666;">Terms</a> | 
            <a href="{{brand.unsubscribeUrl}}" style="color: #666;">Unsubscribe</a>
          </p>
        </div>
      `
    }
  ]
};

export default function QuickAddPanel({ isOpen, onClose, onAddTemplate, currentBrand, storePublicId }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
  const [brandData, setBrandData] = useState(null);
  const [isLoadingBrand, setIsLoadingBrand] = useState(false);

  // Fetch brand data when panel opens
  useEffect(() => {
    if (isOpen && storePublicId && !brandData) {
      fetchBrandData();
    }
  }, [isOpen, storePublicId]);

  const fetchBrandData = async () => {
    setIsLoadingBrand(true);
    try {
      const response = await fetch(`/api/store/${storePublicId}/brand`);
      if (response.ok) {
        const data = await response.json();
        setBrandData(data.brand);
      }
    } catch (error) {
      console.error('Error fetching brand data:', error);
    } finally {
      setIsLoadingBrand(false);
    }
  };

  // Filter templates based on search and category
  const getFilteredTemplates = () => {
    let allTemplates = [];
    
    if (activeCategory === "all" || activeCategory === "brand") {
      allTemplates = [...allTemplates, ...templateSections.brand];
    }
    if (activeCategory === "all" || activeCategory === "promotional") {
      allTemplates = [...allTemplates, ...templateSections.promotional];
    }
    if (activeCategory === "all" || activeCategory === "headers") {
      allTemplates = [...allTemplates, ...templateSections.headers];
    }
    if (activeCategory === "all" || activeCategory === "hero") {
      allTemplates = [...allTemplates, ...templateSections.hero];
    }
    if (activeCategory === "all" || activeCategory === "products") {
      allTemplates = [...allTemplates, ...templateSections.products];
    }
    if (activeCategory === "all" || activeCategory === "content") {
      allTemplates = [...allTemplates, ...templateSections.content];
    }
    if (activeCategory === "all" || activeCategory === "footers") {
      allTemplates = [...allTemplates, ...templateSections.footers];
    }

    if (searchQuery) {
      allTemplates = allTemplates.filter(template => 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return allTemplates;
  };

  const handleAddTemplate = (template) => {
    // Replace brand variables with actual brand data
    let processedHtml = template.html;
    const brand = brandData || currentBrand;
    
    if (brand) {
      // Replace simple brand variables
      processedHtml = processedHtml.replace(/{{brand\.(\w+)}}/g, (match, key) => {
        return brand[key] || match;
      });
      
      // Replace nested brand variables (like brand.logo.url)
      processedHtml = processedHtml.replace(/{{brand\.(\w+)\.(\w+)}}/g, (match, key1, key2) => {
        return brand[key1]?.[key2] || match;
      });
      
      // If no logo is set, use a placeholder
      if (!brand.logo) {
        processedHtml = processedHtml.replace(/{{brand\.logo}}/g, 'https://via.placeholder.com/150x50/60A5FA/ffffff?text=' + encodeURIComponent(brand.name || 'Logo'));
      }
    }
    
    onAddTemplate({
      ...template,
      html: processedHtml,
      timestamp: Date.now()
    });
  };

  const filteredTemplates = getFilteredTemplates();

  return (
    <>
      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-white shadow-xl z-50 transition-transform w-96",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-vivid-violet" />
              <h2 className="text-lg font-semibold text-gray-900">Quick Add</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="border-b border-gray-200">
          <div className="flex gap-2 p-3 overflow-x-auto">
            <Button
              variant={activeCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("all")}
              className="h-8 px-3 flex-shrink-0"
            >
              All
            </Button>
            <Button
              variant={activeCategory === "brand" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("brand")}
              className="h-8 px-3 flex-shrink-0 gap-1"
            >
              <Building2 className="h-3 w-3" />
              Brand
            </Button>
            <Button
              variant={activeCategory === "promotional" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("promotional")}
              className="h-8 px-3 flex-shrink-0 gap-1"
            >
              <Zap className="h-3 w-3" />
              Promo
            </Button>
            <Button
              variant={activeCategory === "headers" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("headers")}
              className="h-8 px-3 flex-shrink-0"
            >
              Headers
            </Button>
            <Button
              variant={activeCategory === "hero" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("hero")}
              className="h-8 px-3 flex-shrink-0"
            >
              Hero
            </Button>
            <Button
              variant={activeCategory === "products" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("products")}
              className="h-8 px-3 flex-shrink-0"
            >
              Products
            </Button>
            <Button
              variant={activeCategory === "content" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("content")}
              className="h-8 px-3 flex-shrink-0"
            >
              Content
            </Button>
            <Button
              variant={activeCategory === "footers" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("footers")}
              className="h-8 px-3 flex-shrink-0"
            >
              Footers
            </Button>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="group cursor-pointer"
                  onMouseEnter={() => setHoveredTemplate(template.id)}
                  onMouseLeave={() => setHoveredTemplate(null)}
                  onClick={() => handleAddTemplate(template)}
                >
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-[4/3] mb-2">
                    {/* Template Preview Placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {template.icon ? (
                        <template.icon className="h-8 w-8 text-gray-400" />
                      ) : (
                        <Layers className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-r from-sky-blue to-vivid-violet opacity-0 group-hover:opacity-90 transition-opacity flex items-center justify-center"
                    )}>
                      <div className="text-white text-center">
                        <Plus className="h-6 w-6 mx-auto mb-1" />
                        <p className="text-xs font-medium">Add to Canvas</p>
                      </div>
                    </div>
                  </div>
                  
                  <h4 className="text-sm font-medium text-gray-900 group-hover:text-sky-blue transition-colors">
                    {template.name}
                  </h4>
                  <div className="flex gap-1 mt-1">
                    {template.tags.slice(0, 2).map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="secondary" 
                        className="text-xs px-1.5 py-0"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No templates found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{filteredTemplates.length} templates</span>
            <span>Powered by AI</span>
          </div>
        </div>
      </div>
    </>
  );
}