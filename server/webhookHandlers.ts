import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string, uuid: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature, uuid);

    const stripe = await getUncachableStripeClient();
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      await sync.getWebhookSecret(uuid)
    );

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        
        const customer = await stripe.customers.retrieve(customerId);
        if ('metadata' in customer && customer.metadata?.userId) {
          const userId = customer.metadata.userId;
          const isActive = subscription.status === 'active' || subscription.status === 'trialing';
          
          await storage.updateUserStripeInfo(userId, {
            stripeSubscriptionId: subscription.id,
            isSubscribed: isActive,
          });
          
          console.log(`Updated subscription for user ${userId}: ${subscription.status}`);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        
        const customer = await stripe.customers.retrieve(customerId);
        if ('metadata' in customer && customer.metadata?.userId) {
          const userId = customer.metadata.userId;
          
          await storage.updateUserStripeInfo(userId, {
            isSubscribed: false,
          });
          
          console.log(`Cancelled subscription for user ${userId}`);
        }
        break;
      }
      
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode === 'subscription' && session.subscription) {
          console.log(`Checkout completed for subscription: ${session.subscription}`);
        }
        break;
      }
    }
  }
}
