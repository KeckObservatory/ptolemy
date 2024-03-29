import React from 'react';
import './App.css';
import { handleTheme } from './theme';
import CssBaseline from "@mui/material/CssBaseline";
import { TopBar } from './top_bar';
import { ThemeProvider } from "@mui/material/styles";
import { BooleanParam, StringParam, useQueryParam, withDefault } from 'use-query-params'
import { ModuleMenu } from './module_menu'

import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryParamProvider } from 'use-query-params';

function App() {
  const [darkState, setDarkState] = useQueryParam('darkState', withDefault(BooleanParam, true));
  const [observer_id] = useQueryParam('observer_id', withDefault(StringParam, '2003'))
  const [theme, jsonTheme] = handleTheme(darkState)

  const handleThemeChange = (): void => {
    setDarkState(!darkState);
  }
  return (
    <ThemeProvider theme={theme} >
      <CssBaseline />
      <div style={{
        display: "flex"
      }} >
        <TopBar darkTheme={theme} observer_id={observer_id} handleThemeChange={handleThemeChange} />
        <ModuleMenu />
      </div>
    </ThemeProvider>
  );
}

export default App;
