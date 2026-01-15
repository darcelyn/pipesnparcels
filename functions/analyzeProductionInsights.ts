import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dateRange } = await req.json();
    
    // Fetch orders and shipments
    const orders = await base44.entities.Order.list();
    const shipments = await base44.entities.Shipment.list();
    
    // Filter by date range
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.created_date);
      return orderDate >= fromDate && orderDate <= toDate;
    });
    
    const filteredShipments = shipments.filter(shipment => {
      const shipDate = new Date(shipment.created_date);
      return shipDate >= fromDate && shipDate <= toDate;
    });

    // Calculate key metrics
    const totalOrders = filteredOrders.length;
    const fulfilledOrders = filteredOrders.filter(o => ['shipped', 'delivered'].includes(o.status)).length;
    const pendingOrders = filteredOrders.filter(o => o.status === 'pending').length;
    const productionOrders = filteredOrders.filter(o => o.status === 'production').length;
    const avgWeight = filteredOrders.reduce((sum, o) => sum + (o.total_weight || 0), 0) / totalOrders || 0;
    
    // Calculate fulfillment times
    const fulfillmentTimes = filteredOrders
      .filter(o => o.created_date && o.updated_date && ['shipped', 'delivered'].includes(o.status))
      .map(o => {
        const created = new Date(o.created_date);
        const updated = new Date(o.updated_date);
        return Math.floor((updated - created) / (1000 * 60 * 60 * 24));
      });
    
    const avgFulfillmentTime = fulfillmentTimes.length > 0
      ? fulfillmentTimes.reduce((a, b) => a + b, 0) / fulfillmentTimes.length
      : 0;

    // Status distribution
    const statusBreakdown = filteredOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    // Priority distribution
    const priorityBreakdown = filteredOrders.reduce((acc, order) => {
      const priority = order.priority || 'normal';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    // Prepare context for AI
    const analysisContext = `
Production & Fulfillment Analysis Report
Date Range: ${dateRange.from} to ${dateRange.to}

KEY METRICS:
- Total Orders: ${totalOrders}
- Fulfilled Orders: ${fulfilledOrders} (${((fulfilledOrders/totalOrders)*100).toFixed(1)}%)
- Pending Orders: ${pendingOrders}
- In Production: ${productionOrders}
- Average Fulfillment Time: ${avgFulfillmentTime.toFixed(1)} days
- Average Order Weight: ${avgWeight.toFixed(1)} lbs
- Total Shipments Created: ${filteredShipments.length}

STATUS DISTRIBUTION:
${Object.entries(statusBreakdown).map(([status, count]) => `- ${status}: ${count}`).join('\n')}

PRIORITY DISTRIBUTION:
${Object.entries(priorityBreakdown).map(([priority, count]) => `- ${priority}: ${count}`).join('\n')}

FULFILLMENT TIME DISTRIBUTION:
- Fastest: ${Math.min(...fulfillmentTimes)}d
- Slowest: ${Math.max(...fulfillmentTimes)}d
- Average: ${avgFulfillmentTime.toFixed(1)}d
`;

    // Get AI insights
    const insights = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a production and fulfillment operations analyst. Analyze this data and provide actionable insights.

${analysisContext}

Based on this data, provide:
1. Overall health assessment (1-2 sentences)
2. Top 3 bottlenecks or areas of concern
3. Top 3 actionable recommendations to improve efficiency and reduce lead times
4. One key trend or pattern you notice

Be specific and practical. Focus on what the team can actually do to improve.`,
      response_json_schema: {
        type: "object",
        properties: {
          health_assessment: {
            type: "string",
            description: "Overall assessment of production health"
          },
          bottlenecks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                severity: { type: "string", enum: ["high", "medium", "low"] }
              }
            },
            description: "Top 3 bottlenecks"
          },
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                impact: { type: "string", enum: ["high", "medium", "low"] }
              }
            },
            description: "Top 3 recommendations"
          },
          key_trend: {
            type: "string",
            description: "One key trend observed"
          }
        },
        required: ["health_assessment", "bottlenecks", "recommendations", "key_trend"]
      }
    });

    return Response.json({
      metrics: {
        totalOrders,
        fulfilledOrders,
        pendingOrders,
        productionOrders,
        avgFulfillmentTime: avgFulfillmentTime.toFixed(1),
        avgWeight: avgWeight.toFixed(1),
        totalShipments: filteredShipments.length
      },
      insights
    });

  } catch (error) {
    console.error('Error analyzing insights:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});