import { MainLayout } from "@/app/layouts";
import TradingPage from "@/pages/TradingPage";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <TradingPage />,
  },
]);

const theme = createTheme({
  colorSchemes: {
    dark: true,
    light: true,
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme} defaultMode={"dark"}>
      <CssBaseline />
      <MainLayout>
        <RouterProvider router={router} />
      </MainLayout>
    </ThemeProvider>
  );
};

export default App;
