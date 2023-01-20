// @ts-nocheck
import { createTheme } from '@mui/material/styles';
import { ThemeOptions } from '@material-ui/core/styles/createMuiTheme';


export const handleTheme = (darkState: boolean | null | undefined): [Theme, ThemeKeys | undefined] => {
  const palletType = darkState ? "dark" : "light"
  const themeOptions: ThemeOptions = {
    palette: {
      mode: palletType,
    //   primary: {
    //     main: '#9b35bd',
    //   },
    //   secondary: {
    //     main: '#ffd600',
    //   },
    //   background: {
    //     default: 'rgba(133,133,133,0.53)',
    //     paper: 'rgba(61,61,61,0.58)',
    //   },
    },
  };
  const theme = createTheme(themeOptions)
  let jsonTheme = darkState ? 'bespin' : 'summerfruit:inverted' as ThemeKeys
  if (darkState) jsonTheme = 'bespin' as ThemeKeys
  return [theme, jsonTheme]
}