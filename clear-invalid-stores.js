// 🚨 IMMEDIATE FIX - Copy and paste this entire script into browser console
// This will clear the invalid klaviyo_public_ids from localStorage

(function clearInvalidStores() {
    console.log('🧹 Fixing localStorage store ID issue...');
    console.log('');

    // Get current stored accounts
    const stored = localStorage.getItem('analyticsSelectedAccounts');
    if (stored) {
        try {
            const accounts = JSON.parse(stored);
            console.log('📋 Current localStorage accounts:', accounts);

            // Check if any of the problematic Klaviyo IDs are present
            const invalidKlaviyoIds = ['Pe5Xw6', 'XqkVGb'];
            const hasInvalid = accounts.some(acc =>
                invalidKlaviyoIds.includes(acc.value) || invalidKlaviyoIds.includes(acc.label)
            );

            if (hasInvalid) {
                console.log('');
                console.log('❌ FOUND ISSUE: localStorage contains klaviyo_public_ids instead of store_public_ids!');
                console.log('');
                console.log('🔍 ID Mapping:');
                console.log('   Pe5Xw6 (klaviyo_public_id) should be:');
                console.log('     → rZResQK (store: asdasdsa)');
                console.log('     → 7MP60fH (store: Shopify)');
                console.log('');
                console.log('   XqkVGb (klaviyo_public_id) should be:');
                console.log('     → zp7vNlc (store: Bal Real)');
                console.log('     → Pu200rg (store: balmain)');
                console.log('');

                // Clear all related localStorage items
                localStorage.removeItem('analyticsSelectedAccounts');
                localStorage.removeItem('analyticsDateRange');
                localStorage.removeItem('recentStoreIds');
                localStorage.removeItem('analyticsKnownAccounts');

                console.log('✅ Fixed! Cleared invalid localStorage data');
                console.log('');
                console.log('📋 The account selector will now use correct store_public_ids');
                console.log('🔄 Reloading page to refresh with clean data...');

                // Delay reload slightly so user can see the messages
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                console.log('✅ Good news! localStorage already contains correct store_public_ids');
                console.log('   No fix needed - the issue was already resolved');
            }
        } catch (e) {
            console.error('💥 Error parsing localStorage:', e);
            console.log('🔧 Clearing corrupted localStorage data...');

            localStorage.removeItem('analyticsSelectedAccounts');
            localStorage.removeItem('analyticsDateRange');
            localStorage.removeItem('recentStoreIds');
            localStorage.removeItem('analyticsKnownAccounts');

            console.log('✅ Cleared corrupted data. Reloading...');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    } else {
        console.log('ℹ️  No analyticsSelectedAccounts in localStorage');
        console.log('   This is normal - the account selector will populate it correctly');
    }

    console.log('');
    console.log('📚 Background: The application expects this flow:');
    console.log('   Frontend: store_public_ids → localStorage → API');
    console.log('   API: store_public_ids → klaviyo_public_ids → ClickHouse');
    console.log('');
    console.log('🚨 The bug was: klaviyo_public_ids were stored in localStorage directly');
})();