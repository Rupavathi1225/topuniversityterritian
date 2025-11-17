import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Eye } from "lucide-react";

interface WebResult {
  id: string;
  name: string;
  title: string;
}

interface PrelandingPage {
  id: string;
  web_result_id: string;
  logo_url: string | null;
  main_image_url: string | null;
  headline: string;
  description: string | null;
  button_text: string;
  button_color: string;
  background_color: string;
  background_image_url: string | null;
  email_required: boolean;
}

const PrelandingTab = () => {
  const [webResults, setWebResults] = useState<WebResult[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<string>("");
  const [prelanding, setPrelanding] = useState<Partial<PrelandingPage>>({
    headline: "Welcome",
    description: "",
    button_text: "Visit Now",
    button_color: "#3b82f6",
    background_color: "#ffffff",
    email_required: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWebResults();
  }, []);

  useEffect(() => {
    if (selectedResultId) {
      fetchPrelandingPage(selectedResultId);
    }
  }, [selectedResultId]);

  const fetchWebResults = async () => {
    const { data, error } = await supabase
      .from("web_results")
      .select("id, name, title")
      .order("serial_number");

    if (error) {
      console.error("Error fetching web results:", error);
    } else {
      setWebResults(data || []);
    }
  };

  const fetchPrelandingPage = async (webResultId: string) => {
    const { data, error } = await supabase
      .from("prelanding_pages")
      .select("*")
      .eq("web_result_id", webResultId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching prelanding page:", error);
    } else if (data) {
      setPrelanding(data);
    } else {
      // Reset to defaults if no prelanding page exists
      setPrelanding({
        headline: "Welcome",
        description: "",
        button_text: "Visit Now",
        button_color: "#3b82f6",
        background_color: "#ffffff",
        email_required: true,
      });
    }
  };

  const handleFileUpload = async (file: File, field: 'logo_url' | 'main_image_url' | 'background_image_url') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `prelanding/${fileName}`;

      // Note: This requires a storage bucket to be created
      // For now, we'll just show a placeholder
      toast.info("File upload feature requires storage bucket setup");
      
      // Placeholder for actual implementation:
      // const { error: uploadError } = await supabase.storage
      //   .from('prelanding')
      //   .upload(filePath, file);
      
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    }
  };

  const handleSave = async () => {
    if (!selectedResultId) {
      toast.error("Please select a web result first");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("prelanding_pages")
        .upsert({
          web_result_id: selectedResultId,
          ...prelanding,
        });

      if (error) throw error;

      toast.success("Pre-landing page saved successfully!");
    } catch (error) {
      console.error("Error saving prelanding page:", error);
      toast.error("Failed to save pre-landing page");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    if (selectedResultId) {
      window.open(`/prelanding/${selectedResultId}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Pre-Landing Page Builder</h2>
        <p className="text-muted-foreground">Create and customize pre-landing pages for your web results</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Web Result</CardTitle>
          <CardDescription>Choose which web result this pre-landing page is for</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedResultId} onValueChange={setSelectedResultId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a web result" />
            </SelectTrigger>
            <SelectContent>
              {webResults.map((result) => (
                <SelectItem key={result.id} value={result.id}>
                  {result.name} - {result.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedResultId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Images & Logo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Logo URL</Label>
                <Input
                  value={prelanding.logo_url || ""}
                  onChange={(e) => setPrelanding({ ...prelanding, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <Label>Main Image URL</Label>
                <Input
                  value={prelanding.main_image_url || ""}
                  onChange={(e) => setPrelanding({ ...prelanding, main_image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label>Background Image URL (optional)</Label>
                <Input
                  value={prelanding.background_image_url || ""}
                  onChange={(e) => setPrelanding({ ...prelanding, background_image_url: e.target.value })}
                  placeholder="https://example.com/background.jpg"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Headline</Label>
                <Input
                  value={prelanding.headline || ""}
                  onChange={(e) => setPrelanding({ ...prelanding, headline: e.target.value })}
                  placeholder="Enter headline"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={prelanding.description || ""}
                  onChange={(e) => setPrelanding({ ...prelanding, description: e.target.value })}
                  placeholder="Enter description"
                  rows={4}
                />
              </div>

              <div>
                <Label>Button Text</Label>
                <Input
                  value={prelanding.button_text || ""}
                  onChange={(e) => setPrelanding({ ...prelanding, button_text: e.target.value })}
                  placeholder="Visit Now"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Styling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Button Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={prelanding.button_color || "#3b82f6"}
                    onChange={(e) => setPrelanding({ ...prelanding, button_color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={prelanding.button_color || "#3b82f6"}
                    onChange={(e) => setPrelanding({ ...prelanding, button_color: e.target.value })}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>

              <div>
                <Label>Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={prelanding.background_color || "#ffffff"}
                    onChange={(e) => setPrelanding({ ...prelanding, background_color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={prelanding.background_color || "#ffffff"}
                    onChange={(e) => setPrelanding({ ...prelanding, background_color: e.target.value })}
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={prelanding.email_required || false}
                  onCheckedChange={(checked) => setPrelanding({ ...prelanding, email_required: checked })}
                />
                <Label>Require Email Before Redirect</Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button onClick={handleSave} disabled={loading}>
              Save Pre-Landing Page
            </Button>
            <Button onClick={handlePreview} variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default PrelandingTab;
