"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { 
  X, 
  Search, 
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
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

// Category definitions with icons and descriptions
const categories = [
  {
    id: 'header',
    name: 'Header',
    description: 'Top section elements',
    icon: Layout,
    color: 'bg-violet-500',
    templates: [
      {
        id: 'logo-center',
        name: 'Logo Center',
        preview: 'logo-center',
        html: `
          <div style="padding: 30px; text-align: center; background: #ffffff; border-bottom: 1px solid #e5e7eb;">
            <img src="{{brand.logo}}" alt="{{brand.name}}" style="height: 48px; margin: 0 auto;">
          </div>
        `
      },
      {
        id: 'logo-menu',
        name: 'Logo Left with Menu',
        preview: 'logo-menu',
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
        `
      },
      {
        id: 'logo-tagline',
        name: 'Logo with Tagline',
        preview: 'logo-tagline',
        html: `
          <div style="padding: 35px; text-align: center; background: #ffffff; border-bottom: 1px solid #e5e7eb;">
            <img src="{{brand.logo}}" alt="{{brand.name}}" style="height: 50px; margin: 0 auto 12px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">{{brand.tagline}}</p>
          </div>
        `
      }
    ]
  },
  {
    id: 'hero',
    name: 'Hero',
    description: 'Main banner sections',
    icon: Layers,
    color: 'bg-gray-500',
    templates: [
      {
        id: 'hero-centered',
        name: 'Centered Hero',
        preview: 'hero-centered',
        html: `
          <div style="padding: 80px 40px; background: linear-gradient(135deg, {{brand.primaryColor}} 0%, {{brand.primaryColor}}dd 100%); text-align: center;">
            <h1 style="color: white; font-size: 42px; margin: 0 0 20px; font-weight: bold;">{{hero.title}}</h1>
            <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 0 0 35px; max-width: 600px; margin-left: auto; margin-right: auto;">{{hero.subtitle}}</p>
            <a href="{{hero.ctaUrl}}" style="display: inline-block; background: white; color: {{brand.primaryColor}}; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">{{hero.ctaText}}</a>
          </div>
        `
      },
      {
        id: 'hero-split',
        name: 'Split Hero',
        preview: 'hero-split',
        html: `
          <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb;">
            <tr>
              <td width="50%" style="padding: 60px 40px;">
                <h2 style="color: #111827; font-size: 36px; margin: 0 0 20px; font-weight: bold;">{{hero.title}}</h2>
                <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">{{hero.description}}</p>
                <a href="{{hero.ctaUrl}}" style="display: inline-block; background: {{brand.primaryColor}}; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">{{hero.ctaText}}</a>
              </td>
              <td width="50%">
                <img src="{{hero.image}}" alt="" style="width: 100%; height: auto; display: block;">
              </td>
            </tr>
          </table>
        `
      }
    ]
  },
  {
    id: 'products',
    name: 'Products',
    description: 'Product showcases',
    icon: Package,
    color: 'bg-gray-500',
    templates: [
      {
        id: 'product-grid',
        name: '2 Column Grid',
        preview: 'product-grid',
        html: `
          <div style="padding: 60px 40px; background: white;">
            <h2 style="text-align: center; color: #111827; font-size: 32px; margin: 0 0 40px; font-weight: bold;">Featured Products</h2>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding: 0 15px;">
                  <img src="{{product1.image}}" alt="{{product1.name}}" style="width: 100%; height: auto; border-radius: 8px;">
                  <h3 style="color: #111827; font-size: 20px; margin: 16px 0 8px; font-weight: 600;">{{product1.name}}</h3>
                  <p style="color: {{brand.primaryColor}}; font-size: 24px; margin: 0 0 12px; font-weight: bold;">{{product1.price}}</p>
                  <a href="{{product1.url}}" style="color: {{brand.primaryColor}}; text-decoration: none; font-weight: 500;">Shop Now →</a>
                </td>
                <td width="50%" style="padding: 0 15px;">
                  <img src="{{product2.image}}" alt="{{product2.name}}" style="width: 100%; height: auto; border-radius: 8px;">
                  <h3 style="color: #111827; font-size: 20px; margin: 16px 0 8px; font-weight: 600;">{{product2.name}}</h3>
                  <p style="color: {{brand.primaryColor}}; font-size: 24px; margin: 0 0 12px; font-weight: bold;">{{product2.price}}</p>
                  <a href="{{product2.url}}" style="color: {{brand.primaryColor}}; text-decoration: none; font-weight: 500;">Shop Now →</a>
                </td>
              </tr>
            </table>
          </div>
        `
      },
      {
        id: 'product-spotlight',
        name: 'Product Spotlight',
        preview: 'product-spotlight',
        html: `
          <div style="padding: 60px 40px; background: #f9fafb;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="40%" style="padding-right: 40px;">
                  <img src="{{product.image}}" alt="{{product.name}}" style="width: 100%; height: auto; border-radius: 12px;">
                </td>
                <td width="60%">
                  <span style="color: {{brand.primaryColor}}; font-size: 14px; font-weight: 600; text-transform: uppercase;">New Arrival</span>
                  <h2 style="color: #111827; font-size: 32px; margin: 12px 0 16px; font-weight: bold;">{{product.name}}</h2>
                  <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">{{product.description}}</p>
                  <div style="margin: 0 0 28px;">
                    <span style="color: #9ca3af; font-size: 18px; text-decoration: line-through; margin-right: 12px;">{{product.originalPrice}}</span>
                    <span style="color: {{brand.primaryColor}}; font-size: 32px; font-weight: bold;">{{product.salePrice}}</span>
                  </div>
                  <a href="{{product.url}}" style="display: inline-block; background: {{brand.primaryColor}}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Add to Cart</a>
                </td>
              </tr>
            </table>
          </div>
        `
      }
    ]
  },
  {
    id: 'content',
    name: 'Content',
    description: 'Text and media blocks',
    icon: Type,
    color: 'bg-gray-500',
    templates: [
      {
        id: 'text-block',
        name: 'Text Block',
        preview: 'text-block',
        html: `
          <div style="padding: 40px; background: white;">
            <h3 style="color: #111827; font-size: 24px; margin: 0 0 16px; font-weight: bold;">{{content.title}}</h3>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">{{content.text}}</p>
          </div>
        `
      },
      {
        id: 'image-text',
        name: 'Image + Text',
        preview: 'image-text',
        html: `
          <table width="100%" cellpadding="0" cellspacing="0" style="background: white;">
            <tr>
              <td width="50%" style="padding: 40px;">
                <img src="{{content.image}}" alt="" style="width: 100%; height: auto; border-radius: 8px;">
              </td>
              <td width="50%" style="padding: 40px;">
                <h3 style="color: #111827; font-size: 24px; margin: 0 0 16px; font-weight: bold;">{{content.title}}</h3>
                <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">{{content.text}}</p>
              </td>
            </tr>
          </table>
        `
      }
    ]
  },
  {
    id: 'features',
    name: 'Features',
    description: 'Highlight benefits',
    icon: Star,
    color: 'bg-gray-500',
    templates: [
      {
        id: 'benefits-row',
        name: 'Benefits Row',
        preview: 'benefits-row',
        html: `
          <div style="padding: 50px 40px; background: #f9fafb;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="33%" style="text-align: center; padding: 0 20px;">
                  <div style="width: 60px; height: 60px; background: {{brand.primaryColor}}20; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 24px;">✓</span>
                  </div>
                  <h4 style="color: #111827; font-size: 18px; margin: 0 0 8px; font-weight: 600;">Free Shipping</h4>
                  <p style="color: #6b7280; font-size: 14px;">On orders over $50</p>
                </td>
                <td width="33%" style="text-align: center; padding: 0 20px;">
                  <div style="width: 60px; height: 60px; background: {{brand.primaryColor}}20; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 24px;">⚡</span>
                  </div>
                  <h4 style="color: #111827; font-size: 18px; margin: 0 0 8px; font-weight: 600;">Fast Delivery</h4>
                  <p style="color: #6b7280; font-size: 14px;">2-3 business days</p>
                </td>
                <td width="33%" style="text-align: center; padding: 0 20px;">
                  <div style="width: 60px; height: 60px; background: {{brand.primaryColor}}20; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 24px;">🛡️</span>
                  </div>
                  <h4 style="color: #111827; font-size: 18px; margin: 0 0 8px; font-weight: 600;">Secure Payment</h4>
                  <p style="color: #6b7280; font-size: 14px;">SSL encrypted checkout</p>
                </td>
              </tr>
            </table>
          </div>
        `
      }
    ]
  },
  {
    id: 'social-proof',
    name: 'Social Proof',
    description: 'Trust & credibility',
    icon: Award,
    color: 'bg-gray-500',
    templates: [
      {
        id: 'testimonial',
        name: 'Customer Testimonial',
        preview: 'testimonial',
        html: `
          <div style="padding: 60px 40px; background: white; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto;">
              <div style="color: #fbbf24; font-size: 24px; margin-bottom: 24px;">★★★★★</div>
              <p style="color: #374151; font-size: 20px; line-height: 1.6; font-style: italic; margin: 0 0 24px;">"{{testimonial.text}}"</p>
              <p style="color: #111827; font-weight: 600;">— {{testimonial.author}}</p>
              <p style="color: #6b7280; font-size: 14px;">{{testimonial.title}}</p>
            </div>
          </div>
        `
      },
      {
        id: 'review-stats',
        name: 'Review Statistics',
        preview: 'review-stats',
        html: `
          <div style="padding: 40px; background: #f9fafb; text-align: center;">
            <h3 style="color: #111827; font-size: 24px; margin: 0 0 24px; font-weight: bold;">Trusted by Thousands</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 400px; margin: 0 auto;">
              <tr>
                <td width="50%" style="padding: 10px;">
                  <div style="font-size: 36px; color: {{brand.primaryColor}}; font-weight: bold;">4.9</div>
                  <div style="color: #fbbf24;">★★★★★</div>
                  <div style="color: #6b7280; font-size: 14px;">Average Rating</div>
                </td>
                <td width="50%" style="padding: 10px;">
                  <div style="font-size: 36px; color: {{brand.primaryColor}}; font-weight: bold;">10K+</div>
                  <div style="color: #6b7280; font-size: 14px; margin-top: 8px;">Happy Customers</div>
                </td>
              </tr>
            </table>
          </div>
        `
      }
    ]
  },
  {
    id: 'cta',
    name: 'Call to Action',
    description: 'Action prompts',
    icon: Zap,
    color: 'bg-gray-500',
    templates: [
      {
        id: 'cta-centered',
        name: 'Centered CTA',
        preview: 'cta-centered',
        html: `
          <div style="padding: 60px 40px; background: linear-gradient(135deg, {{brand.primaryColor}} 0%, {{brand.primaryColor}}dd 100%); text-align: center;">
            <h2 style="color: white; font-size: 32px; margin: 0 0 16px; font-weight: bold;">{{cta.title}}</h2>
            <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 0 0 32px;">{{cta.subtitle}}</p>
            <a href="{{cta.url}}" style="display: inline-block; background: white; color: {{brand.primaryColor}}; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">{{cta.buttonText}}</a>
          </div>
        `
      },
      {
        id: 'cta-urgency',
        name: 'Urgency CTA',
        preview: 'cta-urgency',
        html: `
          <div style="padding: 40px; background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; margin: 20px; text-align: center;">
            <div style="color: #92400e; font-size: 14px; font-weight: 600; text-transform: uppercase; margin-bottom: 12px;">⏰ Limited Time Only</div>
            <h3 style="color: #92400e; font-size: 28px; margin: 0 0 16px; font-weight: bold;">{{cta.title}}</h3>
            <p style="color: #92400e; font-size: 16px; margin: 0 0 24px;">{{cta.description}}</p>
            <a href="{{cta.url}}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">{{cta.buttonText}}</a>
          </div>
        `
      }
    ]
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    description: 'Shopping elements',
    icon: ShoppingCart,
    color: 'bg-gray-500',
    templates: [
      {
        id: 'cart-reminder',
        name: 'Cart Reminder',
        preview: 'cart-reminder',
        html: `
          <div style="padding: 40px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px;">
            <h3 style="color: #111827; font-size: 24px; margin: 0 0 16px; font-weight: bold;">You left something behind!</h3>
            <p style="color: #6b7280; font-size: 16px; margin: 0 0 24px;">Complete your purchase and enjoy free shipping on your order.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
              <tr>
                <td width="100px">
                  <img src="{{cart.productImage}}" alt="{{cart.productName}}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
                </td>
                <td style="padding-left: 20px;">
                  <h4 style="color: #111827; font-size: 18px; margin: 0 0 8px; font-weight: 600;">{{cart.productName}}</h4>
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">Quantity: {{cart.quantity}}</p>
                  <p style="color: {{brand.primaryColor}}; font-size: 20px; margin: 8px 0 0; font-weight: bold;">{{cart.price}}</p>
                </td>
              </tr>
            </table>
            <a href="{{cart.checkoutUrl}}" style="display: inline-block; background: {{brand.primaryColor}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">Complete Purchase</a>
          </div>
        `
      }
    ]
  },
  {
    id: 'footer',
    name: 'Footer',
    description: 'Bottom sections',
    icon: Users,
    color: 'bg-gray-500',
    templates: [
      {
        id: 'footer-simple',
        name: 'Simple Footer',
        preview: 'footer-simple',
        html: `
          <div style="padding: 40px; background: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
            <div style="margin-bottom: 24px;">
              <a href="{{brand.socialFacebook}}" style="display: inline-block; margin: 0 8px;">
                <img src="https://img.icons8.com/ios-filled/24/6b7280/facebook-new.png" alt="Facebook">
              </a>
              <a href="{{brand.socialInstagram}}" style="display: inline-block; margin: 0 8px;">
                <img src="https://img.icons8.com/ios-filled/24/6b7280/instagram-new.png" alt="Instagram">
              </a>
              <a href="{{brand.socialTwitter}}" style="display: inline-block; margin: 0 8px;">
                <img src="https://img.icons8.com/ios-filled/24/6b7280/twitter.png" alt="Twitter">
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px;">© {{year}} {{brand.name}}. All rights reserved.</p>
            <p style="color: #9ca3af; font-size: 12px;">
              <a href="{{unsubscribeUrl}}" style="color: #9ca3af;">Unsubscribe</a> | 
              <a href="{{preferencesUrl}}" style="color: #9ca3af;">Preferences</a> | 
              <a href="{{privacyUrl}}" style="color: #9ca3af;">Privacy Policy</a>
            </p>
          </div>
        `
      }
    ]
  }
];

// Template preview component
const TemplatePreview = ({ template, category }) => {
  const getPreviewContent = () => {
    switch(template.preview) {
      case 'logo-center':
        return (
          <div className="p-3 text-center border-b">
            <div className="w-24 h-6 bg-gray-300 rounded mx-auto"></div>
          </div>
        );
      case 'logo-menu':
        return (
          <div className="p-2 flex justify-between items-center border-b">
            <div className="w-16 h-4 bg-gray-300 rounded"></div>
            <div className="flex gap-2">
              <div className="w-8 h-3 bg-gray-200 rounded"></div>
              <div className="w-8 h-3 bg-gray-200 rounded"></div>
              <div className="w-8 h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
        );
      case 'logo-tagline':
        return (
          <div className="p-3 text-center border-b">
            <div className="w-20 h-5 bg-gray-300 rounded mx-auto mb-2"></div>
            <div className="w-32 h-3 bg-gray-200 rounded mx-auto"></div>
          </div>
        );
      case 'hero-centered':
        return (
          <div className="p-4 text-center bg-gradient-to-br from-violet-100 to-purple-100">
            <div className="w-32 h-4 bg-white/60 rounded mx-auto mb-2"></div>
            <div className="w-40 h-3 bg-white/40 rounded mx-auto mb-3"></div>
            <div className="w-20 h-6 bg-white rounded mx-auto"></div>
          </div>
        );
      case 'hero-split':
        return (
          <div className="flex">
            <div className="flex-1 p-3 bg-gray-50">
              <div className="w-20 h-3 bg-gray-300 rounded mb-2"></div>
              <div className="w-24 h-2 bg-gray-200 rounded mb-1"></div>
              <div className="w-16 h-2 bg-gray-200 rounded mb-2"></div>
              <div className="w-14 h-5 bg-violet-400 rounded"></div>
            </div>
            <div className="flex-1 bg-gray-200"></div>
          </div>
        );
      case 'product-grid':
        return (
          <div className="p-3">
            <div className="w-24 h-3 bg-gray-300 rounded mx-auto mb-3"></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="w-full h-12 bg-gray-200 rounded mb-1"></div>
                <div className="w-12 h-2 bg-gray-300 rounded mb-1"></div>
                <div className="w-8 h-2 bg-violet-400 rounded"></div>
              </div>
              <div>
                <div className="w-full h-12 bg-gray-200 rounded mb-1"></div>
                <div className="w-12 h-2 bg-gray-300 rounded mb-1"></div>
                <div className="w-8 h-2 bg-violet-400 rounded"></div>
              </div>
            </div>
          </div>
        );
      case 'benefits-row':
        return (
          <div className="p-3 bg-gray-50">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="w-6 h-6 bg-violet-200 rounded-full mx-auto mb-1"></div>
                <div className="w-10 h-1 bg-gray-300 rounded mx-auto"></div>
              </div>
              <div className="text-center">
                <div className="w-6 h-6 bg-violet-200 rounded-full mx-auto mb-1"></div>
                <div className="w-10 h-1 bg-gray-300 rounded mx-auto"></div>
              </div>
              <div className="text-center">
                <div className="w-6 h-6 bg-violet-200 rounded-full mx-auto mb-1"></div>
                <div className="w-10 h-1 bg-gray-300 rounded mx-auto"></div>
              </div>
            </div>
          </div>
        );
      case 'testimonial':
        return (
          <div className="p-3 text-center">
            <div className="text-yellow-400 text-xs mb-2">★★★★★</div>
            <div className="w-32 h-2 bg-gray-200 rounded mx-auto mb-1"></div>
            <div className="w-28 h-2 bg-gray-200 rounded mx-auto mb-2"></div>
            <div className="w-16 h-2 bg-gray-300 rounded mx-auto"></div>
          </div>
        );
      case 'cta-centered':
        return (
          <div className="p-4 text-center bg-gradient-to-br from-violet-100 to-purple-100">
            <div className="w-24 h-3 bg-white/60 rounded mx-auto mb-2"></div>
            <div className="w-32 h-2 bg-white/40 rounded mx-auto mb-3"></div>
            <div className="w-16 h-5 bg-white rounded mx-auto"></div>
          </div>
        );
      case 'footer-simple':
        return (
          <div className="p-3 text-center bg-gray-50 border-t">
            <div className="flex justify-center gap-2 mb-2">
              <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
              <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
              <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
            </div>
            <div className="w-24 h-2 bg-gray-200 rounded mx-auto mb-1"></div>
            <div className="w-32 h-1 bg-gray-200 rounded mx-auto"></div>
          </div>
        );
      default:
        return (
          <div className="p-4 text-center">
            <div className="w-20 h-3 bg-gray-200 rounded mx-auto mb-2"></div>
            <div className="w-24 h-2 bg-gray-200 rounded mx-auto"></div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-violet-300 hover:shadow-md transition-all cursor-pointer group">
      <div className="aspect-[16/10] bg-gray-50 relative overflow-hidden">
        {getPreviewContent()}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>
      <div className="p-3">
        <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
      </div>
    </div>
  );
};

export default function QuickAddPanelV2({ isOpen, onClose, onAddTemplate, storePublicId }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState(['header']);
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

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleAddTemplate = (template, category) => {
    let processedHtml = template.html;
    
    if (brandData) {
      // Replace brand variables
      processedHtml = processedHtml.replace(/{{brand\.(\w+)}}/g, (match, key) => {
        return brandData[key] || match;
      });
      
      // Add default values for common variables
      processedHtml = processedHtml
        .replace(/{{year}}/g, new Date().getFullYear())
        .replace(/{{unsubscribeUrl}}/g, '#unsubscribe')
        .replace(/{{preferencesUrl}}/g, '#preferences')
        .replace(/{{privacyUrl}}/g, '#privacy');
      
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

  // Filter templates based on search
  const getFilteredCategories = () => {
    if (!searchQuery) return categories;
    
    return categories.map(category => ({
      ...category,
      templates: category.templates.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(category => category.templates.length > 0);
  };

  const filteredCategories = getFilteredCategories();

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

      {/* Panel */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-gray-50 shadow-2xl z-50 transition-transform w-[480px] flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Add Section</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
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
              className="pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto">
          {filteredCategories.map((category) => (
            <div key={category.id} className="border-b border-gray-200">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full px-6 py-4 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    category.color
                  )}>
                    <category.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-xs text-gray-500">{category.description}</p>
                  </div>
                </div>
                <ChevronRight className={cn(
                  "h-4 w-4 text-gray-400 transition-transform",
                  expandedCategories.includes(category.id) && "rotate-90"
                )} />
              </button>

              {/* Category Templates */}
              {expandedCategories.includes(category.id) && (
                <div className="px-6 py-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-3">
                    {category.templates.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => handleAddTemplate(template, category)}
                      >
                        <TemplatePreview template={template} category={category} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-white px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{filteredCategories.reduce((acc, cat) => acc + cat.templates.length, 0)} templates available</span>
            {brandData && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Brand connected
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}