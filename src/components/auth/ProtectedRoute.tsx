import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import { BrandLoader } from '@/components/ui/BrandLoader';

type ProtectedRouteProps = {
  requireOnboardingComplete?: boolean;
  children?: React.ReactNode;
};

export const ProtectedRoute = ({
  requireOnboardingComplete = true,
  children
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <BrandLoader />
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Only force onboarding for newly registered users
  if (requireOnboardingComplete && (user as any).onboardingRequired && !user.onboardingCompleted) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
