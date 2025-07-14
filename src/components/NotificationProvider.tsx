import { Alert, Snackbar } from "@mui/material";
import { createContext, ReactNode, useContext, useState } from "react";
import { createPortal } from "react-dom";

type Notification = { message: string; severity?: "error" | "warning" | "info" | "success" };

const NotificationContext = createContext<(n: Notification) => void>(() => {});

export const useNotify = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = (n: Notification) => setNotification(n);

  const handleClose = () => setNotification(null);

  return (
    <NotificationContext.Provider value={showNotification}>
      {children}
      {createPortal(
        <Snackbar
          open={!!notification}
          autoHideDuration={10000}
          onClose={handleClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          sx={{ zIndex: 20000 }}
        >
          <Alert onClose={handleClose} severity={notification?.severity || "error"} sx={{ width: "100%" }}>
            {notification?.message}
          </Alert>
        </Snackbar>,
        document.body
      )}
    </NotificationContext.Provider>
  );
}; 