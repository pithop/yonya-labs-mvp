'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_type: 'CLICK_COLLECT' | 'DELIVERY';
  delivery_address: string | null;
  total_amount: number;
  delivery_fee: number;
  status: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PAID: { label: '💳 Payée', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  PREPARING: { label: '👨‍🍳 En préparation', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  READY: { label: '✅ Prête', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  DELIVERING: { label: '🛵 En livraison', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  COMPLETED: { label: '🎉 Terminée', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' },
  FAILED: { label: '❌ Échouée', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

const NEXT_STATUS: Record<string, string> = {
  PAID: 'PREPARING',
  PREPARING: 'READY',
  READY: 'COMPLETED',
};

export default function OrdersDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('active');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Charger les commandes existantes
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .neq('status', 'PENDING')
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) setOrders(data);
    };

    fetchOrders();

    // Écouter les nouvelles commandes en temps réel via Supabase Realtime
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Order;
            if (newOrder.status !== 'PENDING') {
              setOrders((prev) => [newOrder, ...prev]);
              // 🔔 Signal sonore d'alerte cuisine
              playAlertSound();
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Order;
            setOrders((prev) =>
              prev.map((o) => (o.id === updated.id ? updated : o))
            );
            if (updated.status === 'PAID') {
              playAlertSound();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const playAlertSound = () => {
    try {
      // Synthèse audio d'alerte sans fichier externe
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (err) {
      console.warn('Audio alert non supporté:', err);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const supabase = createClient();
    await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const activeStatuses = ['PAID', 'PREPARING', 'READY', 'DELIVERING'];
  const filteredOrders =
    filter === 'active'
      ? orders.filter((o) => activeStatuses.includes(o.status))
      : filter === 'completed'
      ? orders.filter((o) => o.status === 'COMPLETED')
      : orders;

  const activeCount = orders.filter((o) => activeStatuses.includes(o.status)).length;

  return (
    <div>
      {/* En-tête */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Commandes en direct</h1>
          <p className="mt-1 text-gray-500">
            {activeCount > 0 ? (
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                {activeCount} commande{activeCount > 1 ? 's' : ''} active{activeCount > 1 ? 's' : ''}
              </span>
            ) : (
              'Aucune commande active'
            )}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="mb-6 flex gap-2">
        {[
          { key: 'active', label: 'Actives' },
          { key: 'completed', label: 'Terminées' },
          { key: 'all', label: 'Toutes' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
              filter === f.key
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grille des commandes */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-700 py-20">
          <p className="text-xl text-gray-500">Aucune commande à afficher</p>
          <p className="mt-2 text-sm text-gray-600">
            Les nouvelles commandes apparaîtront ici instantanément
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredOrders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.PAID;
            const nextStatus = NEXT_STATUS[order.status];
            const shortId = order.id.slice(-4).toUpperCase();

            return (
              <div
                key={order.id}
                className={`rounded-2xl border p-5 transition-all hover:shadow-lg ${statusConfig.bg}`}
              >
                {/* Header de la carte commande */}
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-2xl font-black text-white">#{shortId}</span>
                  <span className={`text-sm font-semibold ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>

                {/* Détails */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Client</span>
                    <span className="font-medium text-white">{order.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Téléphone</span>
                    <span className="font-medium text-gray-300">{order.customer_phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type</span>
                    <span className="font-medium text-gray-300">
                      {order.delivery_type === 'DELIVERY' ? '🛵 Livraison' : '🏪 Click & Collect'}
                    </span>
                  </div>
                  {order.delivery_address && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Adresse</span>
                      <span className="max-w-[160px] truncate text-right font-medium text-gray-300">
                        {order.delivery_address}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-700/50 pt-2">
                    <span className="text-gray-500">Total</span>
                    <span className="text-lg font-extrabold text-orange-400">
                      {(order.total_amount / 100).toFixed(2)}€
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {new Date(order.created_at).toLocaleString('fr-FR')}
                  </div>
                </div>

                {/* Bouton d'action */}
                {nextStatus && (
                  <button
                    onClick={() => updateStatus(order.id, nextStatus)}
                    className="mt-4 w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:shadow-orange-500/25 active:scale-[0.98]"
                  >
                    {nextStatus === 'PREPARING' && '👨‍🍳 Lancer la préparation'}
                    {nextStatus === 'READY' && '✅ Marquer comme prête'}
                    {nextStatus === 'COMPLETED' && '🎉 Commande terminée'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
