-- =====================================================================
-- SCRIPT DE SEED (DONNÉES DE TEST) - YONYA LABS MVP
-- À exécuter APRÈS supabase_schema.sql dans l'éditeur SQL Supabase
-- =====================================================================

-- 1. Créer un restaurant de démonstration
INSERT INTO public.restaurants (id, name, slug, stripe_account_id, printer_uid)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'La Brasserie du Coin',
  'brasserie-du-coin',
  NULL,  -- À remplacer par un vrai acct_XXXX Stripe en mode test
  NULL   -- À remplacer par un vrai UID Expedy
);

-- 2. Créer les catégories du menu
INSERT INTO public.categories (id, restaurant_id, name, sort_order) VALUES
  ('cat-001-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '🍔 Burgers', 0),
  ('cat-002-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '🍟 Accompagnements', 1),
  ('cat-003-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '🥤 Boissons', 2),
  ('cat-004-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '🍰 Desserts', 3);

-- 3. Ajouter les plats du menu
INSERT INTO public.menu_items (restaurant_id, category_id, name, description, price, is_available) VALUES
  -- Burgers
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-001-0000-0000-000000000001', 'Burger Signature', 'Bœuf Angus 180g, cheddar affiné, bacon crispy, sauce maison, pain brioché', 1490, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-001-0000-0000-000000000001', 'Burger Végétarien', 'Galette de lentilles et champignons, avocat, tomate, roquette, mayo vegan', 1290, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-001-0000-0000-000000000001', 'Double Cheese', 'Double steak haché, double cheddar, oignons caramélisés, cornichons, ketchup artisanal', 1690, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-001-0000-0000-000000000001', 'Chicken Burger', 'Poulet pané croustillant, coleslaw, sauce ranch, iceberg, pickles', 1390, true),
  -- Accompagnements
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-002-0000-0000-000000000002', 'Frites Maison', 'Pommes de terre fraîches, sel de Guérande', 450, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-002-0000-0000-000000000002', 'Frites Truffées', 'Frites maison, huile de truffe noire, parmesan râpé', 650, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-002-0000-0000-000000000002', 'Onion Rings', 'Oignons panés maison, sauce BBQ', 550, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-002-0000-0000-000000000002', 'Salade César', 'Romaine, poulet grillé, croûtons, parmesan, sauce césar', 890, true),
  -- Boissons
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-003-0000-0000-000000000003', 'Coca-Cola 33cl', NULL, 350, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-003-0000-0000-000000000003', 'Sprite 33cl', NULL, 350, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-003-0000-0000-000000000003', 'Eau Minérale 50cl', NULL, 250, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-003-0000-0000-000000000003', 'Limonade Artisanale', 'Citron pressé, menthe fraîche, sucre de canne', 490, true),
  -- Desserts
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-004-0000-0000-000000000004', 'Brownie Fondant', 'Chocolat noir Valrhona 70%, noix de pécan, glace vanille', 690, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-004-0000-0000-000000000004', 'Cookie Géant', 'Chunks de chocolat au lait, beurre de cacahuète', 490, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cat-004-0000-0000-000000000004', 'Milkshake Vanille', 'Glace vanille, lait frais, chantilly maison', 590, false);  -- En rupture !

-- =====================================================================
-- NOTE : POUR LIER UN UTILISATEUR SUPABASE AUTH AU RESTAURANT DE TEST
-- =====================================================================
-- Après avoir créé un utilisateur via Supabase Auth (Dashboard > Authentication),
-- exécutez cette requête en remplaçant <USER_UUID> par l'UUID de l'utilisateur :
--
-- INSERT INTO public.restaurant_staff (restaurant_id, user_id, role)
-- VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '<USER_UUID>', 'owner');
--
-- Le trigger automatique synchronisera le restaurant_id dans le JWT.
-- =====================================================================
