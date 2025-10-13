/**
 * Quick Add Components Index
 *
 * This file imports and exports all Quick Add components,
 * organized by category.
 */

// Import headers
import logoNav from './headers/logo-nav';
import centeredLogo from './headers/centered-logo';

// Import heroes
import heroImage from './heroes/hero-image';
import threeColumn from './heroes/three-column';
import iconList from './heroes/icon-list';

// Import content
import imageText from './content/image-text';
import twoColumnArticle from './content/two-column-article';
import textBlock from './content/text-block';

// Import CTA
import centeredButton from './cta/centered-button';
import banner from './cta/banner';
import twoButton from './cta/two-button';

// Import products
import productCard from './products/product-card';
import threeProducts from './products/three-products';
import discountBadge from './products/discount-badge';

// Import footers
import socialLinks from './footers/social-links';
import companyInfo from './footers/company-info';
import minimal from './footers/minimal';

// Import transactional
import orderConfirm from './transactional/order-confirm';
import shipping from './transactional/shipping';
import receipt from './transactional/receipt';

/**
 * All components organized by category
 */
export const componentsByCategory = {
  header: [
    logoNav,
    centeredLogo,
  ],
  hero: [
    heroImage,
    threeColumn,
    iconList,
  ],
  content: [
    imageText,
    twoColumnArticle,
    textBlock,
  ],
  cta: [
    centeredButton,
    banner,
    twoButton,
  ],
  product: [
    productCard,
    threeProducts,
    discountBadge,
  ],
  footer: [
    socialLinks,
    companyInfo,
    minimal,
  ],
  transactional: [
    orderConfirm,
    shipping,
    receipt,
  ],
  social: [
    // Future: Add social components here
  ],
  testimonial: [
    // Future: Add testimonial components here
  ],
};

/**
 * Get all components with brand data applied
 * @param {Object} brandData - The brand configuration object
 * @returns {Array} Array of all components with their blocks generated
 */
export function getAllComponents(brandData) {
  const allComponents = [];

  Object.keys(componentsByCategory).forEach(category => {
    componentsByCategory[category].forEach(component => {
      allComponents.push({
        ...component,
        blocks: component.generateBlocks(brandData),
      });
    });
  });

  return allComponents;
}

/**
 * Get components for a specific category
 * @param {string} category - The category name
 * @param {Object} brandData - The brand configuration object
 * @returns {Array} Array of components in the category
 */
export function getComponentsByCategory(category, brandData) {
  const components = componentsByCategory[category] || [];

  return components.map(component => ({
    ...component,
    blocks: component.generateBlocks(brandData),
  }));
}

/**
 * Get a single component by ID
 * @param {string} id - The component ID
 * @param {Object} brandData - The brand configuration object
 * @returns {Object|null} The component or null if not found
 */
export function getComponentById(id, brandData) {
  for (const category in componentsByCategory) {
    const component = componentsByCategory[category].find(c => c.id === id);
    if (component) {
      return {
        ...component,
        blocks: component.generateBlocks(brandData),
      };
    }
  }
  return null;
}

/**
 * Get all category information with components (for QuickAddModal)
 * Compatible with the existing quickAddCategories structure
 */
export function getQuickAddCategories(brandData = {}) {
  return [
    {
      id: "header",
      title: "Header",
      description: "Top section elements",
      components: getComponentsByCategory("header", brandData)
    },
    {
      id: "hero",
      title: "Feature",
      description: "Highlight key features",
      components: getComponentsByCategory("hero", brandData)
    },
    {
      id: "content",
      title: "Content",
      description: "Articles and text blocks",
      components: getComponentsByCategory("content", brandData)
    },
    {
      id: "cta",
      title: "Call to Action",
      description: "Drive conversions",
      components: getComponentsByCategory("cta", brandData)
    },
    {
      id: "product",
      title: "E-Commerce",
      description: "Products and pricing",
      components: getComponentsByCategory("product", brandData)
    },
    {
      id: "transactional",
      title: "Transactional",
      description: "Orders and receipts",
      components: getComponentsByCategory("transactional", brandData)
    },
    {
      id: "footer",
      title: "Footer",
      description: "Bottom section elements",
      components: getComponentsByCategory("footer", brandData)
    },
  ];
}

// Import icons from constants for category display
import {
  Heading1,
  Sparkles,
  FileText,
  Target,
  ShoppingCart,
  CreditCard,
  Layers
} from "lucide-react";

/**
 * Category metadata with icons
 */
export const categoryMetadata = {
  header: { icon: Heading1 },
  hero: { icon: Sparkles },
  content: { icon: FileText },
  cta: { icon: Target },
  product: { icon: ShoppingCart },
  transactional: { icon: CreditCard },
  footer: { icon: Layers },
};

/**
 * Get all category information with icons (enhanced version)
 */
export function getQuickAddCategoriesWithIcons(brandData = {}) {
  return [
    {
      id: "header",
      title: "Header",
      description: "Top section elements",
      icon: Heading1,
      components: getComponentsByCategory("header", brandData)
    },
    {
      id: "hero",
      title: "Feature",
      description: "Highlight key features",
      icon: Sparkles,
      components: getComponentsByCategory("hero", brandData)
    },
    {
      id: "content",
      title: "Content",
      description: "Articles and text blocks",
      icon: FileText,
      components: getComponentsByCategory("content", brandData)
    },
    {
      id: "cta",
      title: "Call to Action",
      description: "Drive conversions",
      icon: Target,
      components: getComponentsByCategory("cta", brandData)
    },
    {
      id: "product",
      title: "E-Commerce",
      description: "Products and pricing",
      icon: ShoppingCart,
      components: getComponentsByCategory("product", brandData)
    },
    {
      id: "transactional",
      title: "Transactional",
      description: "Orders and receipts",
      icon: CreditCard,
      components: getComponentsByCategory("transactional", brandData)
    },
    {
      id: "footer",
      title: "Footer",
      description: "Bottom section elements",
      icon: Layers,
      components: getComponentsByCategory("footer", brandData)
    },
  ];
}
