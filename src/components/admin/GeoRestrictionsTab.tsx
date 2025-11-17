import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { X } from "lucide-react";
import { COUNTRIES } from "@/utils/geolocation";

interface WebResult {
  id: string;
  name: string;
  title: string;
}

interface GeoRestriction {
  id: string;
  web_result_id: string;
  allowed_countries: string[];
  backlink: string;
}

const GeoRestrictionsTab = () => {
  const [webResults, setWebResults] = useState<WebResult[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<string>("");
  const [restriction, setRestriction] = useState<Partial<GeoRestriction>>({
    allowed_countries: [],
    backlink: "",
  });
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWebResults();
  }, []);

  useEffect(() => {
    if (selectedResultId) {
      fetchGeoRestriction(selectedResultId);
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

  const fetchGeoRestriction = async (webResultId: string) => {
    const { data, error } = await supabase
      .from("geo_restrictions")
      .select("*")
      .eq("web_result_id", webResultId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching geo restriction:", error);
    } else if (data) {
      setRestriction(data);
    } else {
      setRestriction({
        allowed_countries: [],
        backlink: "",
      });
    }
  };

  const addCountry = () => {
    if (!selectedCountry) return;
    
    const currentCountries = restriction.allowed_countries || [];
    if (currentCountries.includes(selectedCountry)) {
      toast.error("Country already added");
      return;
    }

    setRestriction({
      ...restriction,
      allowed_countries: [...currentCountries, selectedCountry],
    });
    setSelectedCountry("");
  };

  const removeCountry = (countryCode: string) => {
    setRestriction({
      ...restriction,
      allowed_countries: (restriction.allowed_countries || []).filter(c => c !== countryCode),
    });
  };

  const handleSave = async () => {
    if (!selectedResultId) {
      toast.error("Please select a web result first");
      return;
    }

    if (!restriction.backlink) {
      toast.error("Please enter a backlink URL");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("geo_restrictions")
        .upsert({
          web_result_id: selectedResultId,
          allowed_countries: restriction.allowed_countries || [],
          backlink: restriction.backlink,
        });

      if (error) throw error;

      toast.success("Geo-restrictions saved successfully!");
    } catch (error) {
      console.error("Error saving geo-restrictions:", error);
      toast.error("Failed to save geo-restrictions");
    } finally {
      setLoading(false);
    }
  };

  const getCountryName = (code: string) => {
    return COUNTRIES.find(c => c.code === code)?.name || code;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Geo-Restrictions</h2>
        <p className="text-muted-foreground">Configure country-based access restrictions for web results</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Web Result</CardTitle>
          <CardDescription>Choose which web result to configure</CardDescription>
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
              <CardTitle>Allowed Countries</CardTitle>
              <CardDescription>
                Select which countries can access the main link. Users from other countries will be redirected to the backlink.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addCountry} disabled={!selectedCountry}>
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {(restriction.allowed_countries || []).map((code) => (
                  <Badge key={code} variant="secondary" className="pl-3 pr-1 py-1">
                    {getCountryName(code)}
                    <button
                      onClick={() => removeCountry(code)}
                      className="ml-2 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {(restriction.allowed_countries || []).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No countries added. If no countries are specified, all users will be redirected to the backlink.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Backlink URL</CardTitle>
              <CardDescription>
                Users from non-allowed countries will be redirected to this URL
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={restriction.backlink || ""}
                onChange={(e) => setRestriction({ ...restriction, backlink: e.target.value })}
                placeholder="https://example.com/not-available"
              />
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={loading}>
            Save Geo-Restrictions
          </Button>
        </>
      )}
    </div>
  );
};

export default GeoRestrictionsTab;
