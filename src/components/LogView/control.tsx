import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import React, { useState, useEffect } from 'react'
import { log_functions } from '../../api/ApiRoot'
import { Log } from '../../typings/ptolemy'
import { BooleanParam, NumberParam, useQueryParam, withDefault } from 'use-query-params'

interface Props {
    setLogs: Function
}

const label = { inputProps: { 'aria-label': 'Switch demo' } };

export const Control = (props: Props) => {

    const [nLogs, setNLogs] = useQueryParam('n_logs', withDefault(NumberParam, 100))
    const [minutes, setMinutes] = useQueryParam('log_minutes', withDefault(NumberParam, 10))
    const [minuteSwitch, setMinuteSwitch] = useQueryParam('minute_switch', withDefault(BooleanParam, false))

    useEffect(() => {
        query_logs()
    }, [])

    const query_logs = () => {
        if (!minuteSwitch) {
            log_functions.get_logs(nLogs).then((lgs: (Log | undefined)[]) => {
                console.log(lgs)
                if (lgs) {
                    props.setLogs(lgs as Log[])
                }
            })
        }
        else {
            log_functions.get_logs(nLogs, minutes).then((lgs: (Log | undefined)[]) => {
                console.log(lgs)
                if (lgs) {
                    props.setLogs(lgs as Log[])
                }
            })
        }
    }

    const on_query_logs = () => {
        query_logs()
    }

    const on_switch_change = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log('switch', event.target.checked)
        setMinuteSwitch(event.target.checked)
    }

    const on_n_logs_change = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        let value = Number(event.target.value)
        value = value <= 500 ? value : 500
        console.log("nLogs", event.target.value, value)
        setNLogs(value)
    }

    const on_minutes_change = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        let value = Number(event.target.value)
        value = value <= 100 ? value : 100
        console.log("minutes", event.target.value, value)
        setMinutes(value)
    }


    return (
        <Stack sx={{ marginBottom: '4px' }} direction="row" spacing={2}>
            <Switch {...label}
                checked={minuteSwitch}
                onChange={on_switch_change}
            />
            {minuteSwitch ?
                <TextField
                    label="get number of minutes"
                    onChange={on_minutes_change}
                    value={minutes}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                /> :
                <TextField
                    label="number of logs"
                    onChange={on_n_logs_change}
                    value={nLogs}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                />
            }
            <Button variant={'contained'}
                onClick={on_query_logs}
            >Query Logs</Button>
        </Stack>
    )
}