import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ClickData {
  id: string;
  session_id: string;
  link_name: string;
  link_url: string;
  clicked_at: string;
}

interface SessionData {
  session_id: string;
  clicks: ClickData[];
  totalClicks: number;
  startedAt: string;
}

const AnalyticsTab = () => {
  const [sessions, setSessions] = useState<SessionData[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const { data: clicksData, error: clicksError } = await supabase
      .from("click_tracking")
      .select("*")
      .order("clicked_at", { ascending: false });

    const { data: sessionsData, error: sessionsError } = await supabase
      .from("sessions")
      .select("*")
      .order("started_at", { ascending: false });

    if (clicksError || sessionsError) {
      console.error("Error fetching analytics:", clicksError || sessionsError);
      return;
    }

    // Group clicks by session
    const sessionMap = new Map<string, SessionData>();
    
    sessionsData?.forEach((session) => {
      sessionMap.set(session.session_id, {
        session_id: session.session_id,
        clicks: [],
        totalClicks: 0,
        startedAt: session.started_at,
      });
    });

    clicksData?.forEach((click) => {
      const session = sessionMap.get(click.session_id);
      if (session) {
        session.clicks.push(click);
        session.totalClicks++;
      } else {
        // Session not in sessions table, create it
        sessionMap.set(click.session_id, {
          session_id: click.session_id,
          clicks: [click],
          totalClicks: 1,
          startedAt: click.clicked_at,
        });
      }
    });

    setSessions(Array.from(sessionMap.values()));
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Click Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-secondary border-border">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">
                {sessions.reduce((acc, s) => acc + s.totalClicks, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Clicks</div>
            </CardContent>
          </Card>
          <Card className="bg-secondary border-border">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{sessions.length}</div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
            </CardContent>
          </Card>
          <Card className="bg-secondary border-border">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">
                {sessions.length > 0
                  ? (sessions.reduce((acc, s) => acc + s.totalClicks, 0) / sessions.length).toFixed(1)
                  : 0}
              </div>
              <div className="text-sm text-muted-foreground">Avg. Clicks/Session</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Session Details</h3>
          {sessions.map((session) => (
            <Card key={session.session_id} className="bg-secondary border-border">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">
                    Session: {session.session_id.substring(0, 20)}...
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {session.totalClicks} clicks | Started: {new Date(session.startedAt).toLocaleString()}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Link Name</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Clicked At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {session.clicks.map((click) => (
                      <TableRow key={click.id}>
                        <TableCell className="font-medium">{click.link_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {click.link_url}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(click.clicked_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsTab;
