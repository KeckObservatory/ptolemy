import React from 'react';
import { makeStyles } from "@mui/styles"

import AppBar from '@mui/material/AppBar';
import Switch from "@mui/material/Switch"
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Tooltip from '@mui/material/Tooltip';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography'
import { StringParam, useQueryParam, withDefault } from 'use-query-params';
import DropDown from './drop_down';
import FormControl from '@mui/material/FormControl';

const ROLES = ["Observer", "Keck Staff"]

export function TopBar(props: any) {


  const [role, setRole] = useQueryParam('role', withDefault(StringParam, "Keck Staff"));

  const handleRoleChange = (value: string) => {
    console.log('setting role to: ', value)
    setRole(value)
  }

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

        <FormControl sx={{ m: 0, width: 150 }}>
          <DropDown
            placeholder={'user role'}
            arr={ROLES}
            value={role}
            handleChange={handleRoleChange}
            label={'User Role'}
          />
        </FormControl>
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