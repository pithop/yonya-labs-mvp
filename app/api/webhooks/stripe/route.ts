import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

// Désactive le parsing automatique pour s'assurer que nous pouvons extraire le Raw Body
export const dynamic = 'force-dynamic';

function generateEscPosTicket(order: any, orderItems: any[], restaurantName: string): string {
  const shortId = order.id.slice(-4).toUpperCase();
  let ticket = `<C><BOLD>NOUVELLE COMMANDE</BOLD></C>\n`;
  ticket += `<BR><C><L>#${shortId}</L></C>\n`;
  ticket += `<BR><C><BOLD>${restaurantName}</BOLD></C>\n`;
  ticket += `Date: ${new Date(order.created_at).toLocaleString('fr-FR')}\n`;
  ticket += `Type: ${order.delivery_type === 'DELIVERY' ? 'LIVRAISON STUART' : 'CLICK & COLLECT'}\n`;
  ticket += `Client: ${order.customer_name}\n`;
  ticket += `Tel: ${order.customer_phone}\n`;
  
  if (order.delivery_type === 'DELIVERY' && order.delivery_address) {
    ticket += `Adresse: ${order.delivery_address}\n`;
  }
  
  ticket += `<BR>--------------------------------\n`;
  
  orderItems.forEach((item: any) => {
    const priceFormatted = (item.price / 100).toFixed(2);
    // Alignement simple des colonnes
    const nameLine = `${item.quantity}x ${item.name}`;
    const dotsCount = Math.max(1, 23 - nameLine.length);
    ticket += `${nameLine}${'.'.repeat(dotsCount)}${priceFormatted} EUR\n`;
    
    if (item.options && typeof item.options === 'object') {
      Object.entries(item.options).forEach(([key, val]) => {
        ticket += `  * ${key}: ${val}\n`;
      });
    }
  });
  
  ticket += `--------------------------------\n`;
  
  const totalFormatted = (order.total_amount / 100).toFixed(2);
  const deliveryFormatted = (order.delivery_fee / 100).toFixed(2);
  
  if (order.delivery_fee > 0) {
    ticket += `Livraison (Stuart):      ${deliveryFormatted} EUR\n`;
  }
  ticket += `<BOLD>TOTAL PAYE:             ${totalFormatted} EUR</BOLD>\n`;
  ticket += `<BR><C><BOLD>PAIEMENT EN LIGNE VALIDE</BOLD></C>\n`;
  ticket += `<BR><C>Yonya Labs - 0% Commission</C>\n`;
  ticket += `<BR><BR><CUT/>`;
  
  return ticket;
}

export async function POST(request: Request) {
  let rawBody = '';
  try {
    rawBody = await request.text();
  } catch (err: any) {
    return NextResponse.json({ error: 'Impossible de lire le corps brut.' }, { status: 400 });
  }

  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Signature Stripe manquante ou configuration invalide.' }, { status: 400 });
  }

  let event;
  try {
    // Validation de l'intégrité de la requête reçue
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error('Erreur validation signature webhook Stripe:', err.message);
    return NextResponse.json({ error: `Webhook Signature Verification Failed: ${err.message}` }, { status: 400 });
  }

  // Nous traitons la validation de paiement
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object as any;
    const orderId = session.metadata?.order_id;
    const restaurantId = session.metadata?.restaurant_id;

    if (!orderId || !restaurantId) {
      return NextResponse.json({ received: true, info: 'Aucune métadonnée Yonya Labs trouvée.' });
    }

    // Client Supabase avec droits d'écriture serveur
    const supabase = createClient();

    // 1. Mettre à jour le statut de la commande à 'PAID'
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({ status: 'PAID' })
      .eq('id', orderId)
      .select()
      .single();

    if (orderError || !order) {
      console.error('Erreur mise à jour commande:', orderError);
      return NextResponse.json({ error: 'Commande introuvable ou mise à jour impossible.' }, { status: 404 });
    }

    // Récupérer le nom du restaurant et l'identifiant imprimante IoT
    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .select('name, printer_uid')
      .eq('id', restaurantId)
      .single();

    if (restError || !restaurant) {
      console.error('Erreur récupération détails restaurant:', restError);
      return NextResponse.json({ error: 'Restaurant introuvable.' }, { status: 404 });
    }

    // Récupérer les articles associés à la commande pour composer le ticket physique
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('name, quantity, price, options')
      .eq('order_id', orderId);

    if (itemsError || !orderItems || orderItems.length === 0) {
      console.error('Erreur récupération articles commandés:', itemsError);
    } else if (restaurant.printer_uid) {
      // 2. Générer le ticket ESC/POS Expedy
      const ticketPayload = generateEscPosTicket(order, orderItems, restaurant.name);

      // 3. Tenter l'impression IoT directe via l'API Cloud Expedy v2
      try {
        const printerUid = restaurant.printer_uid;
        const apiSid = process.env.EXPEDY_API_SID;
        const apiToken = process.env.EXPEDY_API_TOKEN;

        if (!apiSid || !apiToken) {
          throw new Error('Identifiants API Expedy Cloud Print manquants dans .env.');
        }

        const expedyResponse = await fetch(`https://www.expedy.fr/api/v2/printers/${printerUid}/print`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${apiSid}:${apiToken}`,
          },
          body: JSON.stringify({
            printer_msg: ticketPayload,
            origin: 'Yonya_Labs_NextJS_Backend',
          }),
        });

        if (expedyResponse.ok) {
          // Succès ! Impression transmise à l'imprimante
          await supabase.from('print_queue').insert({
            order_id: order.id,
            restaurant_id: restaurantId,
            printer_uid: printerUid,
            payload: { msg: ticketPayload },
            status: 'SENT',
            attempts: 1,
          });
        } else {
          // L'API Expedy a retourné une erreur (ex: HTTP 500, 401...)
          const errorText = await expedyResponse.text();
          throw new Error(`API Expedy retour: ${expedyResponse.status} - ${errorText}`);
        }
      } catch (printError: any) {
        console.error('Échec impression immédiate, mise en file d\'attente print_queue:', printError.message);
        
        // Enregistrement dans le spooler PostgreSQL de secours pour retry automatique via Cron
        await supabase.from('print_queue').insert({
          order_id: order.id,
          restaurant_id: restaurantId,
          printer_uid: restaurant.printer_uid,
          payload: { msg: generateEscPosTicket(order, orderItems, restaurant.name) },
          status: 'FAILED',
          attempts: 1,
          error_message: printError.message,
        });
      }
    }
  }

  // Renvoyer TOUJOURS HTTP 200 à Stripe pour éviter les tentatives de renvoi inutiles
  return NextResponse.json({ received: true });
}
