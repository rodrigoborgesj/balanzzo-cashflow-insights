
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { Navigate } from "react-router-dom";
import { SubscriptionBlock } from "@/components/SubscriptionBlock";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasProfile, isLoading: profileLoading } = useProfile();
  const { hasAccess, isLoading: subscriptionLoading } = useSubscription();

  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated, 'hasProfile:', hasProfile, 'hasAccess:', hasAccess(), 'authLoading:', authLoading, 'profileLoading:', profileLoading, 'subscriptionLoading:', subscriptionLoading);

  // Show loading while checking auth, profile, or subscription
  if (authLoading || profileLoading || subscriptionLoading) {
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

  // If authenticated but no active subscription, show subscription block
  if (isAuthenticated && !hasAccess()) {
    console.log('User authenticated but no active subscription - showing subscription block');
    return <SubscriptionBlock onBack={() => window.location.href = '/login'} />;
  }

  // User is authenticated and has active subscription, show protected content
  console.log('User authenticated with active subscription, allowing access');
  return <>{children}</>;
}
