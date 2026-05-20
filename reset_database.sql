-- 1. NETTOYAGE (DROP) DE L'ANCIENNE STRUCTURE
DROP TABLE IF EXISTS public.print_queue CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.restaurant_staff CASCADE;
DROP TABLE IF EXISTS public.restaurants CASCADE;
DROP FUNCTION IF EXISTS public.handle_restaurant_staff_change CASCADE;

-- 2. CRÉATION DES TABLES
CREATE TABLE public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    stripe_account_id TEXT,
    printer_uid TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.restaurant_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL CHECK (price >= 0),
    is_available BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    delivery_type TEXT NOT NULL CHECK (delivery_type IN ('CLICK_COLLECT', 'DELIVERY')),
    delivery_address TEXT,
    total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
    delivery_fee INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'PAID', 'PREPARING', 'READY', 'DELIVERING', 'COMPLETED', 'FAILED')),
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price INTEGER NOT NULL CHECK (price >= 0),
    options JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.print_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'PRINTED', 'FAILED')),
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX idx_categories_restaurant_id ON public.categories(restaurant_id);
CREATE INDEX idx_menu_items_restaurant_id ON public.menu_items(restaurant_id);
CREATE INDEX idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX idx_restaurant_staff_restaurant_id ON public.restaurant_staff(restaurant_id);
CREATE INDEX idx_restaurant_staff_user_id ON public.restaurant_staff(user_id);
CREATE INDEX idx_print_queue_restaurant_id ON public.print_queue(restaurant_id);

-- 4. TRIGGER POUR SYNCHRONISER LE JWT
CREATE OR REPLACE FUNCTION public.handle_restaurant_staff_change()
RETURNS TRIGGER AS $$
DECLARE
    _app_metadata JSONB;
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        SELECT raw_app_meta_data INTO _app_metadata FROM auth.users WHERE id = NEW.user_id;
        _app_metadata := coalesce(_app_metadata, '{}'::jsonb) || jsonb_build_object(
            'restaurant_id', NEW.restaurant_id,
            'role', NEW.role
        );
        UPDATE auth.users SET raw_app_meta_data = _app_metadata WHERE id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        SELECT raw_app_meta_data INTO _app_metadata FROM auth.users WHERE id = OLD.user_id;
        IF _app_metadata IS NOT NULL THEN
            _app_metadata := _app_metadata - 'restaurant_id' - 'role';
            UPDATE auth.users SET raw_app_meta_data = _app_metadata WHERE id = OLD.user_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_sync_restaurant_staff
AFTER INSERT OR UPDATE OR DELETE ON public.restaurant_staff
FOR EACH ROW EXECUTE FUNCTION public.handle_restaurant_staff_change();

-- 5. SÉCURITÉ RLS (ROW LEVEL SECURITY)
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique des restaurants" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY "Le staff lit son restaurant" ON public.restaurants FOR SELECT 
USING (id = (NULLIF(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'restaurant_id', ''))::uuid);

CREATE POLICY "Lecture publique des catégories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Le staff gère les catégories" ON public.categories FOR ALL 
USING (restaurant_id = (NULLIF(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'restaurant_id', ''))::uuid);

CREATE POLICY "Lecture publique des articles" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Le staff gère les articles" ON public.menu_items FOR ALL 
USING (restaurant_id = (NULLIF(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'restaurant_id', ''))::uuid);

CREATE POLICY "Création publique des commandes" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Le staff gère les commandes" ON public.orders FOR ALL 
USING (restaurant_id = (NULLIF(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'restaurant_id', ''))::uuid);

CREATE POLICY "Création publique des lignes de commande" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Le staff gère les lignes" ON public.order_items FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id AND o.restaurant_id = (NULLIF(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'restaurant_id', ''))::uuid
));

-- 6. INSERTION DES DONNÉES (SEED) AVEC VOTRE COMPTE OWNER
INSERT INTO public.restaurants (id, name, slug, stripe_account_id, printer_uid)
VALUES ('rest-001-0000-0000-000000000000', 'La Brasserie du Coin', 'la-brasserie-du-coin', NULL, 'PRINTER-12345');

-- ON UTILISE ICI VOTRE UUID : e2f1064b-375e-4031-bf6d-db2cd50dcef1
INSERT INTO public.restaurant_staff (id, restaurant_id, user_id, role)
VALUES ('staff-001-0000-0000-000000000000', 'rest-001-0000-0000-000000000000', 'e2f1064b-375e-4031-bf6d-db2cd50dcef1', 'owner');

INSERT INTO public.categories (id, restaurant_id, name, sort_order)
VALUES 
  ('cat-001-0000-0000-000000000000', 'rest-001-0000-0000-000000000000', '🍔 Burgers', 0),
  ('cat-002-0000-0000-000000000000', 'rest-001-0000-0000-000000000000', '🍟 Accompagnements', 1);

INSERT INTO public.menu_items (id, restaurant_id, category_id, name, description, price, is_available)
VALUES 
  ('item-001-0000-0000-000000000000', 'rest-001-0000-0000-000000000000', 'cat-001-0000-0000-000000000000', 'Le Classique', 'Steak haché façon bouchère, cheddar affiné, salade, tomate, sauce maison.', 1250, true),
  ('item-002-0000-0000-000000000000', 'rest-001-0000-0000-000000000000', 'cat-002-0000-0000-000000000000', 'Frites Maison', 'Frites fraîches cuites en deux bains, croustillantes à souhait.', 400, true);
