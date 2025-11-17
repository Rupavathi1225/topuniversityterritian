import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmailCapture {
  id: string;
  email: string;
  session_id: string;
  ip_address: string | null;
  country: string | null;
  captured_at: string;
  web_results: {
    name: string;
    title: string;
  } | null;
}

const EmailCapturesTab = () => {
  const [captures, setCaptures] = useState<EmailCapture[]>([]);
  const [stats, setStats] = useState({ total: 0, unique: 0 });

  useEffect(() => {
    fetchEmailCaptures();
  }, []);

  const fetchEmailCaptures = async () => {
    const { data, error } = await supabase
      .from("email_captures")
      .select(`
        *,
        web_results (name, title)
      `)
      .order("captured_at", { ascending: false });

    if (error) {
      console.error("Error fetching email captures:", error);
    } else {
      setCaptures(data || []);
      
      // Calculate stats
      const uniqueEmails = new Set(data?.map(c => c.email) || []);
      setStats({
        total: data?.length || 0,
        unique: uniqueEmails.size,
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const exportToCSV = () => {
    const headers = ['Email', 'Web Result', 'Country', 'IP Address', 'Captured At'];
    const rows = captures.map(c => [
      c.email,
      c.web_results?.name || 'N/A',
      c.country || 'Unknown',
      c.ip_address || 'Unknown',
      formatDate(c.captured_at)
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-captures-${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Email Captures</h2>
          <p className="text-muted-foreground">View all captured email addresses</p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Captures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Unique Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.unique}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Email Captures</CardTitle>
          <CardDescription>Detailed list of all captured emails</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Web Result</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Captured At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {captures.map((capture) => (
                  <TableRow key={capture.id}>
                    <TableCell className="font-medium">{capture.email}</TableCell>
                    <TableCell>
                      {capture.web_results ? (
                        <div className="text-sm">
                          <div className="font-medium">{capture.web_results.name}</div>
                          <div className="text-muted-foreground">{capture.web_results.title}</div>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      {capture.country ? (
                        <Badge variant="secondary">{capture.country}</Badge>
                      ) : (
                        'Unknown'
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {capture.ip_address || 'Unknown'}
                    </TableCell>
                    <TableCell>{formatDate(capture.captured_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailCapturesTab;
