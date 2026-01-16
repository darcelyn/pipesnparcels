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
        const authResponse = await fetch('https://apis-sandbox.fedex.com/oauth/token', {
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
            const errorText = await authResponse.text();
            console.error('FedEx auth error:', errorText);
            return Response.json({ 
                error: 'FedEx authentication failed',
                details: errorText 
            }, { status: 500 });
        }

        const authData = await authResponse.json();
        const accessToken = authData.access_token;

        // Step 2: Validate shipment package
        const validateRequest = {
            requestedShipment: {
                shipper: {
                    contact: {
                        personName: ship_from_address.company_name || "Shipper",
                        phoneNumber: ship_from_address.phone || "0000000000"
                    },
                    address: {
                        streetLines: [ship_from_address.street1, ship_from_address.street2].filter(Boolean),
                        city: ship_from_address.city,
                        stateOrProvinceCode: ship_from_address.state,
                        postalCode: ship_from_address.zip,
                        countryCode: ship_from_address.country || "US"
                    }
                },
                recipients: [{
                    contact: {
                        personName: ship_to_address.name || "Recipient",
                        phoneNumber: ship_to_address.phone || "0000000000"
                    },
                    address: {
                        streetLines: [ship_to_address.street1, ship_to_address.street2].filter(Boolean),
                        city: ship_to_address.city,
                        stateOrProvinceCode: ship_to_address.state,
                        postalCode: ship_to_address.zip,
                        countryCode: ship_to_address.country || "US",
                        residential: true
                    }
                }],
                serviceType: service_type,
                packagingType: "YOUR_PACKAGING",
                pickupType: "USE_SCHEDULED_PICKUP",
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

        console.log('Validating shipment with FedEx...');
        const validateResponse = await fetch('https://apis-sandbox.fedex.com/ship/v1/shipments/packages/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'X-locale': 'en_US'
            },
            body: JSON.stringify(validateRequest)
        });

        const validateData = await validateResponse.json();

        if (!validateResponse.ok) {
            console.error('FedEx validation error:', validateData);
            
            // Extract readable error message
            let errorMessage = 'Shipment validation failed';
            if (validateData.errors && validateData.errors.length > 0) {
                errorMessage = validateData.errors.map(e => e.message).join(', ');
            }
            
            return Response.json({ 
                success: false,
                error: errorMessage,
                details: validateData,
                validated: false
            }, { status: 200 }); // Return 200 but with validation failure
        }

        console.log('Validation successful:', validateData);

        return Response.json({
            success: true,
            validated: true,
            message: 'Shipment validated successfully',
            data: validateData
        });

    } catch (error) {
        console.error('Error validating shipment:', error);
        return Response.json({ 
            success: false,
            error: error.message,
            details: 'Failed to validate shipment with FedEx',
            validated: false
        }, { status: 500 });
    }
});