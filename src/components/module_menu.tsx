import React from 'react';
import { makeStyles } from "@mui/styles"
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Octect from './Octect/octect';
import { ThemeKeys } from 'react-json-view';
import { SelectionToolView } from './SelectionTool/selection_tool_view';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;
    return (
        <div style={ {
                position: "relative",
                width: '100%',
                display: "flex"
            } }
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ width: '100%' }} p={3}>
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
    const [value, setValue] = React.useState(1);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <div style={{
            width: '100%'
        }}>
            <AppBar position="static" sx={{
                marginTop: '72px',
                display: "flex",
                width: '100%',
            }} >
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
                <SelectionToolView />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <Octect />
            </TabPanel>
        </ div >
    )
}