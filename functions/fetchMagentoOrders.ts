import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const maxRetries = 3;
    let retryCount = 0;
    
    const attemptSync = async () => {
        try {
            const base44 = createClientFromRequest(req);
            const user = await base44.auth.me();

            if (!user) {
                return Response.json({ error: 'Unauthorized' }, { status: 401 });
            }
            
            // Parse request body for sync options
            const body = await req.json().catch(() => ({}));
            const isIncrementalSync = body.incremental !== false; // default to incremental

        // Get Magento credentials from secrets
        const store_url = Deno.env.get("magento_store_url");
        const api_key = Deno.env.get("magento_api_key");
        
        console.log('Store URL:', store_url ? 'SET' : 'NOT SET');
        console.log('API Key:', api_key ? 'SET' : 'NOT SET');
        
        if (!store_url || !api_key) {
            return Response.json({ 
                error: 'Magento credentials not configured. Please set magento_store_url and magento_api_key secrets.',
                debug: { store_url: !!store_url, api_key: !!api_key }
            }, { status: 500 });
        }

        // Test basic API connectivity first
        console.log('Testing Magento API connectivity...');
        const testResponse = await fetch(`${store_url}/rest/V1/store/storeViews`, {
            headers: {
                'Authorization': `Bearer ${api_key}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Test API Status:', testResponse.status);
        
        if (!testResponse.ok) {
            const errorText = await testResponse.text();
            console.error('API Test Failed:', errorText);
            return Response.json({ 
                error: `Magento API authentication failed: ${testResponse.status}`,
                details: errorText,
                help: 'Check that your Access Token has the correct permissions for Orders in System → Integrations'
            }, { status: 500 });
        }
        
        // Get last sync time for incremental sync
        const settings = await base44.asServiceRole.entities.ShippingSettings.list();
        const lastSyncTime = settings[0]?.last_order_sync;
        
        // Build search criteria - filter for orders awaiting fulfillment
        let searchUrl = `${store_url}/rest/V1/orders?searchCriteria[pageSize]=100`;

        // Filter for orders that need fulfillment (URL encode the status value)
        const statusValue = encodeURIComponent('Order Received - Awaiting Fulfillment.');
        searchUrl += `&searchCriteria[filter_groups][0][filters][0][field]=status`;
        searchUrl += `&searchCriteria[filter_groups][0][filters][0][value]=${statusValue}`;
        searchUrl += `&searchCriteria[filter_groups][0][filters][0][condition_type]=eq`;

        // Filter for orders created on or after 11/01/2025
        searchUrl += `&searchCriteria[filter_groups][1][filters][0][field]=created_at`;
        searchUrl += `&searchCriteria[filter_groups][1][filters][0][value]=2025-11-01 00:00:00`;
        searchUrl += `&searchCriteria[filter_groups][1][filters][0][condition_type]=gteq`;
        
        console.log('Fetching orders with status "Order Received - Awaiting Fulfillment." from 11/01/2025 or newer');
        
        // Fetch orders with pagination (limit pages to prevent timeout)
        const MAX_PAGES = isIncrementalSync ? 10 : 50; // reasonable limits
        let allOrders = [];
        let currentPage = 1;
        let hasMorePages = true;

        while (hasMorePages && currentPage <= MAX_PAGES) {
            const pageUrl = `${searchUrl}&searchCriteria[currentPage]=${currentPage}`;
            console.log(`Fetching page ${currentPage}...`);
            
            const response = await fetch(pageUrl, {
                headers: {
                    'Authorization': `Bearer ${api_key}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Orders API Failed:', errorText);
                
                // Retry logic for transient errors
                if (retryCount < maxRetries && (response.status >= 500 || response.status === 429)) {
                    retryCount++;
                    const waitTime = Math.pow(2, retryCount) * 1000; // exponential backoff
                    console.log(`Retrying in ${waitTime}ms... (attempt ${retryCount}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    return attemptSync();
                }
                
                return Response.json({ 
                    error: `Failed to fetch orders: ${response.status}`,
                    details: errorText,
                    retries_attempted: retryCount
                }, { status: 500 });
            }

            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                allOrders = allOrders.concat(data.items);
                console.log(`Page ${currentPage}: ${data.items.length} orders`);
                
                if (data.items.length < 100) {
                    hasMorePages = false;
                } else {
                    currentPage++;
                }
            } else {
                hasMorePages = false;
            }
        }
        
        console.log(`Total orders fetched: ${allOrders.length}`);
        
        console.log(`Total orders fetched: ${allOrders.length}`);

        if (allOrders.length === 0) {
            return Response.json({
                success: true,
                imported_count: 0,
                total_magento_orders: 0,
                orders: [],
                message: isIncrementalSync && lastSyncTime 
                    ? 'No new orders since last sync' 
                    : 'No pending orders found in Magento'
            });
        }
        
        // Check which orders already exist in our system (single query)
        const existingOrders = await base44.asServiceRole.entities.Order.list();
        const existingOrderNumbers = new Set(existingOrders.map(o => o.order_number));

        // Transform Magento orders to our Order entity format
        const transformedOrders = [];

        for (const magentoOrder of allOrders) {
            // Skip if already exists
            if (existingOrderNumbers.has(magentoOrder.increment_id)) {
                continue;
            }
            
            const shippingAddress = magentoOrder.extension_attributes?.shipping_assignments?.[0]?.shipping?.address || {};
            
            // Calculate total weight from items
            let totalWeight = 0;
            const items = (magentoOrder.items || []).map(item => {
                const weight = parseFloat(item.weight || 0);
                totalWeight += weight * item.qty_ordered;
                
                return {
                    sku: item.sku,
                    name: item.name,
                    quantity: item.qty_ordered,
                    weight: weight
                };
            });

            // Map Magento priority if available, otherwise default to 'normal'
            let priority = 'normal';
            if (magentoOrder.extension_attributes?.priority) {
                const magentoPriority = magentoOrder.extension_attributes.priority.toLowerCase();
                if (magentoPriority === 'urgent' || magentoPriority === 'rush' || magentoPriority === 'high') {
                    priority = 'rush';
                } else if (magentoPriority === 'priority' || magentoPriority === 'medium') {
                    priority = 'priority';
                }
            }
            
            // Create new order in our system
            const orderData = {
                order_number: magentoOrder.increment_id,
                source: 'magento',
                status: 'pending',
                priority: priority,
                customer_name: `${magentoOrder.customer_firstname} ${magentoOrder.customer_lastname}`,
                customer_email: magentoOrder.customer_email,
                shipping_address: {
                    street1: shippingAddress.street?.[0] || '',
                    street2: shippingAddress.street?.[1] || '',
                    city: shippingAddress.city || '',
                    state: shippingAddress.region || '',
                    zip: shippingAddress.postcode || '',
                    country: shippingAddress.country_id || 'US',
                    phone: shippingAddress.telephone || ''
                },
                items: items,
                total_weight: totalWeight,
                order_value: parseFloat(magentoOrder.grand_total || 0),
                is_international: shippingAddress.country_id !== 'US'
            };

            transformedOrders.push(orderData);
        }
        
        // Bulk create all new orders at once
        if (transformedOrders.length > 0) {
            await base44.asServiceRole.entities.Order.bulkCreate(transformedOrders);
        }
        
        // Update last sync time
        if (settings[0]) {
            await base44.asServiceRole.entities.ShippingSettings.update(settings[0].id, {
                last_order_sync: new Date().toISOString()
            });
        }

        return Response.json({
            success: true,
            imported_count: transformedOrders.length,
            total_magento_orders: allOrders.length,
            sync_type: isIncrementalSync && lastSyncTime ? 'incremental' : 'full',
            orders: transformedOrders
        });

        } catch (error) {
            console.error('Error fetching Magento orders:', error);
            
            // Retry on network errors
            if (retryCount < maxRetries && (error.name === 'TypeError' || error.message.includes('fetch'))) {
                retryCount++;
                const waitTime = Math.pow(2, retryCount) * 1000;
                console.log(`Network error, retrying in ${waitTime}ms... (attempt ${retryCount}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return attemptSync();
            }
            
            return Response.json({ 
                error: error.message,
                details: 'Failed to fetch orders from Magento',
                retries_attempted: retryCount
            }, { status: 500 });
        }
    };
    
    return attemptSync();
});