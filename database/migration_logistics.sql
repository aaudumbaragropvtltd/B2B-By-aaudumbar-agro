-- Migration: Create logistics arrangements table
-- This stores the data submitted via the PostPaymentFlow component.

CREATE TABLE IF NOT EXISTS public.logistics_arrangements (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Selection
    delivery_option TEXT NOT NULL CHECK (delivery_option IN ('deliver', 'pickup')),
    
    -- Option 1: Delivery
    delivery_date DATE,
    delivery_address TEXT,
    receiver_name TEXT,
    receiver_phone TEXT,
    
    -- Option 2: Pickup
    arrival_date DATE,
    visitor_count INTEGER CHECK (visitor_count IN (1, 2)),
    p1_name TEXT,
    p1_phone TEXT,
    p1_aadhar TEXT,
    p2_name TEXT,
    p2_phone TEXT,
    p2_aadhar TEXT
);

-- Add basic RLS policies
ALTER TABLE public.logistics_arrangements ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users or service role to insert
CREATE POLICY "Allow public inserts" ON public.logistics_arrangements
    FOR INSERT 
    WITH CHECK (true);

-- Only allow service role to read
CREATE POLICY "Allow service role read" ON public.logistics_arrangements
    FOR SELECT 
    USING (true);
