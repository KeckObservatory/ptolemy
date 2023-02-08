import React from 'react';
import { makeStyles } from "@mui/styles"

import AppBar from '@mui/material/AppBar';
import Switch from "@mui/material/Switch"
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Tooltip from '@mui/material/Tooltip';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography'

export function TopBar(props: any) {
  return (
    <AppBar
      position="absolute"
    >
      <Toolbar
        sx={{
          paddingRight: '8px',
          paddingLeft: '20px'
        }}
      >
        <IconButton
          edge="start"
          color="inherit"
          aria-label="open drawer"
        >
          <MenuIcon />
        </IconButton>
        <Typography
          component="h1"
          variant="h6"
          color="inherit"
          noWrap
          sx={{
            marginLeft: '12px',
            flexGrow: 1,
          }}
        >
          Ptolemy Demo
        </Typography>
        <Typography
          component="h1"
          variant="h6"
          color="inherit"
          noWrap
          sx={{
            marginLeft: '12px',
            flexGrow: 1,
          }}
        >
          Welcome, Observer {props.observer_id}!
        </Typography>
        <Tooltip title="Toggle on for dark mode">
          <Switch
            color="secondary"
            checked={props.darkState}
            onChange={props.handleThemeChange} />
        </Tooltip>
      </Toolbar>
    </AppBar>
  )
}