import {
    AppBar as MuiAppBar,
    Toolbar,
    Typography,
    //useColorScheme
} from '@mui/material'

export const AppBar = () => {
    /*const { mode, setMode } = useColorScheme();
    if (!mode) {
        return null;
    }*/

    return <MuiAppBar position="fixed" color={'primary'} sx={{zIndex: (theme) => theme.zIndex.drawer + 1}}>
        <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Header
            </Typography>
        </Toolbar>
    </MuiAppBar>
}