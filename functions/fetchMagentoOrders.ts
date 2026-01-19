import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const store_url = Deno.env.get("magento_store_url");
        const api_key = Deno.env.get("magento_api_key");
        
        if (!store_url || !api_key) {
            return Response.json({ 
                error: 'Magento credentials not configured'
            }, { status: 500 });
        }

        // Fetch orders from Magento API
        const response = await fetch(`${store_url}/rest/V1/orders?searchCriteria[filter_groups][0][filters][0][field]=status&searchCriteria[filter_groups][0][filters][0][value]=Order Received - Awaiting Fulfillment.&searchCriteria[filter_groups][0][filters][0][condition_type]=eq`, {
            headers: {
                'Authorization': `Bearer ${api_key}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Magento API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
            return Response.json({
                success: true,
                imported_count: 0,
                total_magento_orders: 0
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

            const priority = 'normal';
            
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
            total_magento_orders: data.items?.length || 0
        });

    } catch (error) {
        console.error('Error fetching Magento orders:', error);
        return Response.json({ 
            error: error.message,
            details: 'Failed to fetch orders from Magento'
        }, { status: 500 });
    }
});