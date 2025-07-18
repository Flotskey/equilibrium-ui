import { MainLayout } from "@/app/layouts";
import { NotificationProvider, useNotify } from "@/components/NotificationProvider";
import TradingPage from "@/pages/TradingPage";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
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

const App = () => {
  return (
    <ThemeProvider theme={theme} defaultMode={"dark"}>
      <CssBaseline />
      <NotificationProvider>
        <NotifyBridge />
      <MainLayout>
        <RouterProvider router={router} />
      </MainLayout>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;
