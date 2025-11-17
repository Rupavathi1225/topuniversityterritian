-- Create landing_content table
CREATE TABLE public.landing_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create search_buttons table
CREATE TABLE public.search_buttons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  link TEXT,
  serial_number INTEGER NOT NULL,
  web_result_page INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create web_results table
CREATE TABLE public.web_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  link TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  logo_url TEXT,
  is_sponsored BOOLEAN DEFAULT false,
  web_result_page INTEGER NOT NULL DEFAULT 1,
  serial_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sessions table for tracking
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create click_tracking table
CREATE TABLE public.click_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  link_id UUID NOT NULL,
  link_url TEXT NOT NULL,
  link_name TEXT NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.landing_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_buttons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to landing_content"
ON public.landing_content FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to search_buttons"
ON public.search_buttons FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to web_results"
ON public.web_results FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to sessions"
ON public.sessions FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to click_tracking"
ON public.click_tracking FOR SELECT
USING (true);

-- Create policies for public write access (for tracking)
CREATE POLICY "Allow public insert to sessions"
ON public.sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update to sessions"
ON public.sessions FOR UPDATE
USING (true);

CREATE POLICY "Allow public insert to click_tracking"
ON public.click_tracking FOR INSERT
WITH CHECK (true);

-- Create policies for all operations on other tables (admin panel)
CREATE POLICY "Allow all operations on landing_content"
ON public.landing_content FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on search_buttons"
ON public.search_buttons FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on web_results"
ON public.web_results FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on click_tracking for admin"
ON public.click_tracking FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_landing_content_updated_at
BEFORE UPDATE ON public.landing_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_search_buttons_updated_at
BEFORE UPDATE ON public.search_buttons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_web_results_updated_at
BEFORE UPDATE ON public.web_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data
INSERT INTO public.landing_content (title, description)
VALUES (
  'Top Universities - Find Your Perfect Educational Institution',
  'Discover comprehensive information about top universities worldwide. Our platform helps you explore rankings, programs, admission requirements, and campus facilities. Whether you''re looking for undergraduate programs, graduate studies, or research opportunities, find detailed insights to make informed decisions about your academic future.'
);

-- Insert initial search buttons
INSERT INTO public.search_buttons (title, serial_number, web_result_page)
VALUES
  ('Best Universities in USA', 1, 1),
  ('Top Engineering Colleges', 2, 2),
  ('Medical Schools Rankings', 3, 3),
  ('Business Schools Worldwide', 4, 4),
  ('Computer Science Programs', 5, 5);

-- Insert sample web results for page 1
INSERT INTO public.web_results (name, link, title, description, logo_url, is_sponsored, web_result_page, serial_number)
VALUES
  ('MIT', 'https://mit.edu', 'Massachusetts Institute of Technology', 'World-renowned institution for science, engineering, and technology education. Consistently ranked among the top universities globally.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/MIT_logo.svg/200px-MIT_logo.svg.png', true, 1, 1),
  ('Stanford University', 'https://stanford.edu', 'Stanford University - Excellence in Education', 'Leading research university known for academic strength, wealth, and selectivity. Home to innovative programs and world-class faculty.', 'https://identity.stanford.edu/wp-content/uploads/sites/3/2020/07/block-s-right.png', false, 1, 2);