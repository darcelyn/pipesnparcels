import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items } = await req.json();

    if (!items || items.length === 0) {
      return Response.json({ error: 'No items provided' }, { status: 400 });
    }

    // Format the production list as HTML
    const today = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });

    const itemRows = items.map(item => `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 8px;">${item.order_number}</td>
        <td style="padding: 8px;">${item.shorthand || item.name}</td>
        <td style="padding: 8px; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px;">${item.special_options || ''}</td>
        <td style="padding: 8px;"></td>
      </tr>
    `).join('');

    const emailBody = `
      <div style="font-family: Arial, sans-serif;">
        <h2 style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px;">
          ${today} | Daily Production List
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="border-bottom: 2px solid #000;">
              <th style="text-align: left; padding: 8px; font-weight: bold;">Order #</th>
              <th style="text-align: left; padding: 8px; font-weight: bold;">Item Name</th>
              <th style="text-align: center; padding: 8px; font-weight: bold;">Qty</th>
              <th style="text-align: left; padding: 8px; font-weight: bold;">Special Options</th>
              <th style="text-align: left; padding: 8px; font-weight: bold;">Order Options</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
        <p style="margin-top: 20px; color: #666;">
          Total items: ${items.length}
        </p>
      </div>
    `;

    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `Production List - ${today}`,
      body: emailBody
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});