import { MainLayout } from "@/app/layouts";
import { NotificationProvider, useNotify } from "@/components/NotificationProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AuthPage from "@/pages/AuthPage";
import TradingPage from "@/pages/TradingPage";
import { Box, CircularProgress, createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { useEffect } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/trading" replace />,
  },
  {
    path: "/trading",
    element: <TradingPage />,
  },
  {
    path: "/auth",
    element: <AuthPage />,
  },
]);

const theme = createTheme({
  colorSchemes: {
    dark: true,
    light: true,
  },
});

// This component must be rendered inside NotificationProvider
function NotifyBridge() {
  const notify = useNotify();
  useEffect(() => {
    (window as any).notify = notify;
  }, [notify]);
  return null;
}

const AppContent = () => {
  const { user, loading } = useAuth();

  // Show loading while checking auth state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // If not authenticated, show auth page
  if (!user) {
    return <AuthPage />;
  }

  // If authenticated, show protected content
  return (
    <MainLayout>
      <RouterProvider router={router} />
    </MainLayout>
  );
};

const App = () => {
  return (
    <ThemeProvider theme={theme} defaultMode={"dark"}>
      <CssBaseline />
      <AuthProvider>
        <NotificationProvider>
          <NotifyBridge />
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
