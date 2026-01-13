import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { shipmentId, password } = await req.json();

        if (!shipmentId || !password) {
            return Response.json({ error: 'Shipment ID and password are required' }, { status: 400 });
        }

        // Verify password
        const correctPassword = Deno.env.get("order_delete_password");
        
        if (password !== correctPassword) {
            return Response.json({ error: 'Incorrect password' }, { status: 403 });
        }

        // Delete the shipment
        await base44.asServiceRole.entities.Shipment.delete(shipmentId);

        return Response.json({ success: true });

    } catch (error) {
        console.error('Error deleting shipment:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});