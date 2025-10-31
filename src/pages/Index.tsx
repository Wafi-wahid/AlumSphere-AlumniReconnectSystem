import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LoginPage } from "@/components/auth/LoginPage";
import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";
import { HomePage } from "@/components/dashboard/HomePage";
import { AlumniDirectory } from "@/components/directory/AlumniDirectory";
import { MentorshipPage } from "@/components/mentorship/MentorshipPage";
import { EventsPage } from "@/components/events/EventsPage";
import { CommunityPage } from "@/components/community/CommunityPage";
import { MessagesPage } from "@/components/messages/MessagesPage";
import { FameHub } from "@/components/fame/FameHub";
import Profile from "@/pages/Profile";
import { useAuth } from "@/store/auth";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

const Index = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Apply preferred tab based on role after login, but prioritize URL ?tab
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(location.search);
    const tabFromUrl = params.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
      return;
    }
    const saved = localStorage.getItem('preferredTab');
    if (saved) setActiveTab(saved);
    else setActiveTab(user.role === 'admin' || user.role === 'super_admin' ? 'dashboard' : 'home');
  }, [user]);

  // React to URL ?tab=... to keep UI consistent without full route change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Central handler: update state and URL so effects don't fight each other
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(location.search);
    params.set('tab', tab);
    navigate({ pathname: "/", search: `?${params.toString()}` });
    localStorage.setItem('preferredTab', tab);
  };


  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomePage user={user} onNavigate={handleTabChange} />;
      case "directory":
        return <AlumniDirectory />;
      case "mentorship":
        return <MentorshipPage />;
      case "careers":
        return <div className="p-8"><h2 className="text-2xl font-bold">Careers - Coming Soon</h2></div>;
      case "events":
        return <EventsPage />;
      case "community":
        return <CommunityPage />;
      case "messages":
        return <MessagesPage />;
      case "profile":
        return <Profile />;
      case "fame":
        return <FameHub />;
      case "dashboard":
        return user?.role === 'admin' || user?.role === 'super_admin' ? (
          <AdminDashboard />
        ) : (
          <HomePage user={user} onNavigate={handleTabChange} />
        );
      default:
        return <HomePage user={user} onNavigate={handleTabChange} />;
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!user) return <LoginPage />;

  return (
    <div className="min-h-screen bg-background">
      <Header currentUser={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 top-16 z-30 w-64 transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0 shadow-md' : '-translate-x-full'}
          md:relative md:top-0 md:translate-x-0 md:block md:shadow-none
        `}>
          <Navigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
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
        <main id="main-content" className="flex-1 p-6 md:p-8 md:ml-0 container mx-auto max-w-7xl">
          {renderContent()}
        </main>
      </div>

    </div>
  );
};

export default Index;
