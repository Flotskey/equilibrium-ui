import ShowChartIcon from '@mui/icons-material/ShowChart';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip
} from "@mui/material";
import { useState } from "react";

const expandedWidth = 320;
const collapsedWidth = 80;

export const SideBar = ({
  isCollapsed: externalCollapsed,
  onToggleCollapse
}: {
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
} = {}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = externalCollapsed ?? internalCollapsed;

  // Expand on hover
  const handleMouseEnter = () => {
    if (onToggleCollapse) {
      onToggleCollapse(false);
    } else {
      setInternalCollapsed(false);
    }
  };
  // Collapse on mouse leave
  const handleMouseLeave = () => {
    if (onToggleCollapse) {
      onToggleCollapse(true);
    } else {
      setInternalCollapsed(true);
    }
  };

  const navItems = [
    { text: 'Trading', icon: <ShowChartIcon /> },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: isCollapsed ? collapsedWidth : expandedWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: isCollapsed ? collapsedWidth : expandedWidth,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100vh',
          zIndex: 1400,
          background: (theme) => theme.palette.background.default,
        },
      }}
      open
      slotProps={{
        paper: {
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
        }
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100vh',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          p: 1, // add a little left padding so icon doesn't touch the edge
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', flex: 1 }}>
          <List>
            {navItems.map(({ text, icon }) => (
              <Tooltip key={text} title={isCollapsed ? text : ''} placement="right">
                <ListItem disablePadding sx={{ display: 'block' }}>
                  <ListItemButton
                    sx={{
                      minHeight: 48,
                      justifyContent: isCollapsed ? 'center' : 'initial',
                      px: 2.5,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 0, mr: isCollapsed ? 'auto' : 2, justifyContent: 'center' }}>
                      {icon}
                    </ListItemIcon>
                    {!isCollapsed && <ListItemText primary={text} />}
                  </ListItemButton>
                </ListItem>
              </Tooltip>
            ))}
          </List>
        </Box>
      </Box>
    </Drawer>
  );
}