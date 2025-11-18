import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import LandingContentTab from "@/components/admin/LandingContentTab";
import SearchButtonsTab from "@/components/admin/SearchButtonsTab";
import WebResultsTab from "@/components/admin/WebResultsTab";
import AnalyticsTab from "@/components/admin/AnalyticsTab";

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("landing");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="py-4 px-6 border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Admin Panel</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
            >
              View Site
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                // Logout functionality can be added here
                navigate("/");
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="landing">Landing Page</TabsTrigger>
            <TabsTrigger value="buttons">Categories</TabsTrigger>
            <TabsTrigger value="results">Web Results</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="landing">
            <LandingContentTab />
          </TabsContent>

          <TabsContent value="buttons">
            <SearchButtonsTab />
          </TabsContent>

          <TabsContent value="results">
            <WebResultsTab />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
