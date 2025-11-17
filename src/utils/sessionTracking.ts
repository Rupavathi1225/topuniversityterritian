import { supabase } from "@/integrations/supabase/client";

// Get or create a session ID
export const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('session_id');
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('session_id', sessionId);
    
    // Create session in database
    supabase.from('sessions').insert({
      session_id: sessionId,
      started_at: new Date().toISOString(),
      last_activity: new Date().toISOString()
    }).then(({ error }) => {
      if (error) console.error('Error creating session:', error);
    });
  }
  
  // Update last activity
  supabase.from('sessions')
    .update({ last_activity: new Date().toISOString() })
    .eq('session_id', sessionId)
    .then(({ error }) => {
      if (error) console.error('Error updating session:', error);
    });
  
  return sessionId;
};

// Track a click
export const trackClick = async (linkId: string, linkUrl: string, linkName: string) => {
  const sessionId = getSessionId();
  
  const { error } = await supabase.from('click_tracking').insert({
    session_id: sessionId,
    link_id: linkId,
    link_url: linkUrl,
    link_name: linkName,
    clicked_at: new Date().toISOString()
  });
  
  if (error) {
    console.error('Error tracking click:', error);
  }
};
