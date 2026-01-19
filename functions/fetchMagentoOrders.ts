import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

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
        
        // Fetch ALL orders first to see what statuses exist
        console.log('Fetching all orders to check statuses...');
        const response = await fetch(`${store_url}/rest/V1/orders?searchCriteria[pageSize]=10`, {
            headers: {
                'Authorization': `Bearer ${api_key}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Orders API Failed:', errorText);
            return Response.json({ 
                error: `Failed to fetch orders: ${response.status}`,
                details: errorText
            }, { status: 500 });
        }

        const data = await response.json();
        
        // Log all statuses found for debugging
        const statuses = data.items?.map(o => o.status) || [];
        const uniqueStatuses = [...new Set(statuses)];
        console.log('Found order statuses in your store:', uniqueStatuses);
        
        if (!data.items || data.items.length === 0) {
            return Response.json({
                success: true,
                imported_count: 0,
                total_magento_orders: 0,
                orders: [],
                message: 'No orders found in Magento',
                available_statuses: []
            });
        }
        
        // Filter orders by the status we want (now checking all recent orders)
        const targetStatus = 'Order Received - Awaiting Fulfillment.';
        const filteredOrders = data.items.filter(o => o.status === targetStatus);
        
        console.log(`Total orders: ${data.items.length}, Matching status: ${filteredOrders.length}`);
        
        if (filteredOrders.length === 0) {
            return Response.json({
                success: true,
                imported_count: 0,
                total_magento_orders: data.items.length,
                orders: [],
                message: `No orders with status "${targetStatus}" found`,
                available_statuses: uniqueStatuses,
                hint: 'Use one of the available statuses shown above in your filter'
            });
        }
        
        // Get all order numbers from Magento orders
        const magentoOrderNumbers = data.items.map(o => o.increment_id);
        
        // Check which orders already exist in our system (single query)
        const existingOrders = await base44.asServiceRole.entities.Order.list();
        const existingOrderNumbers = new Set(existingOrders.map(o => o.order_number));
        
        // Transform Magento orders to our Order entity format
        const transformedOrders = [];
        
        for (const magentoOrder of data.items) {
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

        return Response.json({
            success: true,
            imported_count: transformedOrders.length,
            total_magento_orders: data.items?.length || 0,
            orders: transformedOrders
        });

    } catch (error) {
        console.error('Error fetching Magento orders:', error);
        return Response.json({ 
            error: error.message,
            details: 'Failed to fetch orders from Magento'
        }, { status: 500 });
    }
});