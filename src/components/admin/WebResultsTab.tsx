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
import { Trash2, Edit, Plus, Globe, Monitor } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { COUNTRIES } from "@/utils/geolocation";

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
  const [selectedResult, setSelectedResult] = useState<string>("");
  
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

  // Geo restrictions state
  const [geoRestrictions, setGeoRestrictions] = useState<{
    backlink: string;
    allowed_countries: string[];
  }>({
    backlink: "",
    allowed_countries: [],
  });

  // Prelanding page state
  const [prelanding, setPrelanding] = useState<any>({
    headline: "Welcome",
    description: "",
    button_text: "Visit Now",
    button_color: "#3b82f6",
    background_color: "#ffffff",
    email_required: true,
  });

  useEffect(() => {
    fetchResults();
  }, []);

  useEffect(() => {
    if (selectedResult) {
      fetchGeoRestrictions(selectedResult);
      fetchPrelandingPage(selectedResult);
    }
  }, [selectedResult]);

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

  const fetchGeoRestrictions = async (webResultId: string) => {
    const { data, error } = await supabase
      .from("geo_restrictions")
      .select("*")
      .eq("web_result_id", webResultId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching geo restrictions:", error);
    } else if (data) {
      setGeoRestrictions({
        backlink: data.backlink,
        allowed_countries: data.allowed_countries || [],
      });
    } else {
      setGeoRestrictions({ backlink: "", allowed_countries: [] });
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

  const handleSaveGeoRestrictions = async () => {
    if (!selectedResult) {
      toast({
        title: "Error",
        description: "Please select a web result first",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("geo_restrictions")
      .upsert({
        web_result_id: selectedResult,
        backlink: geoRestrictions.backlink,
        allowed_countries: geoRestrictions.allowed_countries,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save geo restrictions",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Geo restrictions saved successfully",
      });
    }
  };

  const handleSavePrelanding = async () => {
    if (!selectedResult) {
      toast({
        title: "Error",
        description: "Please select a web result first",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("prelanding_pages")
      .upsert({
        web_result_id: selectedResult,
        ...prelanding,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save prelanding page",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Pre-landing page saved successfully",
      });
    }
  };

  const toggleCountry = (countryCode: string) => {
    setGeoRestrictions((prev) => ({
      ...prev,
      allowed_countries: prev.allowed_countries.includes(countryCode)
        ? prev.allowed_countries.filter((c) => c !== countryCode)
        : [...prev.allowed_countries, countryCode],
    }));
  };

  const selectAllCountries = () => {
    setGeoRestrictions((prev) => ({
      ...prev,
      allowed_countries: COUNTRIES.map((c) => c.code),
    }));
  };

  const deselectAllCountries = () => {
    setGeoRestrictions((prev) => ({
      ...prev,
      allowed_countries: [],
    }));
  };

  return (
    <Tabs defaultValue="manage" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="manage">Manage Results</TabsTrigger>
        <TabsTrigger value="geo">Geo Restrictions</TabsTrigger>
        <TabsTrigger value="prelanding">Pre-landing Pages</TabsTrigger>
      </TabsList>

      <TabsContent value="manage">
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
                      <SelectItem value="1">📄 Page 1 - URL: /wr=1</SelectItem>
                      <SelectItem value="2">📄 Page 2 - URL: /wr=2</SelectItem>
                      <SelectItem value="3">📄 Page 3 - URL: /wr=3</SelectItem>
                      <SelectItem value="4">📄 Page 4 - URL: /wr=4</SelectItem>
                      <SelectItem value="5">📄 Page 5 - URL: /wr=5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex items-center gap-2">
                  <Checkbox
                    checked={formData.is_sponsored}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_sponsored: checked === true })
                    }
                  />
                  <Label>Is Sponsored</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="bg-primary text-primary-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  {editingId ? "Update Result" : "Add Result"}
                </Button>
                {editingId && (
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Existing Results</h3>
              {[1, 2, 3, 4, 5].map((page) => {
                const pageResults = results.filter((r) => r.web_result_page === page);
                if (pageResults.length === 0) return null;
                
                return (
                  <div key={page} className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Page {page} - /wr={page}</h4>
                    <div className="space-y-2">
                      {pageResults.map((result) => (
                        <div
                          key={result.id}
                          className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{result.name}</span>
                              {result.is_sponsored && (
                                <span className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded">
                                  Sponsored
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{result.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{result.link}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(result)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(result.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="geo">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Geo Restrictions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Select Web Result</Label>
              <Select value={selectedResult} onValueChange={setSelectedResult}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a web result" />
                </SelectTrigger>
                <SelectContent>
                  {results.map((result) => (
                    <SelectItem key={result.id} value={result.id}>
                      {result.name} - {result.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedResult && (
              <>
                <div className="space-y-2">
                  <Label>Backlink (Redirect for restricted countries)</Label>
                  <Input
                    value={geoRestrictions.backlink}
                    onChange={(e) => setGeoRestrictions({ ...geoRestrictions, backlink: e.target.value })}
                    placeholder="https://example.com/not-available"
                  />
                  <p className="text-xs text-muted-foreground">
                    Users from non-allowed countries will be redirected to this URL
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Allowed Countries</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={selectAllCountries}>
                        Select All
                      </Button>
                      <Button variant="outline" size="sm" onClick={deselectAllCountries}>
                        Deselect All
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select countries that can access this web result. Leave empty for worldwide access.
                  </p>
                  <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto p-4 bg-secondary rounded-lg">
                    {COUNTRIES.map((country) => (
                      <div key={country.code} className="flex items-center gap-2">
                        <Checkbox
                          checked={geoRestrictions.allowed_countries.includes(country.code)}
                          onCheckedChange={() => toggleCountry(country.code)}
                        />
                        <span className="text-sm">{country.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSaveGeoRestrictions}>
                  Save Geo Restrictions
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="prelanding">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Pre-Landing Page Builder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Select Web Result</Label>
              <Select value={selectedResult} onValueChange={setSelectedResult}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a web result" />
                </SelectTrigger>
                <SelectContent>
                  {results.map((result) => (
                    <SelectItem key={result.id} value={result.id}>
                      {result.name} - {result.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedResult && (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Logo URL</Label>
                    <Input
                      value={prelanding.logo_url || ""}
                      onChange={(e) => setPrelanding({ ...prelanding, logo_url: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Main Image URL</Label>
                    <Input
                      value={prelanding.main_image_url || ""}
                      onChange={(e) => setPrelanding({ ...prelanding, main_image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Background Image URL (optional)</Label>
                    <Input
                      value={prelanding.background_image_url || ""}
                      onChange={(e) => setPrelanding({ ...prelanding, background_image_url: e.target.value })}
                      placeholder="https://example.com/background.jpg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Headline</Label>
                    <Input
                      value={prelanding.headline || ""}
                      onChange={(e) => setPrelanding({ ...prelanding, headline: e.target.value })}
                      placeholder="Enter headline"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={prelanding.description || ""}
                      onChange={(e) => setPrelanding({ ...prelanding, description: e.target.value })}
                      placeholder="Enter description"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input
                      value={prelanding.button_text || ""}
                      onChange={(e) => setPrelanding({ ...prelanding, button_text: e.target.value })}
                      placeholder="Visit Now"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Button Color</Label>
                      <Input
                        type="color"
                        value={prelanding.button_color || "#3b82f6"}
                        onChange={(e) => setPrelanding({ ...prelanding, button_color: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Background Color</Label>
                      <Input
                        type="color"
                        value={prelanding.background_color || "#ffffff"}
                        onChange={(e) => setPrelanding({ ...prelanding, background_color: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={prelanding.email_required}
                      onCheckedChange={(checked) =>
                        setPrelanding({ ...prelanding, email_required: checked })
                      }
                    />
                    <Label>Require Email Capture</Label>
                  </div>
                </div>

                <Button onClick={handleSavePrelanding}>
                  Save Pre-landing Page
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default WebResultsTab;
