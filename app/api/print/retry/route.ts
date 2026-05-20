import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  // Sécurisation optionnelle par clé secrète via paramètres d'URL pour le Cron
  const { searchParams } = new URL(request.url);
  const cronKey = searchParams.get('key');
  
  if (process.env.CRON_SECRET && cronKey !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const supabase = createClient();

  // 1. Récupérer les tâches d'impression en échec ou en attente ayant subi moins de 5 tentatives
  const { data: queuedJobs, error: fetchError } = await supabase
    .from('print_queue')
    .select('id, printer_uid, payload, attempts')
    .in('status', ['PENDING', 'FAILED'])
    .lt('attempts', 5);

  if (fetchError) {
    console.error('Erreur récupération print_queue:', fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!queuedJobs || queuedJobs.length === 0) {
    return NextResponse.json({ success: true, processed: 0 });
  }

  const apiSid = process.env.EXPEDY_API_SID;
  const apiToken = process.env.EXPEDY_API_TOKEN;

  if (!apiSid || !apiToken) {
    return NextResponse.json({ error: 'Configuration API Expedy manquante.' }, { status: 500 });
  }

  const results = [];

  // 2. Parcourir et tenter de réimprimer chaque ticket
  for (const job of queuedJobs) {
    const nextAttempts = job.attempts + 1;
    try {
      const expedyResponse = await fetch(`https://www.expedy.fr/api/v2/printers/${job.printer_uid}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${apiSid}:${apiToken}`,
        },
        body: JSON.stringify({
          printer_msg: job.payload.msg,
          origin: 'Yonya_Labs_NextJS_Backend_Retry',
        }),
      });

      if (expedyResponse.ok) {
        // En cas de succès : passer au statut 'SENT' et vider le message d'erreur
        await supabase
          .from('print_queue')
          .update({
            status: 'SENT',
            attempts: nextAttempts,
            updated_at: new Date().toISOString(),
            error_message: null,
          })
          .eq('id', job.id);
        
        results.push({ id: job.id, status: 'SUCCESS' });
      } else {
        const errorText = await expedyResponse.text();
        throw new Error(`API Expedy retour: ${expedyResponse.status} - ${errorText}`);
      }
    } catch (printError: any) {
      // En cas d'échec persistant : incrémenter les tentatives et enregistrer l'erreur
      await supabase
        .from('print_queue')
        .update({
          status: 'FAILED',
          attempts: nextAttempts,
          updated_at: new Date().toISOString(),
          error_message: printError.message,
        })
        .eq('id', job.id);

      results.push({ id: job.id, status: 'FAILED', error: printError.message });
    }
  }

  return NextResponse.json({ success: true, processed: queuedJobs.length, results });
}
