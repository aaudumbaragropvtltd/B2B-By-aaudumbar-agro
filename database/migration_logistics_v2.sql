-- ============================================================================
-- B2B INDIA — LOGISTICS, SHIPMENTS & GATE PASS SCHEMA (V2)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.logistics_arrangements (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    order_id TEXT,
    buyer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Delivery Method: 'deliver' | 'pickup'
    delivery_option TEXT NOT NULL CHECK (delivery_option IN ('deliver', 'pickup')),
    
    -- Option 1: Factory / Port Delivery
    delivery_date DATE,
    delivery_address TEXT,
    receiver_name TEXT,
    receiver_phone TEXT,
    transporter_name TEXT,
    
    -- Option 2: Self Warehouse Pickup & Gate Pass
    arrival_date DATE,
    visitor_count INTEGER DEFAULT 1,
    vehicle_number TEXT,
    p1_name TEXT,
    p1_phone TEXT,
    p1_aadhar TEXT,
    p2_name TEXT,
    p2_phone TEXT,
    p2_aadhar TEXT,
    
    -- Tracking & Status
    tracking_number TEXT,
    dispatch_status TEXT DEFAULT 'confirmed' CHECK (dispatch_status IN ('pending', 'confirmed', 'in_transit', 'out_for_delivery', 'delivered', 'ready_for_pickup', 'cancelled')),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for fast lookups
CREATE INDEX IF NOT EXISTS idx_logistics_order_id ON public.logistics_arrangements(order_id);
CREATE INDEX IF NOT EXISTS idx_logistics_buyer_id ON public.logistics_arrangements(buyer_id);
CREATE INDEX IF NOT EXISTS idx_logistics_supplier_id ON public.logistics_arrangements(supplier_id);
CREATE INDEX IF NOT EXISTS idx_logistics_tracking ON public.logistics_arrangements(tracking_number);

-- Enable RLS
ALTER TABLE public.logistics_arrangements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to logistics" ON public.logistics_arrangements
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated read logistics" ON public.logistics_arrangements
    FOR SELECT USING (true);

CREATE POLICY "Allow service role all logistics" ON public.logistics_arrangements
    FOR ALL USING (true);
