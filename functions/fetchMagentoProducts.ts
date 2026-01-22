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
                help: 'Check that your Access Token has the correct permissions for Products in System → Integrations'
            }, { status: 500 });
        }
        
        // Fetch ALL products from Magento (with pagination)
        console.log('Fetching products...');
        let allProducts = [];
        let currentPage = 1;
        const pageSize = 100;
        let hasMorePages = true;
        
        while (hasMorePages) {
            const response = await fetch(
                `${store_url}/rest/V1/products?searchCriteria[pageSize]=${pageSize}&searchCriteria[currentPage]=${currentPage}`,
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
                return Response.json({ 
                    error: `Failed to fetch products: ${response.status}`,
                    details: errorText
                }, { status: 500 });
            }

            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                allProducts = allProducts.concat(data.items);
                console.log(`Fetched page ${currentPage}: ${data.items.length} products`);
                
                // Check if there are more pages
                if (data.items.length < pageSize) {
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
                message: 'No products found in Magento'
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

        return Response.json({
            success: true,
            synced_count: transformedProducts.length + updatedProducts.length,
            new_count: transformedProducts.length,
            updated_count: updatedProducts.length,
            total_magento_products: allProducts.length,
            products: [...transformedProducts, ...updatedProducts]
        });

    } catch (error) {
        console.error('Error fetching Magento products:', error);
        return Response.json({ 
            error: error.message,
            details: 'Failed to fetch products from Magento'
        }, { status: 500 });
    }
});