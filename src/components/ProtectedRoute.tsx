
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasProfile, isLoading: profileLoading } = useProfile();

  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated, 'hasProfile:', hasProfile, 'authLoading:', authLoading, 'profileLoading:', profileLoading);

  // Show loading while checking auth or profile
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // If authenticated but no profile, redirect to signup completion
  if (isAuthenticated && !hasProfile) {
    console.log('Authenticated but no profile, staying on login for signup');
    return <Navigate to="/login" replace />;
  }

  // User is authenticated and has profile, show protected content
  return <>{children}</>;
}
