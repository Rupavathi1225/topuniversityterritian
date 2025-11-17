import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getSessionId, trackClick, trackPageView } from "@/utils/sessionTracking";
import { getGeolocation, getDeviceType } from "@/utils/geolocation";

interface WebResult {
  id: string;
  name: string;
  link: string;
  title: string;
  description: string;
  logo_url: string | null;
  is_sponsored: boolean;
  serial_number: number;
}

interface WebResultProps {
  pageNumber: number;
}

const WebResult = ({ pageNumber }: WebResultProps) => {
  const navigate = useNavigate();
  const [sponsoredResults, setSponsoredResults] = useState<WebResult[]>([]);
  const [regularResults, setRegularResults] = useState<WebResult[]>([]);

  useEffect(() => {
    getSessionId(); // Initialize session tracking
    trackPageView(`/wr=${pageNumber}`, `Web Results Page ${pageNumber}`);
    fetchResults();
  }, [pageNumber]);

  const fetchResults = async () => {
    const { data, error } = await supabase
      .from("web_results")
      .select("*")
      .eq("web_result_page", pageNumber)
      .order("serial_number", { ascending: true });

    if (error) {
      console.error("Error fetching results:", error);
    } else {
      const sponsored = data?.filter(r => r.is_sponsored) || [];
      const regular = data?.filter(r => !r.is_sponsored) || [];
      setSponsoredResults(sponsored);
      setRegularResults(regular);
    }
  };

  const handleLinkClick = async (result: WebResult, e: React.MouseEvent) => {
    e.preventDefault();
    
    // Get geolocation data
    const geoData = await getGeolocation();
    const device = getDeviceType();
    
    // Track the click with geo data
    await trackClick(result.id, result.link, result.name, geoData.ip, geoData.country, device);
    
    // Check if there's a prelanding page for this result
    const { data: prelandingData } = await supabase
      .from("prelanding_pages")
      .select("id")
      .eq("web_result_id", result.id)
      .maybeSingle();
    
    if (prelandingData) {
      // Redirect to prelanding page
      window.location.href = `/prelanding/${result.id}`;
    } else {
      // Direct redirect to the link
      window.location.href = result.link;
    }
  };

  const getLogoDisplay = (name: string, logoUrl: string | null) => {
    if (logoUrl) {
      return (
        <img
          src={logoUrl}
          alt={name}
          className="w-10 h-10 rounded-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg font-semibold text-primary">
        {name.charAt(0).toUpperCase()}
      </div>
    );
  };

  const ResultCard = ({ result }: { result: WebResult }) => (
    <div className="py-4">
      <div className="flex gap-4">
        <div className="flex-shrink-0 mt-1">
          {getLogoDisplay(result.name, result.logo_url)}
          {result.logo_url && (
            <div className="hidden w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg font-semibold text-primary">
              {result.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="text-sm text-muted-foreground mb-1">{result.name}</div>
          <a
            href={result.link}
            onClick={(e) => handleLinkClick(result, e)}
            className="text-xl text-primary hover:underline font-medium mb-1 block"
          >
            {result.title}
          </a>
          <p className="text-sm text-foreground">{result.description}</p>
          <a
            href={result.link}
            onClick={(e) => handleLinkClick(result, e)}
            className="text-sm text-accent hover:underline mt-2 inline-flex items-center gap-1"
          >
            topuniversityterritian/lid={result.serial_number}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="py-4 px-4 border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-primary">TopUniversityTerritian</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {sponsoredResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Sponsored Results</h2>
            <div className="space-y-4">
              {sponsoredResults.map((result) => (
                <ResultCard key={result.id} result={result} />
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Web Results</h2>
          <div className="space-y-4">
            {regularResults.map((result) => (
              <ResultCard key={result.id} result={result} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default WebResult;
