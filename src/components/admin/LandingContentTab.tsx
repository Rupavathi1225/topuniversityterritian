import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LandingContentTab = () => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentId, setContentId] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
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
      setTitle(data.title);
      setDescription(data.description);
      setContentId(data.id);
    }
  };

  const handleSave = async () => {
    if (contentId) {
      const { error } = await supabase
        .from("landing_content")
        .update({ title, description })
        .eq("id", contentId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update content",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Content updated successfully",
        });
      }
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Edit Landing Page Content</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title"
            className="bg-secondary border-border"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description"
            rows={5}
            className="bg-secondary border-border"
          />
        </div>

        <Button onClick={handleSave} className="bg-primary hover:bg-button-hover">
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
};

export default LandingContentTab;
