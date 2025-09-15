import { NextResponse } from 'next/server';
import Store from '@/models/Store';
import User from '@/models/User';
import Contract from '@/models/Contract';
import ContractSeat from '@/models/ContractSeat';
import Role from '@/models/Role';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import connectToDatabase from '@/lib/mongoose';
// import Stripe from 'stripe';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//   apiVersion: '2023-10-16',
// });

export async function POST(request) {
  try {
    // Ensure mongoose connection
    await connectToDatabase();
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Session user ID:', session.user.id);
    console.log('Session user email:', session.user.email);

    const body = await request.json();
    const { name, url, platform, timezone, currency, industry } = body;

    // Validate required fields
    if (!name || !url) {
      return NextResponse.json(
        { error: 'Store name and URL are required' },
        { status: 400 }
      );
    }

    // Get or create user's primary contract
    let userContract;
    const user = await User.findById(session.user.id);
    
    if (!user) {
      console.error('User not found for ID:', session.user.id);
      return NextResponse.json(
        { error: 'User account not found. Please log out and log in again.' },
        { status: 404 }
      );
    }
    
    if (user.primary_contract_id) {
      // Use existing contract
      userContract = await Contract.findById(user.primary_contract_id);
    } else {
      // Create new contract (without Stripe for now)
      // const stripeCustomer = await stripe.customers.create({
      //   email: session.user.email,
      //   name: session.user.name,
      //   metadata: {
      //     user_id: session.user.id,
      //   },
      // });

      // Create contract
      userContract = new Contract({
        contract_name: `${session.user.name}'s Contract`,
        billing_email: session.user.email,
        owner_id: session.user.id,
        billing_contact_id: session.user.id,
        stripe_customer_id: 'test_customer_' + Date.now(), // Temporary ID for testing
        status: 'active'
      });
      
      await userContract.save();

      // Set as user's primary contract
      user.primary_contract_id = userContract._id;
      await user.save();
    }

    // Check if a store with the same name already exists in this contract (excluding deleted stores)
    const existingStore = await Store.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }, // Case-insensitive match
      contract_id: userContract._id,
      is_deleted: { $ne: true } // Exclude soft-deleted stores
    });
    if (existingStore) {
      return NextResponse.json(
        { error: `A store named "${name}" already exists in your contract. Please choose a different name.` },
        { status: 400 }
      );
    }

    // Check if contract has reached store limit and increment count
    try {
      await userContract.incrementStoreCount();
    } catch (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Create subscription with 14-day trial (commented out for testing)
    // const subscription = await stripe.subscriptions.create({
    //   customer: userContract.stripe_customer_id,
    //   items: [
    //     {
    //       price: process.env.STRIPE_STORE_PRICE_ID || 'price_store_monthly', // $29/month price ID
    //     },
    //   ],
    //   trial_period_days: 14,
    //   metadata: {
    //     store_name: name,
    //     store_url: url,
    //   },
    //   payment_behavior: 'default_incomplete',
    //   payment_settings: { save_default_payment_method: 'on_subscription' },
    //   expand: ['latest_invoice.payment_intent'],
    // });

    // Mock subscription for testing
    const subscription = {
      id: 'test_sub_' + Date.now(),
      status: 'trialing',
      latest_invoice: null,
    };

    // Calculate trial end date
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Create store in database using Mongoose model
    const store = new Store({
      name,
      url,
      shopify_domain: platform === 'shopify' ? url : null,
      owner_id: new ObjectId(session.user.id),
      contract_id: userContract._id,
      billing_email: session.user.email,
      stripe_customer_id: userContract.stripe_customer_id,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_tier: 'pro',
      trial_ends_at: trialEndsAt,
      timezone: timezone || 'America/New_York',
      currency: currency || 'USD',
      industry: industry || null,
      // The public_id will be automatically generated by the pre-save hook
    });

    await store.save();

    // Create default brand for the store
    let defaultBrand;
    try {
      const BrandSettings = (await import('@/models/Brand')).default;
      defaultBrand = new BrandSettings({
        store_id: store._id,
        store_public_id: store.public_id,
        name: 'Default',
        brandName: 'Default',
        slug: 'default',
        isDefault: true,
        isActive: true,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        // Set some default values
        primaryColor: [{ hex: '#60A5FA', name: 'Sky Blue' }],
        secondaryColors: [{ hex: '#8B5CF6', name: 'Vivid Violet' }],
        buttonBackgroundColor: '#60A5FA',
        buttonTextColor: '#FFFFFF',
        emailFallbackFont: 'Arial',
        brandTagline: 'Welcome to our store',
        missionStatement: 'To provide exceptional products and service'
      });
      await defaultBrand.save();
      console.log('Default brand created for store:', store.name);
    } catch (brandError) {
      console.error('Failed to create default brand:', brandError);
      // Don't fail the store creation if brand creation fails
    }

    // Call scrape server to start scraping the store
    if (process.env.SCRAPE_SERVER) {
      try {
        // Extract domain from URL
        let domain = url;
        if (domain.startsWith('http://') || domain.startsWith('https://')) {
          domain = new URL(url).hostname;
        }
        
        const scrapePayload = {
          domain: domain,
          store_id: store._id.toString(),
          store_public_id: store.public_id,
          brand_settings_id: defaultBrand?._id?.toString() || null,
          extract_css: true,
          generate_email: false
        };
        
        console.log('Calling scrape server with payload:', scrapePayload);
        
        const scrapeResponse = await fetch(`${process.env.SCRAPE_SERVER}/api/v1/scrape`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(scrapePayload)
        });
        
        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          console.log('Scrape job initiated:', scrapeData);
          
          // Save the job_id and set status to the store for tracking
          if (scrapeData.job_id) {
            store.scrape_job_id = scrapeData.job_id;
            store.scrape_status = 'pending';
            await store.save();
          }
        } else {
          console.error('Failed to initiate scrape:', scrapeResponse.status, await scrapeResponse.text());
          store.scrape_status = 'failed';
          await store.save();
        }
      } catch (scrapeError) {
        console.error('Error calling scrape server:', scrapeError);
        // Don't fail store creation if scrape fails
      }
    }

    // Grant the user owner permissions for this store using new ContractSeat system
    try {
      // Get or create owner role
      const ownerRole = await Role.findByName('owner');
      if (!ownerRole) {
        throw new Error('Owner role not found. Run migration script first.');
      }
      
      // Find or create user's seat for this contract
      let seat = await ContractSeat.findOne({
        user_id: session.user.id,
        contract_id: userContract._id
      });
      
      if (!seat) {
        // Create new seat for the user
        seat = new ContractSeat({
          contract_id: userContract._id,
          user_id: session.user.id,
          seat_type: 'included',
          default_role_id: ownerRole._id,
          invited_by: session.user.id,
          status: 'active'
        });
        await seat.save();
        
        // Update user's active_seats
        const storeOwner = await User.findById(session.user.id);
        if (storeOwner) {
          storeOwner.addSeat(userContract._id, userContract.contract_name || userContract.name, seat._id);
          await storeOwner.save();
        }
      }
      
      // Grant store access with owner role
      seat.grantStoreAccess(store._id, ownerRole._id, session.user.id);
      await seat.save();
      
      // Sync store team members
      await store.syncTeamMembers();
      
    } catch (permError) {
      console.error('Failed to add store permissions via ContractSeat:', permError);
      
      // Fall back to legacy system
      try {
        const storeOwner = await User.findById(session.user.id);
        if (storeOwner) {
          storeOwner.store_permissions.push({
            store_id: store._id,
            role: 'owner',
            permissions_v2: ['*:*'], // All permissions
            granted_by: new ObjectId(session.user.id),
            granted_at: new Date()
          });
          await storeOwner.save();
        }
      } catch (legacyError) {
        console.error('Legacy permission assignment also failed:', legacyError);
        // Store was created successfully, just permission assignment failed
        // Continue anyway
      }
    }

    // Return store data with client secret for payment setup
    const response = {
      store: {
        id: store._id,
        public_id: store.public_id, // Include the nanoid
        name: store.name,
        url: store.url,
        platform: store.platform,
        subscription_status: store.subscription_status,
        trial_ends_at: store.trial_ends_at,
      },
      subscription: {
        id: subscription.id,
        status: subscription.status,
        trial_end: subscription.trial_end,
        client_secret: subscription.latest_invoice?.payment_intent?.client_secret,
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Store creation error:', error);

    return NextResponse.json(
      { error: 'Failed to create store' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Ensure mongoose connection
    await connectToDatabase();
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Fetching stores for user:', session.user.id);

    // Get user details to check if they're a super admin
    const user = await User.findById(session.user.id);
    const isSuperAdmin = user?.is_super_user || user?.super_user_role === 'SUPER_ADMIN';
    console.log('User is super admin:', isSuperAdmin);
    
    let stores;
    if (isSuperAdmin) {
      // Super admin can see all non-deleted stores
      stores = await Store.find({ is_deleted: { $ne: true } }).lean();
      console.log('Super admin - found stores:', stores.length);
    } else {
      // Regular users see stores via ContractSeats or legacy access
      try {
        // First try new ContractSeat system
        const contractSeatStores = await Store.findByUserSeats(session.user.id);
        
        // Also get legacy stores for backward compatibility
        const legacyStores = await Store.findByUser(session.user.id).lean();
        
        // Combine and deduplicate
        const storeMap = new Map();
        
        [...contractSeatStores, ...legacyStores].forEach(store => {
          storeMap.set(store._id.toString(), store);
        });
        
        stores = Array.from(storeMap.values());
        console.log('User stores found (ContractSeat + Legacy):', stores.length);
      } catch (error) {
        console.error('Error fetching user stores:', error);
        // Fall back to legacy system only
        stores = await Store.findByUser(session.user.id).lean();
        console.log('User stores found (Legacy fallback):', stores.length);
      }
    }

    console.log('Returning stores:', stores?.length || 0);
    return NextResponse.json({ stores: stores || [] });
  } catch (error) {
    console.error('Failed to fetch stores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stores' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    // Ensure mongoose connection
    await connectToDatabase();
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('id');

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      );
    }

    // Verify store ownership or appropriate permissions
    const store = await Store.findById(storeId);
    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this store
    const user = await User.findById(session.user.id);
    const isSuperAdmin = user?.is_super_user || user?.super_user_role === 'SUPER_ADMIN';
    
    let canDelete = isSuperAdmin || store.owner_id.toString() === session.user.id;
    
    // If not super admin or owner, check via ContractSeat system
    if (!canDelete) {
      try {
        const seat = await ContractSeat.findOne({
          user_id: session.user.id,
          contract_id: store.contract_id,
          status: 'active'
        }).populate('default_role_id');
        
        if (seat) {
          // Check if user has store-specific access or default access
          const storeAccess = seat.store_access.find(access => 
            access.store_id.toString() === storeId
          );
          
          const roleToCheck = storeAccess ? 
            await Role.findById(storeAccess.role_id) : 
            seat.default_role_id;
          
          // Only owner and admin roles can delete stores
          canDelete = roleToCheck && 
            roleToCheck.permissions?.stores?.delete === true;
        }
      } catch (error) {
        console.error('Error checking delete permissions:', error);
      }
    }
    
    if (!canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this store' },
        { status: 403 }
      );
    }

    // Cancel Stripe subscription if exists (commented out for testing)
    // if (store.stripe_subscription_id) {
    //   try {
    //     await stripe.subscriptions.cancel(store.stripe_subscription_id);
    //   } catch (stripeError) {
    //     console.error('Failed to cancel Stripe subscription:', stripeError);
    //   }
    // }

    // Soft delete all brands associated with this store
    const BrandSettings = (await import('@/models/Brand')).default;
    await BrandSettings.updateMany(
      { store_id: store._id },
      { isActive: false, isDeleted: true }
    );
    console.log(`Soft deleted all brands for store ${storeId}`);
    
    // Remove store access from all ContractSeats
    await ContractSeat.updateMany(
      { 'store_access.store_id': store._id },
      { $pull: { store_access: { store_id: store._id } } }
    );
    
    // Remove store from all users' store_permissions (legacy)
    await User.updateMany(
      { 'store_permissions.store_id': store._id },
      { $pull: { store_permissions: { store_id: store._id } } }
    );
    
    // Also remove from legacy stores array
    await User.updateMany(
      { 'stores.store_id': store._id },
      { $pull: { stores: { store_id: store._id } } }
    );
    
    // Decrement store count in contract
    if (store.contract_id) {
      const contract = await Contract.findById(store.contract_id);
      if (contract) {
        await contract.decrementStoreCount();
      }
    }

    // Soft delete the store - mark as deleted but keep in database
    store.isActive = false;
    store.is_deleted = true;
    store.deletedAt = new Date();
    store.deletedBy = session.user.id;
    await store.save();

    console.log(`Store ${storeId} soft deleted, removed from all user permissions`);

    return NextResponse.json({ 
      message: 'Store deleted successfully',
      storeId: storeId 
    });
  } catch (error) {
    console.error('Failed to delete store:', error);
    return NextResponse.json(
      { error: 'Failed to delete store' },
      { status: 500 }
    );
  }
}