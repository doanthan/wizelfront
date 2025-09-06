"use client";

import { useState, useEffect, useRef } from "react";
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
  Mail,
  Image,
  Gift,
  Megaphone
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
            <h1 style="color: white; font-size: 42px; margin: 0 0 20px; font-weight: bold;">Welcome to {{brand.name}}</h1>
            <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 0 0 35px; max-width: 600px; margin-left: auto; margin-right: auto;">Discover amazing products and exclusive offers</p>
            <a href="{{brand.websiteUrl}}" style="display: inline-block; background: white; color: {{brand.primaryColor}}; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Shop Now</a>
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
                <h2 style="color: #111827; font-size: 36px; margin: 0 0 20px; font-weight: bold;">New Collection</h2>
                <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Explore our latest arrivals and find your perfect style</p>
                <a href="{{brand.websiteUrl}}" style="display: inline-block; background: {{brand.primaryColor}}; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Explore Now</a>
              </td>
              <td width="50%">
                <img src="https://via.placeholder.com/600x400" alt="Hero Image" style="width: 100%; height: auto; display: block;">
              </td>
            </tr>
          </table>
        `
      },
      {
        id: 'hero-image-overlay',
        name: 'Image with Overlay',
        preview: 'hero-overlay',
        html: `
          <div style="position: relative; background: url('https://via.placeholder.com/1200x500') center/cover; height: 400px;">
            <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
              <div style="text-align: center; color: white; padding: 20px;">
                <h1 style="font-size: 48px; margin: 0 0 20px;">{{brand.name}}</h1>
                <p style="font-size: 20px; margin: 0 0 30px;">{{brand.tagline}}</p>
                <a href="{{brand.websiteUrl}}" style="background: {{brand.primaryColor}}; color: white; padding: 15px 35px; text-decoration: none; border-radius: 5px; font-weight: 600;">Discover More</a>
              </div>
            </div>
          </div>
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
        id: 'product-grid-2',
        name: '2 Column Grid',
        preview: 'product-grid',
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
        `
      },
      {
        id: 'product-grid-3',
        name: '3 Column Grid',
        preview: 'product-grid-3',
        html: `
          <div style="padding: 60px 40px; background: white;">
            <h2 style="text-align: center; color: #111827; font-size: 32px; margin: 0 0 40px; font-weight: bold;">Best Sellers</h2>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="33%" style="padding: 0 10px; text-align: center;">
                  <img src="https://via.placeholder.com/200x200" alt="Product" style="width: 100%; height: auto; border-radius: 8px;">
                  <h4 style="color: #111827; font-size: 16px; margin: 12px 0 8px;">Product Name</h4>
                  <p style="color: {{brand.primaryColor}}; font-size: 20px; font-weight: bold;">$59.99</p>
                </td>
                <td width="33%" style="padding: 0 10px; text-align: center;">
                  <img src="https://via.placeholder.com/200x200" alt="Product" style="width: 100%; height: auto; border-radius: 8px;">
                  <h4 style="color: #111827; font-size: 16px; margin: 12px 0 8px;">Product Name</h4>
                  <p style="color: {{brand.primaryColor}}; font-size: 20px; font-weight: bold;">$69.99</p>
                </td>
                <td width="33%" style="padding: 0 10px; text-align: center;">
                  <img src="https://via.placeholder.com/200x200" alt="Product" style="width: 100%; height: auto; border-radius: 8px;">
                  <h4 style="color: #111827; font-size: 16px; margin: 12px 0 8px;">Product Name</h4>
                  <p style="color: {{brand.primaryColor}}; font-size: 20px; font-weight: bold;">$49.99</p>
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
                  <img src="https://via.placeholder.com/400x400" alt="Product" style="width: 100%; height: auto; border-radius: 12px;">
                </td>
                <td width="60%">
                  <span style="color: {{brand.primaryColor}}; font-size: 14px; font-weight: 600; text-transform: uppercase;">New Arrival</span>
                  <h2 style="color: #111827; font-size: 32px; margin: 12px 0 16px; font-weight: bold;">Premium Product</h2>
                  <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">Experience the perfect blend of quality and style with our latest addition.</p>
                  <div style="margin: 0 0 28px;">
                    <span style="color: #9ca3af; font-size: 18px; text-decoration: line-through; margin-right: 12px;">$149.99</span>
                    <span style="color: {{brand.primaryColor}}; font-size: 32px; font-weight: bold;">$99.99</span>
                  </div>
                  <a href="#" style="display: inline-block; background: {{brand.primaryColor}}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Add to Cart</a>
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
            <h3 style="color: #111827; font-size: 24px; margin: 0 0 16px; font-weight: bold;">About {{brand.name}}</h3>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">{{brand.missionStatement}}</p>
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
                <img src="https://via.placeholder.com/400x300" alt="Content" style="width: 100%; height: auto; border-radius: 8px;">
              </td>
              <td width="50%" style="padding: 40px;">
                <h3 style="color: #111827; font-size: 24px; margin: 0 0 16px; font-weight: bold;">Our Story</h3>
                <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Discover the journey behind {{brand.name}} and our commitment to excellence.</p>
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
              <p style="color: #374151; font-size: 20px; line-height: 1.6; font-style: italic; margin: 0 0 24px;">"Amazing products and exceptional service! Highly recommend {{brand.name}}."</p>
              <p style="color: #111827; font-weight: 600;">— Sarah Johnson</p>
              <p style="color: #6b7280; font-size: 14px;">Verified Customer</p>
            </div>
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
            <h2 style="color: white; font-size: 32px; margin: 0 0 16px; font-weight: bold;">Ready to Get Started?</h2>
            <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 0 0 32px;">Join thousands of satisfied customers</p>
            <a href="{{brand.websiteUrl}}" style="display: inline-block; background: white; color: {{brand.primaryColor}}; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Shop Now</a>
          </div>
        `
      },
      {
        id: 'cta-sale',
        name: 'Sale CTA',
        preview: 'cta-sale',
        html: `
          <div style="padding: 40px; background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; margin: 20px; text-align: center;">
            <div style="color: #92400e; font-size: 14px; font-weight: 600; text-transform: uppercase; margin-bottom: 12px;">⏰ Limited Time Only</div>
            <h3 style="color: #92400e; font-size: 28px; margin: 0 0 16px; font-weight: bold;">Save 30% Today!</h3>
            <p style="color: #92400e; font-size: 16px; margin: 0 0 24px;">Use code SAVE30 at checkout</p>
            <a href="{{brand.websiteUrl}}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">Shop Now</a>
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
            <p style="color: #6b7280; font-size: 16px; margin: 0 0 24px;">Complete your purchase and enjoy free shipping.</p>
            <a href="#" style="display: inline-block; background: {{brand.primaryColor}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">Complete Purchase</a>
          </div>
        `
      }
    ]
  },
  {
    id: 'footer',
    name: 'Footer',
    description: 'Bottom sections',
    icon: Mail,
    color: 'bg-gray-500',
    templates: [
      {
        id: 'footer-simple',
        name: 'Simple Footer',
        preview: 'footer-simple',
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
              <a href="#" style="color: #9ca3af;">Preferences</a> | 
              <a href="#" style="color: #9ca3af;">Privacy Policy</a>
            </p>
          </div>
        `
      }
    ]
  }
];

// Template preview component
const TemplatePreview = ({ template }) => {
  const getPreviewContent = () => {
    switch(template.preview) {
      case 'logo-center':
        return (
          <div className="p-4 text-center border-b bg-white">
            <div className="w-28 h-8 bg-gradient-to-r from-amber-400 to-amber-500 rounded mx-auto"></div>
          </div>
        );
      case 'logo-menu':
        return (
          <div className="p-3 flex justify-between items-center border-b bg-white">
            <div className="w-20 h-6 bg-gradient-to-r from-amber-400 to-amber-500 rounded"></div>
            <div className="flex gap-2">
              <div className="w-10 h-3 bg-gray-300 rounded"></div>
              <div className="w-10 h-3 bg-gray-300 rounded"></div>
              <div className="w-10 h-3 bg-gray-300 rounded"></div>
            </div>
          </div>
        );
      case 'logo-tagline':
        return (
          <div className="p-4 text-center border-b bg-white">
            <div className="w-24 h-7 bg-gradient-to-r from-amber-400 to-amber-500 rounded mx-auto mb-2"></div>
            <div className="w-36 h-3 bg-gray-300 rounded mx-auto"></div>
          </div>
        );
      case 'hero-centered':
        return (
          <div className="p-6 text-center bg-gradient-to-br from-violet-500 to-purple-600">
            <div className="w-36 h-4 bg-white/80 rounded mx-auto mb-2"></div>
            <div className="w-44 h-3 bg-white/60 rounded mx-auto mb-3"></div>
            <div className="w-24 h-7 bg-white rounded-md mx-auto"></div>
          </div>
        );
      case 'hero-split':
        return (
          <div className="flex h-24">
            <div className="flex-1 p-4 bg-gray-50">
              <div className="w-24 h-3 bg-gray-800 rounded mb-2"></div>
              <div className="w-28 h-2 bg-gray-400 rounded mb-1"></div>
              <div className="w-20 h-2 bg-gray-400 rounded mb-3"></div>
              <div className="w-16 h-6 bg-violet-500 rounded"></div>
            </div>
            <div className="flex-1 bg-gradient-to-br from-gray-200 to-gray-300"></div>
          </div>
        );
      case 'hero-overlay':
        return (
          <div className="relative h-24 bg-gradient-to-br from-gray-600 to-gray-700">
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-3 bg-white/90 rounded mx-auto mb-1"></div>
                <div className="w-28 h-2 bg-white/70 rounded mx-auto mb-2"></div>
                <div className="w-16 h-5 bg-violet-500 rounded mx-auto"></div>
              </div>
            </div>
          </div>
        );
      case 'product-grid':
      case 'product-grid-3':
        return (
          <div className="p-4 bg-white">
            <div className="w-28 h-3 bg-gray-800 rounded mx-auto mb-3"></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="w-full h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded mb-2"></div>
                <div className="w-14 h-2 bg-gray-600 rounded mb-1"></div>
                <div className="w-10 h-3 bg-violet-500 rounded"></div>
              </div>
              <div>
                <div className="w-full h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded mb-2"></div>
                <div className="w-14 h-2 bg-gray-600 rounded mb-1"></div>
                <div className="w-10 h-3 bg-violet-500 rounded"></div>
              </div>
            </div>
          </div>
        );
      case 'product-spotlight':
        return (
          <div className="flex p-3 bg-gray-50">
            <div className="w-1/3 h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded mr-3"></div>
            <div className="flex-1">
              <div className="w-12 h-2 bg-violet-500 rounded mb-1"></div>
              <div className="w-20 h-3 bg-gray-800 rounded mb-2"></div>
              <div className="w-24 h-2 bg-gray-400 rounded mb-1"></div>
              <div className="w-20 h-2 bg-gray-400 rounded mb-2"></div>
              <div className="w-16 h-5 bg-violet-500 rounded"></div>
            </div>
          </div>
        );
      case 'benefits-row':
        return (
          <div className="p-4 bg-gray-50">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="text-center">
                  <div className="w-8 h-8 bg-violet-200 rounded-full mx-auto mb-1"></div>
                  <div className="w-12 h-2 bg-gray-600 rounded mx-auto mb-1"></div>
                  <div className="w-10 h-1 bg-gray-400 rounded mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'testimonial':
        return (
          <div className="p-4 text-center bg-white">
            <div className="text-yellow-400 text-sm mb-2">★★★★★</div>
            <div className="w-36 h-2 bg-gray-300 rounded mx-auto mb-1"></div>
            <div className="w-32 h-2 bg-gray-300 rounded mx-auto mb-2"></div>
            <div className="w-20 h-2 bg-gray-600 rounded mx-auto"></div>
          </div>
        );
      case 'cta-centered':
        return (
          <div className="p-5 text-center bg-gradient-to-br from-violet-500 to-purple-600">
            <div className="w-28 h-3 bg-white/80 rounded mx-auto mb-2"></div>
            <div className="w-36 h-2 bg-white/60 rounded mx-auto mb-3"></div>
            <div className="w-20 h-6 bg-white rounded mx-auto"></div>
          </div>
        );
      case 'cta-sale':
        return (
          <div className="p-4 text-center bg-amber-50 border-2 border-amber-400">
            <div className="w-20 h-2 bg-amber-600 rounded mx-auto mb-2"></div>
            <div className="w-28 h-3 bg-amber-700 rounded mx-auto mb-2"></div>
            <div className="w-32 h-2 bg-amber-600 rounded mx-auto mb-3"></div>
            <div className="w-18 h-6 bg-amber-500 rounded mx-auto"></div>
          </div>
        );
      case 'footer-simple':
        return (
          <div className="p-4 text-center bg-gray-50 border-t">
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-5 h-5 bg-gray-400 rounded-full"></div>
              ))}
            </div>
            <div className="w-28 h-2 bg-gray-400 rounded mx-auto mb-1"></div>
            <div className="w-36 h-1 bg-gray-300 rounded mx-auto"></div>
          </div>
        );
      default:
        return (
          <div className="p-4 text-center bg-white">
            <div className="w-24 h-3 bg-gray-300 rounded mx-auto mb-2"></div>
            <div className="w-32 h-2 bg-gray-300 rounded mx-auto"></div>
          </div>
        );
    }
  };

  return getPreviewContent();
};

// Hover popup component
const CategoryHoverPopup = ({ category, isVisible, position, onSelectTemplate }) => {
  if (!isVisible) return null;

  return (
    <div 
      className="fixed z-[60] bg-white rounded-lg shadow-2xl border border-gray-200 p-1 w-[500px]"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        pointerEvents: 'auto'
      }}
    >
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {category.templates.map((template) => (
            <div
              key={template.id}
              onClick={() => onSelectTemplate(template, category)}
              className="cursor-pointer group"
            >
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-violet-400 hover:shadow-lg transition-all">
                <div className="aspect-[16/10] bg-gray-50 relative overflow-hidden">
                  <TemplatePreview template={template} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="p-3 bg-white">
                  <h4 className="text-sm font-medium text-gray-900 group-hover:text-violet-600 transition-colors">
                    {template.name}
                  </h4>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function QuickAddPanelV3({ isOpen, onClose, onAddTemplate, storePublicId }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [brandData, setBrandData] = useState(null);
  const [isLoadingBrand, setIsLoadingBrand] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [showPopup, setShowPopup] = useState(false);
  
  const hoverTimeoutRef = useRef(null);
  const leaveTimeoutRef = useRef(null);
  const panelRef = useRef(null);

  // Smart hover delay (300ms to show, 100ms to hide)
  const handleCategoryMouseEnter = (category, event) => {
    // Clear any existing leave timeout
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    // Set hover timeout for smart delay
    hoverTimeoutRef.current = setTimeout(() => {
      const rect = event.currentTarget.getBoundingClientRect();
      const panelRect = panelRef.current?.getBoundingClientRect();
      
      setPopupPosition({
        x: (panelRect?.right || rect.right) + 8,
        y: rect.top
      });
      setHoveredCategory(category);
      setShowPopup(true);
    }, 300); // 300ms delay before showing
  };

  const handleCategoryMouseLeave = () => {
    // Clear hover timeout if we leave before it triggers
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Set leave timeout for smart hiding
    leaveTimeoutRef.current = setTimeout(() => {
      setShowPopup(false);
      setHoveredCategory(null);
    }, 100); // 100ms delay before hiding
  };

  const handlePopupMouseEnter = () => {
    // Clear leave timeout when entering popup
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  };

  const handlePopupMouseLeave = () => {
    // Hide popup when leaving it
    setShowPopup(false);
    setHoveredCategory(null);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    };
  }, []);

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

    // Close popup after adding
    setShowPopup(false);
    setHoveredCategory(null);
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
      <div 
        ref={panelRef}
        className={cn(
          "fixed left-0 top-0 h-full bg-white shadow-2xl z-50 transition-transform w-[400px] flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Quick Add</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-200"
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
              className="pl-10 h-10 bg-white border-gray-300"
            />
          </div>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {filteredCategories.map((category, index) => (
            <div 
              key={category.id}
              className={cn(
                "border-b border-gray-200",
                index === 0 && "border-t border-gray-200"
              )}
            >
              <button
                onMouseEnter={(e) => handleCategoryMouseEnter(category, e)}
                onMouseLeave={handleCategoryMouseLeave}
                className={cn(
                  "w-full px-6 py-4 bg-white hover:bg-violet-50 transition-all flex items-center justify-between group",
                  hoveredCategory?.id === category.id && "bg-violet-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                    hoveredCategory?.id === category.id ? "bg-violet-500" : category.color
                  )}>
                    <category.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-xs text-gray-500">{category.description}</p>
                  </div>
                </div>
                <ChevronRight className={cn(
                  "h-4 w-4 text-gray-400 transition-all",
                  hoveredCategory?.id === category.id && "text-violet-600 translate-x-1"
                )} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-white px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{filteredCategories.reduce((acc, cat) => acc + cat.templates.length, 0)} templates</span>
            {brandData && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Brand: {brandData.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hover Popup */}
      {showPopup && hoveredCategory && (
        <div
          onMouseEnter={handlePopupMouseEnter}
          onMouseLeave={handlePopupMouseLeave}
        >
          <CategoryHoverPopup
            category={hoveredCategory}
            isVisible={showPopup}
            position={popupPosition}
            onSelectTemplate={handleAddTemplate}
          />
        </div>
      )}
    </>
  );
}