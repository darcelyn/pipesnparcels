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
                help: 'Check that your Access Token has the correct permissions for Products in System → Integrations'
            }, { status: 500 });
        }
        
        // Get last sync time for incremental sync
        const settings = await base44.asServiceRole.entities.ShippingSettings.list();
        const lastSyncTime = settings[0]?.last_product_sync;
        
        // Build search criteria
        let baseUrl = `${store_url}/rest/V1/products?searchCriteria[pageSize]=100`;
        
        // Add incremental filter if enabled and we have a last sync time
        if (isIncrementalSync && lastSyncTime) {
            console.log('Performing incremental sync since:', lastSyncTime);
            baseUrl += `&searchCriteria[filter_groups][0][filters][0][field]=updated_at`;
            baseUrl += `&searchCriteria[filter_groups][0][filters][0][value]=${lastSyncTime}`;
            baseUrl += `&searchCriteria[filter_groups][0][filters][0][condition_type]=gt`;
        } else {
            console.log('Performing full sync (all products)');
        }
        
        // Fetch ALL products from Magento (with pagination)
        let allProducts = [];
        let currentPage = 1;
        let hasMorePages = true;
        
        while (hasMorePages) {
            const response = await fetch(
                `${baseUrl}&searchCriteria[currentPage]=${currentPage}`,
                {
                    headers: {
                        'Authorization': `Bearer ${api_key}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Products API Failed:', errorText);
                
                // Retry logic for transient errors
                if (retryCount < maxRetries && (response.status >= 500 || response.status === 429)) {
                    retryCount++;
                    const waitTime = Math.pow(2, retryCount) * 1000; // exponential backoff
                    console.log(`Retrying in ${waitTime}ms... (attempt ${retryCount}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    return attemptSync();
                }
                
                return Response.json({ 
                    error: `Failed to fetch products: ${response.status}`,
                    details: errorText,
                    retries_attempted: retryCount
                }, { status: 500 });
            }

            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                allProducts = allProducts.concat(data.items);
                console.log(`Fetched page ${currentPage}: ${data.items.length} products`);
                
                // Check if there are more pages
                if (data.items.length < 100) {
                    hasMorePages = false;
                } else {
                    currentPage++;
                }
            } else {
                hasMorePages = false;
            }
        }
        
        if (allProducts.length === 0) {
            return Response.json({
                success: true,
                synced_count: 0,
                total_magento_products: 0,
                products: [],
                message: isIncrementalSync && lastSyncTime 
                    ? 'No product updates since last sync' 
                    : 'No products found in Magento'
            });
        }
        
        console.log(`Found ${allProducts.length} total products in Magento`);
        
        // Get all existing products from our system
        const existingProducts = await base44.asServiceRole.entities.Product.list();
        const existingSkus = new Set(existingProducts.map(p => p.sku));
        
        // Transform Magento products to our Product entity format
        const transformedProducts = [];
        const updatedProducts = [];
        
        for (const magentoProduct of allProducts) {
            // Get stock info from extension attributes
            const stockItem = magentoProduct.extension_attributes?.stock_item;
            const stockQuantity = stockItem?.qty || 0;
            
            // Get weight (Magento stores in lbs usually)
            const weight = parseFloat(magentoProduct.weight || 0);
            
            const productData = {
                sku: magentoProduct.sku,
                name: magentoProduct.name,
                description: magentoProduct.custom_attributes?.find(attr => attr.attribute_code === 'description')?.value || '',
                price: parseFloat(magentoProduct.price || 0),
                stock_quantity: stockQuantity,
                weight: weight,
                status: magentoProduct.status === 1 ? 'enabled' : 'disabled',
                magento_id: magentoProduct.id.toString(),
                last_synced: new Date().toISOString()
            };
            
            if (existingSkus.has(magentoProduct.sku)) {
                // Update existing product
                const existingProduct = existingProducts.find(p => p.sku === magentoProduct.sku);
                if (existingProduct) {
                    await base44.asServiceRole.entities.Product.update(existingProduct.id, productData);
                    updatedProducts.push(productData);
                }
            } else {
                // Create new product
                transformedProducts.push(productData);
            }
        }
        
        // Bulk create new products
        if (transformedProducts.length > 0) {
            await base44.asServiceRole.entities.Product.bulkCreate(transformedProducts);
        }
        
        // Update last sync time
        if (settings[0]) {
            await base44.asServiceRole.entities.ShippingSettings.update(settings[0].id, {
                last_product_sync: new Date().toISOString()
            });
        }

        return Response.json({
            success: true,
            synced_count: transformedProducts.length + updatedProducts.length,
            new_count: transformedProducts.length,
            updated_count: updatedProducts.length,
            total_magento_products: allProducts.length,
            sync_type: isIncrementalSync && lastSyncTime ? 'incremental' : 'full',
            products: [...transformedProducts, ...updatedProducts]
        });

        } catch (error) {
            console.error('Error fetching Magento products:', error);
            
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
                details: 'Failed to fetch products from Magento',
                retries_attempted: retryCount
            }, { status: 500 });
        }
    };
    
    return attemptSync();
});