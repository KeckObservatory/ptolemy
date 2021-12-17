import React  from 'react';
import { makeStyles } from "@mui/styles"

import AppBar from '@mui/material/AppBar';
import Switch from "@mui/material/Switch"
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Tooltip from '@mui/material/Tooltip';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography'

const useStyles = makeStyles((theme: any) => ({
  root: { 
    position: "absolute",
    display: "flex"
  },
  title: { 
    marginLeft: theme.spacing(2),
    flexGrow: 1,
  },
  appBar: { 
    color: theme.palette.primary,
    backgroundColor: theme.palette.secondary
  },
  toolbar: {
    paddingRight: theme.spacing(2),
    paddingLeft: theme.spacing(5) 
  },
  switch: {
    color: theme.palette.primary,
    backgroundColor: theme.palette.secondary
  },
}))


export function TopBar(props: any) {
  const classes = useStyles();
  return( 
    <AppBar 
      position="absolute"
      className={classes.appBar}  
    >
      <Toolbar
        className={classes.toolbar}
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
          className={classes.title}
        >
          Ptolemy Demo
        </Typography>
        <Typography
          component="h1"
          variant="h6"
          color="inherit"
          noWrap
          className={classes.title}
        >
          Welcome, Observer {props.observer_id}!
        </Typography>
        <Tooltip title="Toggle on for dark mode">
          <Switch 
            color="secondary"
            checked={props.darkState} 
            onChange={props.handleThemeChange}/>
        </Tooltip>
      </Toolbar>
    </AppBar>
  )
}