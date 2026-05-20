import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { restaurantId, cartItems, customerDetails, deliveryType, deliveryAddress } = body;

    // 1. Validation de base des intrants
    if (!restaurantId || !cartItems || !cartItems.length || !customerDetails) {
      return NextResponse.json(
        { error: 'Données de panier ou de client invalides.' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 2. Récupérer le restaurant et son compte Stripe Connect
    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .select('id, name, slug, stripe_account_id')
      .eq('id', restaurantId)
      .single();

    if (restError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant introuvable.' }, { status: 404 });
    }

    // 3. Calcul des montants
    let foodSubtotal = 0;
    const lineItems = cartItems.map((item: any) => {
      foodSubtotal += item.price * item.quantity;
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.name,
          },
          unit_amount: item.price, // en centimes d'euro
        },
        quantity: item.quantity,
      };
    });

    const deliveryFee = deliveryType === 'DELIVERY' ? 600 : 0; // 6.00 EUR forfaitaires Stuart pour le MVP
    const totalAmount = foodSubtotal + deliveryFee;

    // Si livraison, ajouter le frais logistique en tant que ligne Stripe distincte
    if (deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Frais de Livraison (Coursier Stuart)',
          },
          unit_amount: deliveryFee,
        },
        quantity: 1,
      });
    }

    // 4. Enregistrer la commande au statut 'PENDING' dans Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurant.id,
        customer_name: customerDetails.name,
        customer_phone: customerDetails.phone,
        customer_email: customerDetails.email || null,
        delivery_type: deliveryType,
        delivery_address: deliveryAddress || null,
        total_amount: totalAmount,
        delivery_fee: deliveryFee,
        status: 'PENDING',
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Erreur insertion commande:', orderError);
      return NextResponse.json(
        { error: 'Impossible de créer la commande en base de données.' },
        { status: 500 }
      );
    }

    // Insérer les lignes d'articles de la commande (Order Items)
    const orderItemsPayload = cartItems.map((item: any) => ({
      order_id: order.id,
      menu_item_id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      options: item.options || {},
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload);
    if (itemsError) {
      console.error('Erreur insertion articles:', itemsError);
      // On continue mais on log l'erreur pour ne pas bloquer le paiement
    }

    // 5. Créer la session de paiement Stripe Checkout
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    
    const sessionPayload: any = {
      mode: 'payment',
      line_items: lineItems,
      success_url: `${origin}/${restaurant.slug}/checkout/success?order_id=${order.id}`,
      cancel_url: `${origin}/${restaurant.slug}/checkout/cancel?order_id=${order.id}`,
      metadata: {
        order_id: order.id,
        restaurant_id: restaurant.id,
      },
      payment_intent_data: {
        metadata: {
          order_id: order.id,
          restaurant_id: restaurant.id,
        },
      },
    };

    // Si on utilise Stripe Connect (Mode B2B 0% Commission réel)
    if (restaurant.stripe_account_id) {
      if (deliveryFee > 0) {
        sessionPayload.payment_intent_data.application_fee_amount = deliveryFee;
      }
    }

    // Création de la session (avec ou sans Connect selon que le restaurant est configuré)
    const session = await stripe.checkout.sessions.create(
      sessionPayload,
      restaurant.stripe_account_id ? { stripeAccount: restaurant.stripe_account_id } : undefined
    );

    // Mettre à jour l'ID du PaymentIntent ou Session Stripe dans la commande
    await supabase
      .from('orders')
      .update({ stripe_payment_intent_id: session.payment_intent })
      .eq('id', order.id);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Erreur inattendue checkout:', error);
    return NextResponse.json({ error: error.message || 'Erreur interne serveur.' }, { status: 500 });
  }
}
