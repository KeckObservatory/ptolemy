import React, { useState, useEffect } from 'react'
import MUIDataTable, { MUIDataTableOptions } from "mui-datatables"
import { Log } from '../../typings/ptolemy'
import { Control } from './control'
import { styled } from '@mui/material/styles'

export interface Props {

}

const DataTableContainer = styled('div')(() => ({
    '& .MuiTableCell-root': {
        '&:nth-of-type(0)': {
            width: '250px',
            paddingLeft: '1rem',
        },
        '&:nth-of-type(1)': {
            width: '70px',
            paddingLeft: '1rem',
        },
        '&:nth-of-type(2)': {
            width: '70px',
            paddingLeft: '1rem',
        },
        '&:nth-of-type(3)': {
            width: '70px',
            paddingLeft: '1rem',
        },
        '&:nth-last-of-type(1)': {
            width: '1350px',
            paddingLeft: '1rem',
        },
    },
}));


export const LogView = (props: Props) => {

    const [logs, setLogs] = useState([] as Log[])

    useEffect(() => {
    }, [])

    const options: MUIDataTableOptions = {
        filterType: 'dropdown',
        selectableRowsHeader: false,
        selectableRowsHideCheckboxes: false,
        selectableRows: 'none',
        rowsPerPage: 25,
        setRowProps: (row, dataIndex, rowIndex) => {
            return {
                style: { padding: '0px' },
            };
        },
        setTableProps: () => {
            return {
                padding: 'none',
            };
        },
    }

    const columns = [
        { name: '_id', label: 'Log ID', options: { display: false } },
        { name: 'utc_sent', label: 'Datetime Sent', options: { display: false } },
        { name: 'utc_received', label: 'Datetime' },
        { name: 'hostname', label: 'Hostname', options: { display: false } },
        { name: 'level', label: 'Level', options: { display: false } },
        { name: 'subsystem', label: 'Subsystem' },
        { name: 'author', label: 'Author', options: { display: false } },
        { name: 'SEMID', label: 'Semid' },
        { name: 'PROGID', label: 'ProgID', options: { display: false } },
        { name: 'message', label: 'Message', 
          options: { 
            filter: false,
            display: true,
            customBodyRender: (value: string, tableMeta: any, updateValue: any) => {
                return (value.split('\n').map((str: string) => {return <div style={{padding: "0px"}}>{str}</div>}))
            }
         } },
    ]

    return (
        <React.Fragment>
            <Control setLogs={setLogs} />
            <DataTableContainer>
                <MUIDataTable
                    data={logs}
                    columns={columns}
                    options={options}
                    title={""}
                />
            </DataTableContainer>
        </React.Fragment>
    )

}