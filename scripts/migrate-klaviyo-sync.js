import mongoose from 'mongoose';
import Store from '../models/Store.js';
import KlaviyoSync from '../models/KlaviyoSync.js';
import connectToDatabase from '../lib/mongoose.js';

async function migrateKlaviyoSync() {
    try {
        // Connect to database
        await connectToDatabase();
        console.log('Connected to MongoDB');

        // Find all stores with Klaviyo integration
        const stores = await Store.find({
            'klaviyo_integration.public_id': { $exists: true, $ne: null }
        });

        console.log(`Found ${stores.length} stores with Klaviyo integration`);

        // Group stores by Klaviyo public ID
        const klaviyoGroups = {};
        
        for (const store of stores) {
            const klaviyoId = store.klaviyo_integration.public_id;
            
            if (!klaviyoGroups[klaviyoId]) {
                klaviyoGroups[klaviyoId] = {
                    stores: [],
                    latestSync: {
                        campaign_values_last_update: null,
                        segment_series_last_update: null,
                        flow_series_last_update: null,
                        form_series_last_update: null,
                        is_updating_dashboard: false
                    },
                    account_info: null
                };
            }
            
            klaviyoGroups[klaviyoId].stores.push({
                store_id: store._id,
                store_public_id: store.public_id,
                campaign_update: store.klaviyo_integration.campaign_values_last_update,
                segment_update: store.klaviyo_integration.segment_series_last_update || 
                                store.klaviyo_integration.segment_values_last_update,
                flow_update: store.klaviyo_integration.flow_series_last_update || 
                            store.klaviyo_integration.flow_values_last_update,
                form_update: store.klaviyo_integration.form_series_last_update || 
                            store.klaviyo_integration.form_values_last_update,
                is_updating: store.klaviyo_integration.is_updating_dashboard
            });
            
            // Get the latest sync times across all stores with this Klaviyo ID
            const storeSync = store.klaviyo_integration;
            const latestSync = klaviyoGroups[klaviyoId].latestSync;
            
            if (!latestSync.campaign_values_last_update || 
                (storeSync.campaign_values_last_update && 
                 storeSync.campaign_values_last_update > latestSync.campaign_values_last_update)) {
                latestSync.campaign_values_last_update = storeSync.campaign_values_last_update;
            }
            
            if (!latestSync.segment_series_last_update || 
                (storeSync.segment_series_last_update && 
                 storeSync.segment_series_last_update > latestSync.segment_series_last_update)) {
                latestSync.segment_series_last_update = storeSync.segment_series_last_update;
            }
            
            if (!latestSync.flow_series_last_update || 
                (storeSync.flow_series_last_update && 
                 storeSync.flow_series_last_update > latestSync.flow_series_last_update)) {
                latestSync.flow_series_last_update = storeSync.flow_series_last_update;
            }
            
            if (!latestSync.form_series_last_update || 
                (storeSync.form_series_last_update && 
                 storeSync.form_series_last_update > latestSync.form_series_last_update)) {
                latestSync.form_series_last_update = storeSync.form_series_last_update;
            }
            
            // If any store is updating, mark the sync as updating
            if (storeSync.is_updating_dashboard) {
                latestSync.is_updating_dashboard = true;
            }
            
            // Store account info if available
            if (store.klaviyo_integration.account && Object.keys(store.klaviyo_integration.account).length > 0) {
                klaviyoGroups[klaviyoId].account_info = store.klaviyo_integration.account;
            }
        }

        // Create or update KlaviyoSync records
        let created = 0;
        let updated = 0;
        
        for (const [klaviyoId, data] of Object.entries(klaviyoGroups)) {
            console.log(`\nProcessing Klaviyo ID: ${klaviyoId}`);
            console.log(`  - ${data.stores.length} stores using this account`);
            
            // Check if sync record already exists
            let syncRecord = await KlaviyoSync.findOne({ klaviyo_public_id: klaviyoId });
            
            if (syncRecord) {
                console.log('  - Updating existing sync record');
                
                // Update with latest data
                syncRecord.store_public_ids = data.stores.map(s => s.store_public_id);
                syncRecord.store_ids = data.stores.map(s => s.store_id);
                
                // Only update timestamps if they're newer
                if (data.latestSync.campaign_values_last_update && 
                    (!syncRecord.campaign_values_last_update || 
                     data.latestSync.campaign_values_last_update > syncRecord.campaign_values_last_update)) {
                    syncRecord.campaign_values_last_update = data.latestSync.campaign_values_last_update;
                }
                
                if (data.latestSync.segment_series_last_update && 
                    (!syncRecord.segment_series_last_update || 
                     data.latestSync.segment_series_last_update > syncRecord.segment_series_last_update)) {
                    syncRecord.segment_series_last_update = data.latestSync.segment_series_last_update;
                }
                
                if (data.latestSync.flow_series_last_update && 
                    (!syncRecord.flow_series_last_update || 
                     data.latestSync.flow_series_last_update > syncRecord.flow_series_last_update)) {
                    syncRecord.flow_series_last_update = data.latestSync.flow_series_last_update;
                }
                
                if (data.latestSync.form_series_last_update && 
                    (!syncRecord.form_series_last_update || 
                     data.latestSync.form_series_last_update > syncRecord.form_series_last_update)) {
                    syncRecord.form_series_last_update = data.latestSync.form_series_last_update;
                }
                
                syncRecord.is_updating_dashboard = data.latestSync.is_updating_dashboard;
                
                await syncRecord.save();
                updated++;
            } else {
                console.log('  - Creating new sync record');
                
                // Extract account info if available
                let accountInfo = {};
                if (data.account_info && data.account_info.data && data.account_info.data[0]) {
                    const accountData = data.account_info.data[0].attributes;
                    accountInfo = {
                        test_account: accountData.test_account,
                        organization_name: accountData.contact_information?.organization_name,
                        timezone: accountData.timezone,
                        currency: accountData.preferred_currency,
                        industry: accountData.industry,
                        locale: accountData.locale
                    };
                }
                
                // Create new sync record
                syncRecord = new KlaviyoSync({
                    klaviyo_public_id: klaviyoId,
                    store_public_ids: data.stores.map(s => s.store_public_id),
                    store_ids: data.stores.map(s => s.store_id),
                    is_updating_dashboard: data.latestSync.is_updating_dashboard,
                    campaign_values_last_update: data.latestSync.campaign_values_last_update,
                    segment_series_last_update: data.latestSync.segment_series_last_update,
                    flow_series_last_update: data.latestSync.flow_series_last_update,
                    form_series_last_update: data.latestSync.form_series_last_update,
                    account_info: accountInfo,
                    status: 'active'
                });
                
                await syncRecord.save();
                created++;
            }
            
            console.log(`  - Latest sync times:`);
            console.log(`    Campaigns: ${syncRecord.campaign_values_last_update || 'Never'}`);
            console.log(`    Segments: ${syncRecord.segment_series_last_update || 'Never'}`);
            console.log(`    Flows: ${syncRecord.flow_series_last_update || 'Never'}`);
            console.log(`    Forms: ${syncRecord.form_series_last_update || 'Never'}`);
        }

        console.log('\n=== Migration Summary ===');
        console.log(`Total Klaviyo accounts found: ${Object.keys(klaviyoGroups).length}`);
        console.log(`Sync records created: ${created}`);
        console.log(`Sync records updated: ${updated}`);
        console.log(`Total stores processed: ${stores.length}`);

        // Optional: Remove sync fields from Store model
        const removeSyncFields = process.argv.includes('--remove-store-fields');
        
        if (removeSyncFields) {
            console.log('\n=== Removing sync fields from Store model ===');
            
            const result = await Store.updateMany(
                { 'klaviyo_integration.public_id': { $exists: true, $ne: null } },
                {
                    $unset: {
                        'klaviyo_integration.is_updating_dashboard': '',
                        'klaviyo_integration.campaign_values_last_update': '',
                        'klaviyo_integration.segment_series_last_update': '',
                        'klaviyo_integration.segment_values_last_update': '',
                        'klaviyo_integration.flow_series_last_update': '',
                        'klaviyo_integration.flow_values_last_update': '',
                        'klaviyo_integration.form_series_last_update': '',
                        'klaviyo_integration.form_values_last_update': ''
                    }
                }
            );
            
            console.log(`Updated ${result.modifiedCount} stores`);
            console.log('Sync fields removed from Store model');
        } else {
            console.log('\nTo remove sync fields from Store model, run with --remove-store-fields flag');
        }

        console.log('\nMigration completed successfully!');
        
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run migration
migrateKlaviyoSync();