import { useState } from "react";
import { LoginPage } from "@/components/auth/LoginPage";
import { LinkedInSync } from "@/components/profile/LinkedInSync";
import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";
import { HomePage } from "@/components/dashboard/HomePage";
import { AlumniDirectory } from "@/components/directory/AlumniDirectory";

const Index = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [showLinkedInSync, setShowLinkedInSync] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogin = (userData: any) => {
    setUser(userData);
    // Show LinkedIn sync for non-LinkedIn users
    if (!userData.linkedinSynced) {
      setShowLinkedInSync(true);
    }
  };

  const handleLinkedInSyncComplete = (linkedInData: any) => {
    if (user) {
      setUser({
        ...user,
        ...linkedInData,
        linkedinSynced: true
      });
    }
    setShowLinkedInSync(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomePage user={user} onNavigate={setActiveTab} />;
      case "directory":
        return <AlumniDirectory />;
      case "mentorship":
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Mentorship</h1>
            <p className="text-muted-foreground">Find mentors and book sessions (Coming soon)</p>
          </div>
        );
      case "careers":
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Career Opportunities</h1>
            <p className="text-muted-foreground">Browse jobs and referrals (Coming soon)</p>
          </div>
        );
      case "events":
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Events & Webinars</h1>
            <p className="text-muted-foreground">Discover networking events (Coming soon)</p>
          </div>
        );
      case "community":
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Community Feed</h1>
            <p className="text-muted-foreground">Connect with your community (Coming soon)</p>
          </div>
        );
      case "dashboard":
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Analytics and management tools (Coming soon)</p>
          </div>
        );
      default:
        return <HomePage user={user} onNavigate={setActiveTab} />;
    }
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        currentUser={user}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex">
        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 top-16 z-30 w-64 transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:top-0 md:translate-x-0 md:block
        `}>
          <Navigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            userRole={user.role}
            className="h-full"
          />
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 top-16 bg-black/50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 md:ml-0">
          {renderContent()}
        </main>
      </div>

      {/* LinkedIn Sync Modal */}
      <LinkedInSync
        isOpen={showLinkedInSync}
        onClose={() => setShowLinkedInSync(false)}
        onSyncComplete={handleLinkedInSyncComplete}
      />
    </div>
  );
};

export default Index;
