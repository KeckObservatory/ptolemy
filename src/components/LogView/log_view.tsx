import React, { useState, useEffect } from 'react'
import MUIDataTable, { MUIDataTableOptions } from "mui-datatables"
import Tooltip from '@mui/material/Tooltip'
import Button from '@mui/material/Button';
import Checkbox from "@mui/material/Checkbox";
import { log_functions } from './../../api/ApiRoot'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'
import { Log, RawLog } from '../../typings/ptolemy'

export interface Props {

}

export const LogView = (props: Props) => {

    const [nLogs, setNLogs] = useState(100)
    const [logs, setLogs] = useState([] as Log[])
    const [semid, setSemId] = useQueryParam('sem_id', withDefault(StringParam, ""))
    const [subsystem, setSubsystem] = useState(undefined as unknown as string)

    useEffect(() => {
        log_functions.get_logs(nLogs, subsystem, semid).then((lgs: (RawLog | undefined)[]) => {
            console.log(lgs)
            const logRows = (lgs as unknown as RawLog[]).map( (lg: RawLog) => {
                return ({
                    ...lg,
                    _id: lg._id.$oid,
                    utc_received: lg.utc_received.$date
                } as Log
            )})
            setLogs(logRows)
        })
    }, [])

    const options: MUIDataTableOptions = {
        filterType: 'dropdown',
        selectableRowsHeader: false,
        selectableRowsHideCheckboxes: false,
        selectableRows: 'none' 
    }

    const columns = [
        { name: '_id', label: 'Log ID', options: { display: false } },
        { name: 'utc_sent', label: 'Datetime Sent', options: {display: false} },
        { name: 'utc_received', label: 'Datetime' },
        { name: 'hostname', label: 'Hostname', options: {display: false} },
        { name: 'level', label: 'Level', options: {display: false} },
        { name: 'subsystem', label: 'Subsystem' },
        { name: 'author', label: 'Author', options: { display: false } },
        { name: 'SEMID', label: 'Semid' },
        { name: 'PROGID', label: 'ProgID', options: { display: false } },
        { name: 'message', label: 'Message', options: { display: true } },
    ]

    return (
        <React.Fragment>
            <MUIDataTable
                data={logs}
                columns={columns}
                options={options}
                title={""}
            />
        </React.Fragment>
    )

}