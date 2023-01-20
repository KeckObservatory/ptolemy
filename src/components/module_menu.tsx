import React from 'react';
import { makeStyles } from "@mui/styles"
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Octect from './Octect/octect';
import { ThemeKeys } from 'react-json-view';
import { SelectionToolView } from './SelectionTool/selection_tool_view';

const useStyles = makeStyles((theme: any) => ({
    moduleMain: {
        width: '100%'
    },
    tabs: {
        marginTop: theme.spacing(9),
        // height: theme.spacing(10),
        position: "absolute",
        display: "flex",
        width: '100%',
        // padding: theme.spacing(2),
    },
    items: {
        // marginTop: theme.spacing(12),
        position: "relative",
        // height: '100%',
        width: '100%',
        display: "flex"
    },
    panel: {
        width: '100%',
    }
}))

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel = (props: TabPanelProps) => {
    const classes = useStyles();
    const { children, value, index, ...other } = props;
    return (
        <div className={classes.items}
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
        {value === index && (
        <Box className={classes.panel} p={3}>
          {children}
        </Box>
      )}
        </div>
    );
}

const a11yProps = (index: number) => {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

interface ModuleMenuProps {
    observer_id: string;
    jsonTheme: ThemeKeys | undefined;
}

export const ModuleMenu = (props: ModuleMenuProps) => {
    const classes = useStyles();
    const [value, setValue] = React.useState(1);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <div className={classes.moduleMain}>
            <AppBar position="static" className={classes.tabs}>
                <Tabs
                    value={value}
                    onChange={handleChange as any}
                    indicatorColor="secondary"
                    textColor="inherit"
                    variant="fullWidth"
                    aria-label="full width tabs example"
                >
                    <Tab label="Planning Tool" {...a11yProps(0)} />
                    <Tab label="Octect" {...a11yProps(1)} />
                </Tabs>
            </AppBar>
            <TabPanel value={value} index={0}>
                <SelectionToolView/>
            </TabPanel>
            <TabPanel value={value} index={1}>
                <Octect />
            </TabPanel>
        </ div >
    )
}