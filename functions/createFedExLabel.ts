import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { 
            order_id, 
            service_type, 
            weight, 
            dimensions,
            ship_to_address,
            ship_from_address 
        } = body;

        // Get FedEx credentials
        const fedexApiKey = Deno.env.get("fedex_api_key");
        const fedexSecretKey = Deno.env.get("fedex_secret_key");
        const fedexAccountNumber = Deno.env.get("fedex_account_number");

        if (!fedexApiKey || !fedexSecretKey || !fedexAccountNumber) {
            return Response.json({ error: 'FedEx credentials not configured' }, { status: 500 });
        }

        // Step 1: Get OAuth token from FedEx
        const authResponse = await fetch('https://apis.fedex.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: fedexApiKey,
                client_secret: fedexSecretKey
            })
        });

        if (!authResponse.ok) {
            throw new Error(`FedEx auth failed: ${authResponse.status}`);
        }

        const authData = await authResponse.json();
        const accessToken = authData.access_token;

        // Step 2: Create shipping label
        const labelRequest = {
            labelResponseOptions: "URL_ONLY",
            requestedShipment: {
                shipper: {
                    contact: {
                        personName: ship_from_address.company_name,
                        phoneNumber: ship_from_address.phone
                    },
                    address: {
                        streetLines: [ship_from_address.street1, ship_from_address.street2].filter(Boolean),
                        city: ship_from_address.city,
                        stateOrProvinceCode: ship_from_address.state,
                        postalCode: ship_from_address.zip,
                        countryCode: ship_from_address.country
                    }
                },
                recipients: [{
                    contact: {
                        personName: ship_to_address.name,
                        phoneNumber: ship_to_address.phone
                    },
                    address: {
                        streetLines: [ship_to_address.street1, ship_to_address.street2].filter(Boolean),
                        city: ship_to_address.city,
                        stateOrProvinceCode: ship_to_address.state,
                        postalCode: ship_to_address.zip,
                        countryCode: ship_to_address.country,
                        residential: true
                    }
                }],
                shipDatestamp: new Date().toISOString().split('T')[0],
                serviceType: service_type,
                packagingType: "YOUR_PACKAGING",
                pickupType: "USE_SCHEDULED_PICKUP",
                blockInsightVisibility: false,
                shippingChargesPayment: {
                    paymentType: "SENDER"
                },
                labelSpecification: {
                    imageType: "PDF",
                    labelStockType: "PAPER_4X6"
                },
                requestedPackageLineItems: [{
                    weight: {
                        units: "LB",
                        value: weight
                    },
                    dimensions: {
                        length: dimensions.length,
                        width: dimensions.width,
                        height: dimensions.height,
                        units: "IN"
                    }
                }]
            },
            accountNumber: {
                value: fedexAccountNumber
            }
        };

        const shipResponse = await fetch('https://apis.fedex.com/ship/v1/shipments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'X-locale': 'en_US'
            },
            body: JSON.stringify(labelRequest)
        });

        if (!shipResponse.ok) {
            const errorData = await shipResponse.text();
            throw new Error(`FedEx shipping failed: ${shipResponse.status} - ${errorData}`);
        }

        const shipData = await shipResponse.json();
        
        // Extract tracking number and label URL
        const trackingNumber = shipData.output?.transactionShipments?.[0]?.masterTrackingNumber;
        const labelUrl = shipData.output?.transactionShipments?.[0]?.pieceResponses?.[0]?.packageDocuments?.[0]?.url;

        if (!trackingNumber || !labelUrl) {
            throw new Error('Failed to get tracking number or label URL from FedEx response');
        }

        // Get order details
        const order = await base44.entities.Order.filter({ id: order_id });
        if (!order || order.length === 0) {
            throw new Error('Order not found');
        }

        // Create shipment record
        const shipment = await base44.asServiceRole.entities.Shipment.create({
            order_id: order_id,
            order_number: order[0].order_number,
            tracking_number: trackingNumber,
            carrier: 'fedex',
            service_type: service_type,
            status: 'label_created',
            ship_date: new Date().toISOString().split('T')[0],
            box_type: body.box_type || 'Custom',
            dimensions: dimensions,
            weight: weight,
            label_url: labelUrl,
            label_format: 'pdf',
            customer_name: order[0].customer_name,
            destination_address: ship_to_address,
            is_international: ship_to_address.country !== 'US',
            shipped_by: user.email
        });

        // Update order status
        await base44.asServiceRole.entities.Order.update(order_id, {
            status: 'processing'
        });

        return Response.json({
            success: true,
            tracking_number: trackingNumber,
            label_url: labelUrl,
            shipment: shipment
        });

    } catch (error) {
        console.error('Error creating FedEx label:', error);
        return Response.json({ 
            error: error.message,
            details: 'Failed to create FedEx shipping label'
        }, { status: 500 });
    }
});