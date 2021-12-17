import React from 'react';
import './App.css';
import { handleTheme } from './theme';
import CssBaseline from "@mui/material/CssBaseline";
import { TopBar } from './top_bar';
import { makeStyles } from "@mui/styles"
import { ThemeProvider } from "@mui/material/styles";
import { BooleanParam, StringParam, useQueryParam, withDefault } from 'use-query-params'
import { ModuleMenu } from './module_menu'

const useStyles = makeStyles((theme: any) => ({
  root: {
    display: "flex"
  },
  toolbar: {
    paddingRight: '8px',
    paddingLeft: '40px'
  },
  toolbarIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "0 8px",
    // ...theme.mixins.toolbar
  },
  menuButton: {
    marginRight: '16px'
  },
  // appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    height: "100vh",
    overflow: "auto"
  },
  container: {
    paddingTop: '27px',
    paddingBottom: '16px'
  },
  fixedHeight: { height: 240 }
}));

function App() {
  const classes = useStyles();
  const [darkState, setDarkState] = useQueryParam('darkState', withDefault(BooleanParam, true));
  const [observer_id] =
    useQueryParam('observer_id', withDefault(StringParam, '2003'))
  const [theme, jsonTheme] = handleTheme(darkState)

  const handleThemeChange = (): void => {
    setDarkState(!darkState);
  }
  return (
    <ThemeProvider theme={theme} >
      <CssBaseline />
      <div className={classes.root}>
        <TopBar darkTheme={theme} observer_id={observer_id} handleThemeChange={handleThemeChange} />
        <ModuleMenu observer_id={observer_id} jsonTheme={jsonTheme} />
      </div>
    </ThemeProvider>
  );
}

export default App;
