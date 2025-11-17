import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit, Plus } from "lucide-react";

interface WebResult {
  id: string;
  name: string;
  link: string;
  title: string;
  description: string;
  logo_url: string | null;
  is_sponsored: boolean;
  web_result_page: number;
  serial_number: number;
}

const WebResultsTab = () => {
  const { toast } = useToast();
  const [results, setResults] = useState<WebResult[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    link: "",
    title: "",
    description: "",
    logo_url: "",
    is_sponsored: false,
    web_result_page: "1",
    serial_number: "",
  });

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    const { data, error } = await supabase
      .from("web_results")
      .select("*")
      .order("web_result_page", { ascending: true })
      .order("serial_number", { ascending: true });

    if (error) {
      console.error("Error fetching results:", error);
    } else {
      setResults(data || []);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.link || !formData.title || !formData.serial_number) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const data = {
      ...formData,
      serial_number: parseInt(formData.serial_number),
      web_result_page: parseInt(formData.web_result_page),
      logo_url: formData.logo_url || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("web_results")
        .update(data)
        .eq("id", editingId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update result",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Result updated successfully",
        });
        resetForm();
        fetchResults();
      }
    } else {
      const { error } = await supabase.from("web_results").insert(data);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add result",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Result added successfully",
        });
        resetForm();
        fetchResults();
      }
    }
  };

  const handleEdit = (result: WebResult) => {
    setEditingId(result.id);
    setFormData({
      name: result.name,
      link: result.link,
      title: result.title,
      description: result.description,
      logo_url: result.logo_url || "",
      is_sponsored: result.is_sponsored,
      web_result_page: result.web_result_page.toString(),
      serial_number: result.serial_number.toString(),
    });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("web_results")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete result",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Result deleted successfully",
      });
      fetchResults();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      link: "",
      title: "",
      description: "",
      logo_url: "",
      is_sponsored: false,
      web_result_page: "1",
      serial_number: "",
    });
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Manage Web Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 p-4 bg-secondary rounded-lg">
          <h3 className="font-medium">{editingId ? "Edit Result" : "Add New Result"}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Stanford University"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Link</Label>
              <Input
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://example.com"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Result title"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Result description"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Logo URL (optional)</Label>
              <Input
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png (optional)"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Serial Number</Label>
              <Input
                type="number"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                placeholder="1"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Web Result Page (Where to Display)</Label>
              <Select value={formData.web_result_page} onValueChange={(v) => setFormData({ ...formData, web_result_page: v })}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">📄 Page 1 - URL: /webresult?wr=1</SelectItem>
                  <SelectItem value="2">📄 Page 2 - URL: /webresult?wr=2</SelectItem>
                  <SelectItem value="3">📄 Page 3 - URL: /webresult?wr=3</SelectItem>
                  <SelectItem value="4">📄 Page 4 - URL: /webresult?wr=4</SelectItem>
                  <SelectItem value="5">📄 Page 5 - URL: /webresult?wr=5</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select which web result page this item should appear on
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sponsored"
                checked={formData.is_sponsored}
                onCheckedChange={(checked) => setFormData({ ...formData, is_sponsored: checked as boolean })}
              />
              <Label htmlFor="sponsored" className="cursor-pointer">Sponsored</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="bg-primary hover:bg-button-hover">
              <Plus className="w-4 h-4 mr-2" />
              {editingId ? "Update Result" : "Add Result"}
            </Button>
            {editingId && (
              <Button onClick={resetForm} variant="outline">
                Cancel
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium">Existing Results (Organized by Page)</h3>
          {[1, 2, 3, 4, 5].map((page) => {
            const pageResults = results.filter(r => r.web_result_page === page);
            
            return (
              <div key={page} className="space-y-2 p-4 bg-secondary/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-primary flex items-center gap-2">
                    📄 Page {page} - URL: /webresult?wr={page}
                    <span className="text-xs text-muted-foreground">
                      ({pageResults.length} result{pageResults.length !== 1 ? 's' : ''})
                    </span>
                  </h4>
                  {pageResults.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">No results yet</span>
                  )}
                </div>
                {pageResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {result.name}
                        {result.is_sponsored && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                            Sponsored
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{result.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Position: {result.serial_number} | {result.link}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(result)}
                        className="text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(result.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          
          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              💡 How It Works
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• When users click <strong>"Related Category Box 1"</strong> → They see Page 1 results</li>
              <li>• When users click <strong>"Related Category Box 2"</strong> → They see Page 2 results</li>
              <li>• Each box redirects to its own page: /webresult?wr=1, /webresult?wr=2, etc.</li>
              <li>• Organize your results by selecting the correct page number when adding them</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebResultsTab;
