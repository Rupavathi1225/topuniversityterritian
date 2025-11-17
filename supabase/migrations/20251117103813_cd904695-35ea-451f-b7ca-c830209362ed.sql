-- Add page_views table to track all page visits
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  page_title TEXT NOT NULL,
  referrer TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to page_views"
ON public.page_views FOR SELECT
USING (true);

CREATE POLICY "Allow public insert to page_views"
ON public.page_views FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow all operations on page_views for admin"
ON public.page_views FOR ALL
USING (true)
WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX idx_page_views_session_id ON public.page_views(session_id);
CREATE INDEX idx_page_views_viewed_at ON public.page_views(viewed_at DESC);
CREATE INDEX idx_click_tracking_session_id ON public.click_tracking(session_id);
CREATE INDEX idx_sessions_started_at ON public.sessions(started_at DESC);