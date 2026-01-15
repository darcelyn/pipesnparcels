import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { order_id } = await req.json();
    
    if (!order_id) {
      return Response.json({ error: 'order_id is required' }, { status: 400 });
    }

    // Fetch the order
    const orders = await base44.entities.Order.filter({ id: order_id });
    if (orders.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    
    const order = orders[0];
    
    // Prepare order context for AI analysis
    const orderContext = `
Order Number: ${order.order_number}
Customer: ${order.customer_name}
Order Value: $${order.order_value || 0}
Total Weight: ${order.total_weight || 0} lbs
Is International: ${order.is_international ? 'Yes' : 'No'}
Current Priority: ${order.priority || 'normal'}
Items Count: ${order.items?.length || 0}
Total Quantity: ${order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
Special Instructions: ${order.special_instructions || 'None'}
Created Date: ${order.created_date}
Source: ${order.source || 'unknown'}
`;

    // Use AI to analyze and suggest priority
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an order fulfillment specialist analyzing orders to determine priority levels.

Analyze this order and suggest a priority level (rush, priority, or normal) based on:
1. Order value (higher value = higher priority)
2. International shipping (international orders may need more lead time)
3. Special instructions that indicate urgency
4. Order age (older orders should be prioritized)
5. Quantity/complexity (large orders may need earlier start)

Order Details:
${orderContext}

Provide a priority recommendation (rush, priority, or normal) and a brief explanation (2-3 sentences max) of why you chose this priority level.`,
      response_json_schema: {
        type: "object",
        properties: {
          suggested_priority: {
            type: "string",
            enum: ["rush", "priority", "normal"],
            description: "Recommended priority level"
          },
          reasoning: {
            type: "string",
            description: "Brief explanation for the priority recommendation"
          },
          confidence: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "Confidence level in this recommendation"
          }
        },
        required: ["suggested_priority", "reasoning", "confidence"]
      }
    });

    return Response.json({
      order_id,
      current_priority: order.priority || 'normal',
      ...response
    });

  } catch (error) {
    console.error('Error suggesting priority:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});