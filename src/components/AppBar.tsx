import { useAuth } from '@/contexts/AuthContext';
import { AccountCircle, Logout } from '@mui/icons-material';
import {
    Box,
    IconButton,
    Menu,
    MenuItem,
    AppBar as MuiAppBar,
    Toolbar,
    Typography
} from '@mui/material';
import { useState } from 'react';

export const AppBar = () => {
    const { user, logout } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        try {
            await logout();
            handleClose();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <MuiAppBar position="fixed" color={'primary'} sx={{zIndex: 1500}}>
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Equilibrium
                </Typography>
                
                {user && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                            {user.displayName || user.email}
                        </Typography>
                        <IconButton
                            size="large"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleMenu}
                            color="inherit"
                        >
                            <AccountCircle />
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                            disableScrollLock={true}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            sx={{
                                '& .MuiPaper-root': {
                                    zIndex: 1600,
                                    mt: 1,
                                }
                            }}
                            slotProps={{
                                paper: {
                                    elevation: 8,
                                }
                            }}
                        >
                            <MenuItem onClick={handleLogout}>
                                <Logout sx={{ mr: 1 }} />
                                Logout
                            </MenuItem>
                        </Menu>
                    </Box>
                )}
            </Toolbar>
        </MuiAppBar>
    );
};