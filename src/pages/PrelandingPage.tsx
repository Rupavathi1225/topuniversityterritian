import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getSessionId } from "@/utils/sessionTracking";
import { getGeolocation, getDeviceType } from "@/utils/geolocation";

interface PrelandingPageData {
  id: string;
  logo_url: string | null;
  main_image_url: string | null;
  headline: string;
  description: string | null;
  button_text: string;
  button_color: string;
  background_color: string;
  background_image_url: string | null;
  email_required: boolean;
  web_results: {
    id: string;
    link: string;
    name: string;
  };
}

interface GeoRestriction {
  allowed_countries: string[];
  backlink: string;
}

const PrelandingPage = () => {
  const { webResultId } = useParams<{ webResultId: string }>();
  const navigate = useNavigate();
  const [prelanding, setPrelanding] = useState<PrelandingPageData | null>(null);
  const [geoRestriction, setGeoRestriction] = useState<GeoRestriction | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (webResultId) {
      fetchPrelandingPage();
      fetchGeoRestriction();
    }
  }, [webResultId]);

  const fetchPrelandingPage = async () => {
    const { data, error } = await supabase
      .from("prelanding_pages")
      .select(`
        *,
        web_results (id, link, name)
      `)
      .eq("web_result_id", webResultId)
      .single();

    if (error) {
      console.error("Error fetching prelanding page:", error);
      toast.error("Pre-landing page not found");
      navigate("/");
    } else {
      setPrelanding(data);
    }
  };

  const fetchGeoRestriction = async () => {
    const { data, error } = await supabase
      .from("geo_restrictions")
      .select("allowed_countries, backlink")
      .eq("web_result_id", webResultId)
      .maybeSingle();

    if (!error && data) {
      setGeoRestriction(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (prelanding?.email_required && !email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const sessionId = getSessionId();
      const geoData = await getGeolocation();

      // Save email capture if email is provided
      if (email) {
        const { error: emailError } = await supabase
          .from("email_captures")
          .insert({
            email,
            web_result_id: webResultId,
            session_id: sessionId,
            ip_address: geoData.ip,
            country: geoData.country,
          });

        if (emailError) {
          console.error("Error saving email:", emailError);
        }
      }

      // Check geo-restrictions
      let redirectUrl = prelanding?.web_results.link || "/";

      if (geoRestriction) {
        const isAllowed = geoRestriction.allowed_countries.length === 0 || 
                         geoRestriction.allowed_countries.includes(geoData.countryCode);

        if (!isAllowed) {
          redirectUrl = geoRestriction.backlink;
          toast.info(`Redirecting to alternate link (not available in ${geoData.country})`);
        }
      }

      // Redirect to final destination
      window.location.href = redirectUrl;
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!prelanding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const backgroundStyle: React.CSSProperties = {
    backgroundColor: prelanding.background_color,
    backgroundImage: prelanding.background_image_url 
      ? `url(${prelanding.background_image_url})` 
      : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={backgroundStyle}
    >
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8 space-y-6">
        {prelanding.logo_url && (
          <div className="flex justify-center">
            <img 
              src={prelanding.logo_url} 
              alt="Logo" 
              className="h-16 object-contain"
            />
          </div>
        )}

        {prelanding.main_image_url && (
          <div className="flex justify-center">
            <img 
              src={prelanding.main_image_url} 
              alt="Main" 
              className="max-w-full h-auto rounded-lg"
            />
          </div>
        )}

        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            {prelanding.headline}
          </h1>
          
          {prelanding.description && (
            <p className="text-lg text-gray-600">
              {prelanding.description}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {prelanding.email_required && (
            <div>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required={prelanding.email_required}
                className="w-full h-12 text-lg bg-gray-50 border-gray-300"
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-lg font-semibold"
            style={{ backgroundColor: prelanding.button_color }}
          >
            {loading ? "Please wait..." : prelanding.button_text}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PrelandingPage;
