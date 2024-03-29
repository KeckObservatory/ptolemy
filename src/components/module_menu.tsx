import React from 'react';
import { makeStyles } from "@mui/styles"
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import { ThemeKeys } from 'react-json-view';
import { SelectionToolView } from './SelectionTool/selection_tool_view';
import { NumberParam, useQueryParam, withDefault } from 'use-query-params'
import { Ptolemy } from './ptolemy';
import { LogView } from './LogView/log_view';

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

export const ModuleMenu = () => {
    const [tabIdx, setTabIdx] = useQueryParam('tab_index', withDefault(NumberParam, 1));

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabIdx(newValue);
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
                    value={tabIdx}
                    onChange={handleChange as any}
                    indicatorColor="secondary"
                    textColor="inherit"
                    variant="fullWidth"
                    aria-label="full width tabs example"
                >
                    <Tab label="Planning Tool" {...a11yProps(0)} />
                    <Tab label="Ptolemy" {...a11yProps(1)} />
                    <Tab label="Log View" {...a11yProps(2)} />
                </Tabs>
            </AppBar>
            <TabPanel value={tabIdx} index={0}>
                <SelectionToolView />
            </TabPanel>
            <TabPanel value={tabIdx} index={1}>
                <Ptolemy />
            </TabPanel>
            <TabPanel value={tabIdx} index={2}>
                <LogView />
            </TabPanel>
        </ div >
    )
}