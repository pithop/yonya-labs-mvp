import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import MenuClient from './MenuClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createClient();
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name')
    .eq('slug', slug)
    .single();

  if (!restaurant) return { title: 'Restaurant introuvable' };

  return {
    title: `${restaurant.name} — Commandez en ligne | Yonya Labs`,
    description: `Commandez en ligne chez ${restaurant.name}. Click & Collect ou Livraison à domicile. 0% de commission.`,
  };
}

export default async function RestaurantMenuPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: restaurant, error: restError } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .single();

  if (restError || !restaurant) {
    notFound();
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('sort_order', { ascending: true });

  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('is_available', true)
    .order('name', { ascending: true });

  return (
    <MenuClient
      restaurant={restaurant}
      categories={categories || []}
      menuItems={menuItems || []}
    />
  );
}
