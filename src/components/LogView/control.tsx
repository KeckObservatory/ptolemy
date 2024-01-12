import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import React, { useState, useEffect } from 'react'
import { log_functions } from '../../api/ApiRoot'
import { Log } from '../../typings/ptolemy'
import { BooleanParam, NumberParam, StringParam, useQueryParam, withDefault } from 'use-query-params'

interface Props {
    setLogs: Function
}

const label = { inputProps: { 'aria-label': 'Switch demo' } };

export const Control = (props: Props) => {

    const [n_logs, setNLogs] = useQueryParam('n_logs', withDefault(NumberParam, 100))
    const [minutes, setMinutes] = useQueryParam('log_minutes', withDefault(NumberParam, 10))
    const [minuteSwitch, setMinuteSwitch] = useQueryParam('minute_switch', withDefault(BooleanParam, false))
    const [loggername, setLoggername] = useQueryParam('loggername', withDefault(StringParam, 'ddoi'))

    useEffect(() => {
        query_logs()
    }, [])

    const query_logs = () => {
        const ln = loggername === 'ddoi' || loggername === 'koa' ? loggername : 'ddoi'
        if (!minuteSwitch) {
            log_functions.get_logs(n_logs, ln).then((lgs: (Log | undefined)[]) => {
                if (lgs) {
                    props.setLogs(lgs as Log[])
                }
            })
        }
        else {
            log_functions.get_logs(n_logs, ln, minutes).then((lgs: (Log | undefined)[]) => {
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
        console.log("n_logs", event.target.value, value)
        setNLogs(value)
    }

    const on_loggername_change = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        let value = event.target.value
        console.log("loggername", value)
        setLoggername(value)
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
                    value={n_logs}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                />
            }
            <TextField
                label="logger name (ddoi or koa)"
                onChange={on_loggername_change}
                value={loggername}
            />
            <Button variant={'contained'}
                onClick={on_query_logs}
            >Query Logs</Button>
        </Stack>
    )
}