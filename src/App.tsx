import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/store/auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoginPage } from "@/components/auth/LoginPage";
import { BrandLoader } from "@/components/ui/BrandLoader";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";
import { MessagesPage } from "@/components/messages/MessagesPage";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

// Create a wrapper component for protected routes
const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <BrandLoader />
      </div>
    );
  }

  return <>{children}</>;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AuthWrapper>
              <Routes>
                {/* Public routes */}
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Onboarding flow - only accessible if not completed */}
                <Route 
                  path="/onboarding" 
                  element={
                    <ProtectedRoute requireOnboardingComplete={false}>
                      <OnboardingFlow />
                    </ProtectedRoute>
                  } 
                />

                {/* Protected routes - require onboarding completion */}
                <Route element={<ProtectedRoute requireOnboardingComplete={true} />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/mentorship" element={<Navigate to="/?tab=mentorship" replace />} />
                </Route>

                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthWrapper>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
