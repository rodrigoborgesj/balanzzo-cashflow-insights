
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { Navigate } from "react-router-dom";
import { PaymentSelection } from "@/components/PaymentSelection";
import { useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasProfile, isLoading: profileLoading } = useProfile();
  const { hasAccess, isLoading: subscriptionLoading } = useSubscription();
  const [showPaymentSelection, setShowPaymentSelection] = useState(false);

  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated, 'hasProfile:', hasProfile, 'hasAccess:', hasAccess, 'authLoading:', authLoading, 'profileLoading:', profileLoading, 'subscriptionLoading:', subscriptionLoading);

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

  // If authenticated but no active subscription, show payment selection
  if (isAuthenticated && !hasAccess()) {
    console.log('User authenticated but no active subscription');
    if (showPaymentSelection) {
      return <PaymentSelection onBack={() => setShowPaymentSelection(false)} />;
    }
    
    // Show subscription required message
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white p-8 rounded-2xl shadow-lg border-2" style={{ borderColor: '#A9C7A1' }}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E4F8CA' }}>
              <div className="w-8 h-8 rounded" style={{ backgroundColor: '#1A3423' }}></div>
            </div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#1A3423', fontFamily: 'Montserrat, sans-serif' }}>
              Assinatura Necessária
            </h2>
            <p className="text-gray-600 mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Para acessar a plataforma Balanzzo, você precisa de uma assinatura ativa.
            </p>
            <button
              onClick={() => setShowPaymentSelection(true)}
              className="w-full py-3 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
              style={{ backgroundColor: '#1A3423', fontFamily: 'Montserrat, sans-serif' }}
            >
              Escolher Plano
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full mt-3 py-3 text-gray-600 font-medium rounded-xl transition-colors hover:bg-gray-50"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Fazer Login Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated and has active subscription, show protected content
  console.log('User authenticated with active subscription, allowing access');
  return <>{children}</>;
}
