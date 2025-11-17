import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, ChevronRight } from "lucide-react";
import { getSessionId } from "@/utils/sessionTracking";

interface LandingContent {
  id: string;
  title: string;
  description: string;
}

interface SearchButton {
  id: string;
  title: string;
  web_result_page: number;
  serial_number: number;
}

const Landing = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<LandingContent | null>(null);
  const [buttons, setButtons] = useState<SearchButton[]>([]);

  useEffect(() => {
    getSessionId(); // Initialize session tracking
    fetchContent();
    fetchButtons();
  }, []);

  const fetchContent = async () => {
    const { data, error } = await supabase
      .from("landing_content")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching content:", error);
    } else if (data) {
      setContent(data);
    }
  };

  const fetchButtons = async () => {
    const { data, error } = await supabase
      .from("search_buttons")
      .select("*")
      .order("serial_number", { ascending: true });

    if (error) {
      console.error("Error fetching buttons:", error);
    } else {
      setButtons(data || []);
    }
  };

  const handleButtonClick = (pageNumber: number) => {
    navigate(`/webresult?wr=${pageNumber}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="py-6 px-4 border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">TopUniversityTerritian</h1>
          <Search className="w-5 h-5 text-muted-foreground" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          {content && (
            <>
              <h2 className="text-4xl font-bold mb-6 leading-tight">
                {content.title}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {content.description}
              </p>
            </>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Related categories</h3>
          {buttons.map((button) => (
            <button
              key={button.id}
              onClick={() => handleButtonClick(button.web_result_page)}
              className="w-full flex items-center justify-between px-6 py-4 bg-card hover:bg-secondary border border-border rounded-lg transition-all duration-200 group"
            >
              <span className="text-left text-foreground">{button.title}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Landing;
