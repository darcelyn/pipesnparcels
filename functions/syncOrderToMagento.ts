import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Parse event payload
        const { event, data, old_data } = await req.json();
        
        // Only process update events for orders with Magento source
        if (event.type !== 'update' || data.source !== 'magento') {
            return Response.json({ 
                success: true, 
                skipped: true,
                reason: 'Not a Magento order update'
            });
        }
        
        // Check if two-way sync is enabled
        const settings = await base44.asServiceRole.entities.ShippingSettings.list();
        if (!settings[0]?.magento_two_way_sync) {
            return Response.json({ 
                success: true, 
                skipped: true,
                reason: 'Two-way sync is disabled'
            });
        }
        
        // Get Magento credentials
        const store_url = Deno.env.get("magento_store_url");
        const api_key = Deno.env.get("magento_api_key");
        
        if (!store_url || !api_key) {
            console.error('Magento credentials not configured');
            return Response.json({ 
                success: false,
                error: 'Magento credentials not configured'
            }, { status: 500 });
        }
        
        // Determine what changed and what to update
        const updates = {};
        let statusChanged = false;
        
        // Map internal status to Magento status
        const statusMap = {
            'pending': 'processing',
            'production': 'processing',
            'staging': 'processing',
            'processing': 'processing',
            'shipped': 'complete',
            'delivered': 'complete',
            'hold': 'holded',
            'cancelled': 'canceled'
        };
        
        // Check if status changed
        if (old_data && data.status !== old_data.status) {
            const magentoStatus = statusMap[data.status] || 'processing';
            updates.status = magentoStatus;
            statusChanged = true;
        }
        
        // Get tracking info from related shipments
        const shipments = await base44.asServiceRole.entities.Shipment.filter({ 
            order_id: data.id 
        });
        
        if (shipments.length > 0 && statusChanged) {
            // Add tracking extension attributes
            const trackingInfo = shipments.map(shipment => ({
                track_number: shipment.tracking_number,
                title: shipment.carrier.toUpperCase(),
                carrier_code: shipment.carrier === 'fedex' ? 'fedex' : 'usps'
            }));
            
            updates.extension_attributes = {
                shipping_assignments: [{
                    shipping: {
                        tracking: trackingInfo
                    }
                }]
            };
        }
        
        // If no changes, skip
        if (Object.keys(updates).length === 0) {
            return Response.json({ 
                success: true, 
                skipped: true,
                reason: 'No relevant changes to sync'
            });
        }
        
        // Search for the order in Magento by increment_id (order_number)
        console.log('Searching for order:', data.order_number);
        const searchUrl = `${store_url}/rest/V1/orders?searchCriteria[filter_groups][0][filters][0][field]=increment_id&searchCriteria[filter_groups][0][filters][0][value]=${data.order_number}&searchCriteria[filter_groups][0][filters][0][condition_type]=eq`;
        
        const searchResponse = await fetch(searchUrl, {
            headers: {
                'Authorization': `Bearer ${api_key}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!searchResponse.ok) {
            const errorText = await searchResponse.text();
            console.error('Failed to search Magento order:', errorText);
            return Response.json({ 
                success: false,
                error: 'Failed to find order in Magento',
                details: errorText
            }, { status: 500 });
        }
        
        const searchData = await searchResponse.json();
        if (!searchData.items || searchData.items.length === 0) {
            return Response.json({ 
                success: false,
                error: `Order ${data.order_number} not found in Magento`
            }, { status: 404 });
        }
        
        const magentoOrderId = searchData.items[0].entity_id;
        console.log('Found Magento order ID:', magentoOrderId);
        
        // Update the order in Magento
        const updateUrl = `${store_url}/rest/V1/orders/${magentoOrderId}`;
        const updateResponse = await fetch(updateUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${api_key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                entity: {
                    entity_id: magentoOrderId,
                    ...updates
                }
            })
        });
        
        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('Failed to update Magento order:', errorText);
            
            // If it's a status update that failed, try using the status endpoint
            if (statusChanged) {
                console.log('Trying status-specific endpoint...');
                const statusUrl = `${store_url}/rest/V1/orders/${magentoOrderId}/comments`;
                const statusResponse = await fetch(statusUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${api_key}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        statusHistory: {
                            comment: `Status updated from Pipes & Parcels to: ${data.status}`,
                            status: updates.status,
                            is_customer_notified: 0,
                            is_visible_on_front: 0
                        }
                    })
                });
                
                if (!statusResponse.ok) {
                    return Response.json({ 
                        success: false,
                        error: 'Failed to update order in Magento',
                        details: errorText
                    }, { status: 500 });
                }
            } else {
                return Response.json({ 
                    success: false,
                    error: 'Failed to update order in Magento',
                    details: errorText
                }, { status: 500 });
            }
        }
        
        console.log('Successfully synced order to Magento');
        return Response.json({ 
            success: true,
            order_number: data.order_number,
            magento_order_id: magentoOrderId,
            updates_applied: Object.keys(updates)
        });
        
    } catch (error) {
        console.error('Error syncing order to Magento:', error);
        return Response.json({ 
            success: false,
            error: error.message
        }, { status: 500 });
    }
});