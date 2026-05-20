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

const NEXT_STATUS: Record<string, string> = {
  PAID: 'PREPARING',
  PREPARING: 'READY',
  READY: 'COMPLETED',
};

export default function OrdersDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();

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
              // Animation glow pour les nouvelles commandes
              setNewOrderIds((prev) => new Set(prev).add(newOrder.id));
              playAlertSound();
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Order;
            setOrders((prev) =>
              prev.map((o) => (o.id === updated.id ? updated : o))
            );
            if (updated.status === 'PAID') {
              setNewOrderIds((prev) => new Set(prev).add(updated.id));
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
      console.warn('Audio non supporté:', err);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    // Retirer l'effet glow lors de la prise en charge
    setNewOrderIds((prev) => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });

    const supabase = createClient();
    await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const paidOrders = orders.filter((o) => o.status === 'PAID');
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING');
  const readyOrders = orders.filter((o) => o.status === 'READY' || o.status === 'DELIVERING');

  const OrderCard = ({ order, isNew }: { order: Order; isNew: boolean }) => {
    const nextStatus = NEXT_STATUS[order.status];
    const shortId = order.id.slice(-4).toUpperCase();
    
    // Définir la couleur de bordure selon le statut pour le Kanban
    let borderColor = "border-white/10";
    let accentColor = "text-white";
    if (order.status === 'PAID') {
      borderColor = isNew ? "border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.4)]" : "border-orange-500/50";
      accentColor = "text-orange-400";
    } else if (order.status === 'PREPARING') {
      borderColor = "border-amber-400/50";
      accentColor = "text-amber-400";
    } else if (order.status === 'READY' || order.status === 'DELIVERING') {
      borderColor = "border-green-400/50";
      accentColor = "text-green-400";
    }

    return (
      <div className={`glass-panel p-5 rounded-2xl border-2 transition-all duration-500 ${borderColor} animate-fade-in-up`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-black text-white">#{shortId}</h3>
            <p className="text-xs text-zinc-400 mt-1">{new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="bg-white/10 rounded-lg px-3 py-1">
            <span className={`text-sm font-bold ${accentColor}`}>
              {(order.total_amount / 100).toFixed(2)}€
            </span>
          </div>
        </div>

        <div className="space-y-3 text-sm text-zinc-300 mb-6">
          <div className="flex items-center gap-2 bg-black/30 rounded-xl p-3 border border-white/5">
            <span className="text-xl">{order.delivery_type === 'DELIVERY' ? '🛵' : '🏪'}</span>
            <div>
              <p className="font-bold text-white">{order.customer_name}</p>
              <p className="text-xs text-zinc-500">{order.customer_phone}</p>
            </div>
          </div>
          {order.delivery_address && (
            <div className="bg-black/30 rounded-xl p-3 border border-white/5 text-xs">
              <p className="text-zinc-500 mb-1">Adresse de livraison :</p>
              <p className="font-medium text-white">{order.delivery_address}</p>
            </div>
          )}
        </div>

        {nextStatus && (
          <button
            onClick={() => updateStatus(order.id, nextStatus)}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 ${
              order.status === 'PAID'
                ? 'bg-orange-500 text-white hover:bg-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]'
                : order.status === 'PREPARING'
                ? 'bg-amber-500 text-white hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                : 'bg-green-500 text-white hover:bg-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]'
            }`}
          >
            {order.status === 'PAID' && '👨‍🍳 Accepter & Préparer'}
            {order.status === 'PREPARING' && '✅ Prêt (Cuisine)'}
            {(order.status === 'READY' || order.status === 'DELIVERING') && '🎉 Remise au client'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 bg-[#030712] text-white">
      {/* Header Dashboard */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Live Kitchen</h1>
          <p className="text-zinc-400 flex items-center gap-2 font-medium">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
            </span>
            Système synchronisé
          </p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Colonne 1: Nouvelles Commandes */}
        <div className="glass-panel bg-white/[0.02] rounded-3xl p-5 border-t-4 border-t-orange-500 min-h-[60vh]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              🚨 Nouvelles
              <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{paidOrders.length}</span>
            </h2>
          </div>
          <div className="space-y-4">
            {paidOrders.length === 0 ? (
              <p className="text-zinc-600 italic text-sm text-center py-10">En attente de commandes...</p>
            ) : (
              paidOrders.map(o => <OrderCard key={o.id} order={o} isNew={newOrderIds.has(o.id)} />)
            )}
          </div>
        </div>

        {/* Colonne 2: En Préparation */}
        <div className="glass-panel bg-white/[0.02] rounded-3xl p-5 border-t-4 border-t-amber-500 min-h-[60vh]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              👨‍🍳 En Cuisine
              <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{preparingOrders.length}</span>
            </h2>
          </div>
          <div className="space-y-4">
            {preparingOrders.length === 0 ? (
              <p className="text-zinc-600 italic text-sm text-center py-10">Aucune préparation en cours</p>
            ) : (
              preparingOrders.map(o => <OrderCard key={o.id} order={o} isNew={false} />)
            )}
          </div>
        </div>

        {/* Colonne 3: Prêtes */}
        <div className="glass-panel bg-white/[0.02] rounded-3xl p-5 border-t-4 border-t-green-500 min-h-[60vh]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              🎒 Prêtes à partir
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">{readyOrders.length}</span>
            </h2>
          </div>
          <div className="space-y-4">
            {readyOrders.length === 0 ? (
              <p className="text-zinc-600 italic text-sm text-center py-10">Aucune commande en attente de retrait</p>
            ) : (
              readyOrders.map(o => <OrderCard key={o.id} order={o} isNew={false} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
