-- Add IP address and country to click_tracking
ALTER TABLE click_tracking 
ADD COLUMN ip_address text,
ADD COLUMN country text,
ADD COLUMN device text;

-- Create geo_restrictions table for web results
CREATE TABLE geo_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  web_result_id uuid NOT NULL REFERENCES web_results(id) ON DELETE CASCADE,
  allowed_countries text[], -- Array of country codes
  backlink text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create prelanding_pages table
CREATE TABLE prelanding_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  web_result_id uuid UNIQUE REFERENCES web_results(id) ON DELETE CASCADE,
  logo_url text,
  main_image_url text,
  headline text NOT NULL DEFAULT 'Welcome',
  description text,
  button_text text NOT NULL DEFAULT 'Visit Now',
  button_color text DEFAULT '#3b82f6',
  background_color text DEFAULT '#ffffff',
  background_image_url text,
  email_required boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create email_captures table
CREATE TABLE email_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  web_result_id uuid REFERENCES web_results(id),
  session_id text NOT NULL,
  ip_address text,
  country text,
  captured_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE geo_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prelanding_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_captures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for geo_restrictions
CREATE POLICY "Allow all operations on geo_restrictions" ON geo_restrictions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access to geo_restrictions" ON geo_restrictions FOR SELECT USING (true);

-- RLS Policies for prelanding_pages
CREATE POLICY "Allow all operations on prelanding_pages" ON prelanding_pages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access to prelanding_pages" ON prelanding_pages FOR SELECT USING (true);

-- RLS Policies for email_captures
CREATE POLICY "Allow all operations on email_captures" ON email_captures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access to email_captures" ON email_captures FOR SELECT USING (true);
CREATE POLICY "Allow public insert to email_captures" ON email_captures FOR INSERT WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_geo_restrictions_updated_at
BEFORE UPDATE ON geo_restrictions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prelanding_pages_updated_at
BEFORE UPDATE ON prelanding_pages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();