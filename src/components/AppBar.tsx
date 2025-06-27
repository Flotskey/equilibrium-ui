import {
    AppBar as MuiAppBar,
    Toolbar,
    Typography
} from '@mui/material';

export const AppBar = () => {
    return <MuiAppBar position="fixed" color={'primary'} sx={{zIndex: 1500}}>
        <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Header
            </Typography>
        </Toolbar>
    </MuiAppBar>
}