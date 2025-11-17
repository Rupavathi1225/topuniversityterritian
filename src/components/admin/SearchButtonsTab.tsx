import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";

interface SearchButton {
  id: string;
  title: string;
  link: string | null;
  serial_number: number;
  web_result_page: number;
}

const SearchButtonsTab = () => {
  const { toast } = useToast();
  const [buttons, setButtons] = useState<SearchButton[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newSerial, setNewSerial] = useState("");
  const [newPage, setNewPage] = useState("1");

  useEffect(() => {
    fetchButtons();
  }, []);

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

  const handleAdd = async () => {
    if (!newTitle || !newSerial) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("search_buttons").insert({
      title: newTitle,
      link: newLink || null,
      serial_number: parseInt(newSerial),
      web_result_page: parseInt(newPage),
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add button",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Button added successfully",
      });
      setNewTitle("");
      setNewLink("");
      setNewSerial("");
      setNewPage("1");
      fetchButtons();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("search_buttons")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete button",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Button deleted successfully",
      });
      fetchButtons();
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Manage Search Buttons</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 p-4 bg-secondary rounded-lg">
          <h3 className="font-medium">Add New Button</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Button title</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter button title"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Link (optional)</Label>
              <Input
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="https://example.com or leave empty for /webresult"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Serial Number (Position)</Label>
              <Input
                type="number"
                value={newSerial}
                onChange={(e) => setNewSerial(e.target.value)}
                placeholder="1"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Web Result Page</Label>
              <Select value={newPage} onValueChange={setNewPage}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Page 1 (wr=1)</SelectItem>
                  <SelectItem value="2">Page 2 (wr=2)</SelectItem>
                  <SelectItem value="3">Page 3 (wr=3)</SelectItem>
                  <SelectItem value="4">Page 4 (wr=4)</SelectItem>
                  <SelectItem value="5">Page 5 (wr=5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleAdd} className="bg-primary hover:bg-button-hover">
            <Plus className="w-4 h-4 mr-2" />
            Add Button
          </Button>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium">Existing Buttons</h3>
          {buttons.map((button) => (
            <div
              key={button.id}
              className="flex items-center justify-between p-4 bg-secondary rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium">{button.title}</div>
                <div className="text-sm text-muted-foreground">
                  Position: {button.serial_number} | Links to: /wr={button.web_result_page}
                  {button.link && ` | Custom Link: ${button.link}`}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(button.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchButtonsTab;
