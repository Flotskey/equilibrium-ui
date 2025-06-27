import { AppBar, SideBar } from "@/components";
import { Box } from "@mui/material";
import { PropsWithChildren, useState } from "react";

const collapsedWidth = 80;

export const MainLayout = ({children}: PropsWithChildren) => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(true);
    return (
        <Box sx={{display: "flex", flexDirection: "column"}}>
            <AppBar />
            <Box>
                <SideBar isCollapsed={isSidebarCollapsed} onToggleCollapse={setSidebarCollapsed}/>
                <Box
                    sx={{
                        position: 'fixed',
                        top: '64px',
                        left: `${collapsedWidth}px`,
                        right: 0,
                        bottom: 0,
                        padding: '24px',
                        overflow: 'hidden',
                        background: (theme) => theme.palette.background.default,
                        zIndex: 1, // below AppBar and SideBar
                    }}
                >
                    {children}
                </Box>
            </Box>
        </Box>
    );
};
