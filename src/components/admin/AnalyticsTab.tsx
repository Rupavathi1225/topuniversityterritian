import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface PageView {
  id: string;
  session_id: string;
  page_path: string;
  page_title: string;
  viewed_at: string;
}

interface Click {
  id: string;
  session_id: string;
  link_name: string;
  link_url: string;
  clicked_at: string;
  ip_address: string | null;
  country: string | null;
  device: string | null;
}

interface Session {
  session_id: string;
  started_at: string;
  last_activity: string;
  pageViews: number;
  clicks: number;
  pagesList: PageView[];
  clicksList: Click[];
}

const AnalyticsTab = () => {
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalPageViews, setTotalPageViews] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [uniqueClicks, setUniqueClicks] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    // Fetch all data
    const [sessionsRes, pageViewsRes, clicksRes] = await Promise.all([
      supabase.from("sessions").select("*").order("started_at", { ascending: false }),
      supabase.from("page_views").select("*").order("viewed_at", { ascending: false }),
      supabase.from("click_tracking").select("*").order("clicked_at", { ascending: false })
    ]);

    if (sessionsRes.error || pageViewsRes.error || clicksRes.error) {
      console.error("Error fetching analytics:", sessionsRes.error || pageViewsRes.error || clicksRes.error);
      return;
    }

    const pageViewsData = pageViewsRes.data || [];
    const clicksData = clicksRes.data || [];
    const sessionsData = sessionsRes.data || [];

    // Set totals
    setTotalSessions(sessionsData.length);
    setTotalPageViews(pageViewsData.length);
    setTotalClicks(clicksData.length);

    // Calculate unique clicks (unique session_id + link_id combinations)
    const uniqueClickSet = new Set(
      clicksData.map((c: any) => `${c.session_id}_${c.link_id}`)
    );
    setUniqueClicks(uniqueClickSet.size);

    // Group by session
    const sessionMap = new Map<string, Session>();
    
    sessionsData.forEach((session) => {
      sessionMap.set(session.session_id, {
        session_id: session.session_id,
        started_at: session.started_at,
        last_activity: session.last_activity,
        pageViews: 0,
        clicks: 0,
        pagesList: [],
        clicksList: [],
      });
    });

    // Add page views to sessions
    pageViewsData.forEach((view) => {
      const session = sessionMap.get(view.session_id);
      if (session) {
        session.pageViews++;
        session.pagesList.push(view);
      } else {
        // Create session if doesn't exist
        sessionMap.set(view.session_id, {
          session_id: view.session_id,
          started_at: view.viewed_at,
          last_activity: view.viewed_at,
          pageViews: 1,
          clicks: 0,
          pagesList: [view],
          clicksList: [],
        });
      }
    });

    // Add clicks to sessions
    clicksData.forEach((click) => {
      const session = sessionMap.get(click.session_id);
      if (session) {
        session.clicks++;
        session.clicksList.push(click);
      }
    });

    setSessions(Array.from(sessionMap.values()));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getSessionDuration = (startedAt: string, lastActivity: string) => {
    const start = new Date(startedAt);
    const end = new Date(lastActivity);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    if (diffMins === 0) return `${diffSecs}s`;
    return `${diffMins}m ${diffSecs}s`;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Analytics Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-secondary border-border">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary">{totalSessions}</div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
              <div className="text-xs text-muted-foreground mt-1">Unique visitors tracked</div>
            </CardContent>
          </Card>
          <Card className="bg-secondary border-border">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-accent">{totalPageViews}</div>
              <div className="text-sm text-muted-foreground">Page Views</div>
              <div className="text-xs text-muted-foreground mt-1">Total pages viewed</div>
            </CardContent>
          </Card>
          <Card className="bg-secondary border-border">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-amber-500">{totalClicks}</div>
              <div className="text-sm text-muted-foreground">Total Clicks</div>
              <div className="text-xs text-muted-foreground mt-1">All clicks tracked</div>
            </CardContent>
          </Card>
          <Card className="bg-secondary border-border">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-emerald-500">{uniqueClicks}</div>
              <div className="text-sm text-muted-foreground">Unique Clicks</div>
              <div className="text-xs text-muted-foreground mt-1">Distinct click events</div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions Table */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Session Details</h3>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead className="w-[200px]">Session ID</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-center">Page Views</TableHead>
                  <TableHead className="text-center">Clicks</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <>
                    <TableRow 
                      key={session.session_id}
                      className="cursor-pointer hover:bg-secondary/50"
                      onClick={() => setExpandedSession(
                        expandedSession === session.session_id ? null : session.session_id
                      )}
                    >
                      <TableCell className="font-mono text-xs">
                        {session.session_id.substring(0, 25)}...
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(session.started_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <Badge variant="secondary">
                          {getSessionDuration(session.started_at, session.last_activity)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                          {session.pageViews}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                          {session.clicks}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(session.last_activity)}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {expandedSession === session.session_id ? "▼" : "▶"}
                        </span>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Details */}
                    {expandedSession === session.session_id && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/30">
                          <div className="p-4 space-y-4">
                            {/* Page Views */}
                            {session.pagesList.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                                  <span className="text-accent">📄</span> Page Views ({session.pagesList.length})
                                </h4>
                                <div className="space-y-1">
                                  {session.pagesList.map((view) => (
                                    <div key={view.id} className="flex items-center justify-between text-xs bg-background p-2 rounded">
                                      <div className="flex-1">
                                        <span className="font-medium">{view.page_title}</span>
                                        <span className="text-muted-foreground ml-2">{view.page_path}</span>
                                      </div>
                                      <span className="text-muted-foreground">
                                        {new Date(view.viewed_at).toLocaleTimeString()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Clicks */}
                            {session.clicksList.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                                  <span className="text-amber-500">🖱️</span> Link Clicks ({session.clicksList.length})
                                </h4>
                                <div className="space-y-1">
                                  {session.clicksList.map((click) => (
                                    <div key={click.id} className="flex items-center justify-between text-xs bg-background p-3 rounded space-y-1">
                                      <div className="flex-1 space-y-1">
                                        <div>
                                          <span className="font-medium">{click.link_name}</span>
                                          <span className="text-muted-foreground ml-2 truncate max-w-md inline-block">
                                            {click.link_url}
                                          </span>
                                        </div>
                                        <div className="flex gap-3 text-muted-foreground">
                                          {click.ip_address && (
                                            <span className="font-mono">IP: {click.ip_address}</span>
                                          )}
                                          {click.country && (
                                            <Badge variant="secondary" className="text-xs">{click.country}</Badge>
                                          )}
                                          {click.device && (
                                            <span>Device: {click.device}</span>
                                          )}
                                        </div>
                                      </div>
                                      <span className="text-muted-foreground">
                                        {new Date(click.clicked_at).toLocaleTimeString()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {session.pagesList.length === 0 && session.clicksList.length === 0 && (
                              <div className="text-sm text-muted-foreground text-center py-4">
                                No activity recorded for this session
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>

          {sessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No sessions tracked yet. Visit the site to start tracking.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsTab;
