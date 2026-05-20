import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY est manquant dans les variables d\'environnement.');
}

/**
 * Client Stripe unifié utilisé pour interagir avec l'API Stripe
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' as any, // Version stable recommandée de l'API
  typescript: true,
});
