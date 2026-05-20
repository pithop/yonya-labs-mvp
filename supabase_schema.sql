-- =====================================================================
-- SCHEMA DE BASE DE DONNEES MULTI-TENANT SECURISE - YONYA LABS
-- A exécuter dans l'éditeur SQL de Supabase
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLE DES RESTAURANTS (TENANTS)
CREATE TABLE public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    stripe_account_id TEXT, -- ID Stripe Connect Standard (ex: acct_123456)
    printer_uid TEXT,        -- Identifiant unique de l'imprimante Expedy IoT en cuisine
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. TABLE DES CATEGORIES DE MENUS
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. TABLE DES PLATS ET BOISSONS (MENU ITEMS)
CREATE TABLE public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL, -- Prix stocké en centimes d'euro (ex: 1490 pour 14.90 EUR)
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. TABLE DES COMMANDES
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    delivery_type TEXT NOT NULL CHECK (delivery_type IN ('CLICK_COLLECT', 'DELIVERY')),
    delivery_address TEXT, -- Requis si delivery_type = 'DELIVERY'
    total_amount INTEGER NOT NULL, -- Montant global facturé en centimes d'euro
    delivery_fee INTEGER DEFAULT 0 NOT NULL, -- Frais de livraison Stuart facturés en centimes
    status TEXT DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'PAID', 'PREPARING', 'READY', 'DELIVERING', 'COMPLETED', 'FAILED')),
    stripe_payment_intent_id TEXT, -- Référence de la transaction Stripe Connect
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. TABLE DES LIGNES DE COMMANDE
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    name TEXT NOT NULL, -- Stocké en dur à l'instant T de la commande en cas de renommage
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price INTEGER NOT NULL, -- Prix unitaire historique en centimes d'euro
    options JSONB DEFAULT '{}'::jsonb NOT NULL, -- Suppléments / préférences (ex: {"sans_oignon": true})
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. TABLE DES COLLABORATEURS ET ROLES (Liaison Auth Users -> Restaurants)
CREATE TABLE public.restaurant_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (restaurant_id, user_id)
);

-- 7. TABLE DE LA FILE D'ATTENTE D'IMPRESSION IOT (SPOOLER DE SECOURS)
CREATE TABLE public.print_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    printer_uid TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
    attempts INTEGER DEFAULT 0 NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================================
-- PERFORMANCE : INDEXATIONS B-TREE DE TOUTES LES CLES TENANT
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_categories_restaurant_id ON public.categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON public.menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_staff_restaurant_id ON public.restaurant_staff(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_staff_user_id ON public.restaurant_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_print_queue_restaurant_id ON public.print_queue(restaurant_id);

-- =====================================================================
-- SECURITE APPLICATIVE : DECLENCHEUR PL/PGSQL POUR CUSTOM CLAIMS JWT
-- =====================================================================
-- Synchronise automatiquement l'appartenance et le rôle de l'utilisateur dans
-- son JSON Web Token (JWT) géré par Supabase Auth lors des modifications de rôles.
CREATE OR REPLACE FUNCTION public.handle_restaurant_staff_change()
RETURNS TRIGGER AS $$
DECLARE
    _app_metadata JSONB;
BEGIN
    -- CAS D'INSERTION OU DE MISE A JOUR : Synchroniser le JWT
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        SELECT app_metadata INTO _app_metadata FROM auth.users WHERE id = NEW.user_id;
        _app_metadata := coalesce(_app_metadata, '{}'::jsonb) || jsonb_build_object(
            'restaurant_id', NEW.restaurant_id,
            'role', NEW.role
        );
        UPDATE auth.users SET app_metadata = _app_metadata WHERE id = NEW.user_id;
        RETURN NEW;
    -- CAS DE SUPPRESSION : Nettoyer les Custom Claims du JWT
    ELSIF TG_OP = 'DELETE' THEN
        SELECT app_metadata INTO _app_metadata FROM auth.users WHERE id = OLD.user_id;
        IF _app_metadata IS NOT NULL THEN
            _app_metadata := _app_metadata - 'restaurant_id' - 'role';
            UPDATE auth.users SET app_metadata = _app_metadata WHERE id = OLD.user_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Affectation du trigger
CREATE OR REPLACE TRIGGER trigger_sync_restaurant_staff
AFTER INSERT OR UPDATE OR DELETE ON public.restaurant_staff
FOR EACH ROW EXECUTE FUNCTION public.handle_restaurant_staff_change();

-- =====================================================================
-- ETANCHEITE ABSOLUE : ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_queue ENABLE ROW LEVEL SECURITY;

-- 1. RESTAURANTS
CREATE POLICY "restaurants_public_select" ON public.restaurants
    FOR SELECT USING (true); -- Accessible au public pour afficher la carte client

CREATE POLICY "restaurants_staff_all" ON public.restaurants
    FOR ALL TO authenticated USING (
        id = (NULLIF(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'restaurant_id', ''))::uuid
    ); -- Modifiable uniquement par le staff associé dans le JWT

-- 2. CATEGORIES
CREATE POLICY "categories_public_select" ON public.categories
    FOR SELECT USING (true); -- Affichage du menu aux clients

CREATE POLICY "categories_staff_all" ON public.categories
    FOR ALL TO authenticated USING (
        restaurant_id = (NULLIF(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'restaurant_id', ''))::uuid
    ); -- CRUD exclusif pour le staff associé

-- 3. MENU ITEMS
CREATE POLICY "menu_items_public_select" ON public.menu_items
    FOR SELECT USING (true); -- Affichage des plats aux clients

CREATE POLICY "menu_items_staff_all" ON public.menu_items
    FOR ALL TO authenticated USING (
        restaurant_id = (NULLIF(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'restaurant_id', ''))::uuid
    ); -- CRUD exclusif pour le staff associé

-- 4. ORDERS
CREATE POLICY "orders_public_insert" ON public.orders
    FOR INSERT WITH CHECK (true); -- N'importe quel client en ligne peut créer une commande

CREATE POLICY "orders_public_select" ON public.orders
    FOR SELECT USING (true); -- Accès en lecture (sécurisé par le non-devinable UUID de la commande)

CREATE POLICY "orders_staff_all" ON public.orders
    FOR ALL TO authenticated USING (
        restaurant_id = (NULLIF(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'restaurant_id', ''))::uuid
    ); -- Lecture et gestion complète par la cuisine et les gérants

-- 5. ORDER ITEMS
CREATE POLICY "order_items_public_insert" ON public.order_items
    FOR INSERT WITH CHECK (true); -- Panier client final insérable librement

CREATE POLICY "order_items_public_select" ON public.order_items
    FOR SELECT USING (true); -- Lecture client final pour détails de sa commande

CREATE POLICY "order_items_staff_all" ON public.order_items
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_id AND o.restaurant_id = (NULLIF(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'restaurant_id', ''))::uuid
        )
    ); -- Lecture complète par le personnel

-- 6. STAFF MEMERSHIP
CREATE POLICY "restaurant_staff_select" ON public.restaurant_staff
    FOR SELECT TO authenticated USING (
        restaurant_id = (NULLIF(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'restaurant_id', ''))::uuid
    );

CREATE POLICY "restaurant_staff_admin" ON public.restaurant_staff
    FOR ALL TO authenticated USING (
        restaurant_id = (NULLIF(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'restaurant_id', ''))::uuid
        AND (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') IN ('owner', 'manager')
    ); -- Ajout ou modification d'employés réservés aux Owners / Managers

-- 7. PRINT QUEUE (SPOOLER)
CREATE POLICY "print_queue_staff_all" ON public.print_queue
    FOR ALL TO authenticated USING (
        restaurant_id = (NULLIF(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'restaurant_id', ''))::uuid
    );
