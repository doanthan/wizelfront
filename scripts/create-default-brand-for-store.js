/**
 * Script to create a default brand settings for a store by copying from Balmain Body
 *
 * Usage: node scripts/create-default-brand-for-store.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

import connectToDatabase from '../lib/mongoose.js';
import BrandSettings from '../models/Brand.js';
import Store from '../models/Store.js';
import mongoose from 'mongoose';

const TARGET_STORE_PUBLIC_ID = 'Pu200rg';
const SOURCE_BRAND_STORE_PUBLIC_ID = 'bz7mX3u'; // Balmain Body store

async function createDefaultBrandForStore() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();

    // Find the target store
    console.log(`Finding store with public_id: ${TARGET_STORE_PUBLIC_ID}...`);
    const targetStore = await Store.findOne({ public_id: TARGET_STORE_PUBLIC_ID });

    if (!targetStore) {
      console.error(`❌ Store with public_id ${TARGET_STORE_PUBLIC_ID} not found!`);
      process.exit(1);
    }

    console.log(`✅ Found store: ${targetStore.name} (${targetStore.public_id})`);

    // Check if store already has a default brand
    const existingBrand = await BrandSettings.findOne({
      store_public_id: TARGET_STORE_PUBLIC_ID,
      isDefault: true
    });

    if (existingBrand) {
      console.log(`⚠️  Store already has a default brand: ${existingBrand.name} (${existingBrand._id})`);
      console.log('🗑️  Deleting existing default brand...');
      await BrandSettings.findByIdAndDelete(existingBrand._id);
      console.log('✅ Existing brand deleted successfully.');
    }

    // Find the source brand (Balmain Body)
    console.log(`Finding source brand from store: ${SOURCE_BRAND_STORE_PUBLIC_ID}...`);
    const sourceBrand = await BrandSettings.findOne({
      store_public_id: SOURCE_BRAND_STORE_PUBLIC_ID,
      isDefault: true
    });

    if (!sourceBrand) {
      console.error(`❌ Source brand not found for store ${SOURCE_BRAND_STORE_PUBLIC_ID}!`);
      process.exit(1);
    }

    console.log(`✅ Found source brand: ${sourceBrand.name}`);

    // Create a copy of the brand settings
    const brandData = sourceBrand.toObject();

    // Remove fields that should not be copied
    delete brandData._id;
    delete brandData.__v;
    delete brandData.createdAt;
    delete brandData.updatedAt;
    delete brandData.lastUpdated;

    // Fix enum validation issues by mapping invalid values to valid ones or removing them
    // trustBadgeStyle: 'minimal' is invalid, change to 'multicolor' (default)
    if (brandData.trustBadgeStyle === 'minimal') {
      brandData.trustBadgeStyle = 'multicolor';
    }

    // Fix emailStrategy contentBlocks preferredTypes - remove invalid enum values
    if (brandData.emailStrategy?.contentBlocks?.preferredTypes) {
      const validTypes = ['hero-infographic', 'product-grid', 'educational-carousel',
        'model-showcase', 'comparison-chart', 'testimonial-cards',
        'how-to-steps', 'ingredient-spotlight', 'outfit-gallery',
        'tech-specs', 'social-proof', 'video-embed'];

      // Map invalid values to valid equivalents
      const typeMapping = {
        'hero-product': 'product-grid',
        'testimonial-carousel': 'testimonial-cards',
        'bundle-showcase': 'product-grid',
        'scent-education': 'educational-carousel'
      };

      brandData.emailStrategy.contentBlocks.preferredTypes =
        brandData.emailStrategy.contentBlocks.preferredTypes
          .map(type => typeMapping[type] || type)
          .filter(type => validTypes.includes(type));
    }

    // Fix brandArchetype - map invalid values to valid ones
    if (brandData.brandArchetype) {
      const validArchetypes = ['story-driven', 'visual-driven', 'value-driven', 'luxury',
        'problem-solver', 'community-driven', 'replenishment', 'seasonal', 'artisan', 'tech-innovation'];

      // Map invalid primary archetype
      const archetypeMapping = {
        'creator-rebel': 'artisan',
        'everyman': 'community-driven',
        'magician': 'problem-solver'
      };

      if (brandData.brandArchetype.primary && !validArchetypes.includes(brandData.brandArchetype.primary)) {
        brandData.brandArchetype.primary = archetypeMapping[brandData.brandArchetype.primary] || 'artisan';
      }

      // Fix secondary archetypes
      if (brandData.brandArchetype.secondary && brandData.brandArchetype.secondary.length > 0) {
        brandData.brandArchetype.secondary = brandData.brandArchetype.secondary
          .map(arch => archetypeMapping[arch] || arch)
          .filter(arch => validArchetypes.includes(arch));
      }

      // Fix detectionMethod
      const validMethods = ['auto', 'manual', 'hybrid'];
      if (brandData.brandArchetype.detectionMethod && !validMethods.includes(brandData.brandArchetype.detectionMethod)) {
        brandData.brandArchetype.detectionMethod = 'manual';
      }
    }

    // Update with target store information
    brandData.store_id = targetStore._id;
    brandData.store_public_id = targetStore.public_id;
    brandData.name = 'Default';
    brandData.brandName = targetStore.name || 'Default';
    brandData.slug = 'default';
    brandData.isDefault = true;
    brandData.isActive = true;

    // Update metadata
    const now = new Date();
    brandData.lastUpdated = now;
    brandData.scraped_at = now;
    brandData.updated_at = now;

    // Create the new brand
    console.log(`Creating default brand for ${targetStore.name}...`);
    const newBrand = await BrandSettings.create(brandData);

    console.log(`✅ Successfully created default brand!`);
    console.log(`   Brand ID: ${newBrand._id}`);
    console.log(`   Brand Name: ${newBrand.brandName}`);
    console.log(`   Store: ${targetStore.name} (${targetStore.public_id})`);
    console.log(`   Slug: ${newBrand.slug}`);

    // Display key copied settings
    console.log('\n📋 Copied Settings Summary:');
    console.log(`   Primary Color: ${newBrand.primaryColor?.[0]?.hex} (${newBrand.primaryColor?.[0]?.name})`);
    console.log(`   Secondary Colors: ${newBrand.secondaryColors?.length || 0} colors`);
    console.log(`   Logo URL: ${newBrand.logo?.primary_logo_url ? '✓' : '✗'}`);
    console.log(`   Industry Categories: ${newBrand.industryCategories?.length || 0} categories`);
    console.log(`   Customer Personas: ${newBrand.customerPersonas?.length || 0} personas`);
    console.log(`   Content Themes: ${newBrand.contentStrategy?.contentThemes?.length || 0} themes`);
    console.log(`   Competitors: ${newBrand.competitors?.length || 0} competitors`);
    console.log(`   Trust Badges: ${newBrand.trustBadges?.length || 0} badges`);
    console.log(`   Header Links: ${newBrand.headerLinks?.length || 0} links`);
    console.log(`   Social Links: ${newBrand.socialLinks?.length || 0} links`);

    console.log('\n✅ Script completed successfully!');

  } catch (error) {
    console.error('❌ Error creating default brand:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run the script
createDefaultBrandForStore();