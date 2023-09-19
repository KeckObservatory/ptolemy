import React from "react";
import MUIDataTable, { MUIDataTableIsRowCheck, MUIDataTableOptions } from "mui-datatables"
import { ObservationBlock, Scoby, OBCell } from "../../typings/ptolemy"
import Tooltip from '@mui/material/Tooltip'
import Button from '@mui/material/Button';
import Checkbox from "@mui/material/Checkbox";
import { ob_api_funcs } from "../../api/ApiRoot";
import Switch from "@mui/material/Switch"
import Paper from "@mui/material/Paper";
import { FormControlLabel } from "@mui/material";
import { rootShouldForwardProp } from "@mui/material/styles/styled";
import OBSubmit from "./ob_submit";

interface Props {
    selObs: ObservationBlock[],
    obBoneyard: ObservationBlock[]
    onSubmitOB: Function
}

interface SelectedRows {
    data: {
        index: number;
        dataIndex: number;
    }[];
    lookup: {
        [key: number]: boolean;
    };
}

interface CTProps {
    selectedRows: SelectedRows,
    selObs: ObservationBlock[],
    obBoneyard: ObservationBlock[]
    onSubmitOB: Function
}

const container_obs_to_cells = (obs: any, submitted = true) => {
    let cells: any[] = []
    let uid = 0
    obs.forEach((ob: ObservationBlock, idx: number) => {
        const obCell: OBCell = {
            name: ob.metadata.name,
            type: 'ob',
            id: JSON.stringify(uid),
            ra: ob.target?.parameters.target_coord_ra,
            dec: ob.target?.parameters.target_coord_dec,
            submitted: submitted

        }
        const tgt = ob.target
        if (tgt) obCell['target'] = tgt
        cells.push(obCell)
        uid += 1
    })
    return cells
}

const CustomToolbarSelect = (props: CTProps) => {

    return (
        <React.Fragment>
            <Tooltip title={"Sends OB to Target Queue"}>
                <OBSubmit onSubmitOB={props.onSubmitOB} />
            </Tooltip>
        </React.Fragment>
    );
}

const CustomCheckbox = (props: any) => {
    let newProps = Object.assign({}, props);
    newProps.color = props['data-description'] === 'row-select' ? 'secondary' : 'primary';

    return (
        <Tooltip title='select row'>
            <Checkbox {...newProps} />
        </Tooltip>
    );
};

const update_value = (event: any, checked: boolean) => {
    console.log('clicked will update boneyard', checked)
}

const SelectedOBTable = (props: Props) => {

    let rows = container_obs_to_cells(props.selObs, false)
    const obs = [...props.selObs, ...props.obBoneyard]
    const boneyardRows = container_obs_to_cells(props.obBoneyard, true)
    rows = [...rows, ...boneyardRows]

    const options: MUIDataTableOptions = {
        filterType: 'dropdown',
        onRowsDelete: () => false,
        expandableRows: true,
        renderExpandableRow: (rowData, rowMeta: {dataIndex: number, rowIndex: number}) => {
            const ob = obs[rowMeta.dataIndex]
            return ob._id 
        },
        isRowSelectable: (dataIndex: number, selectedRows: MUIDataTableIsRowCheck | undefined) => {
            return !rows[dataIndex].submitted
          },
        selectableRowsHeader: false,
        selectableRowsHideCheckboxes: false,
        customToolbarSelect: selectedRows => (
            <CustomToolbarSelect
                selectedRows={selectedRows}
                selObs={props.selObs}
                obBoneyard={props.obBoneyard}
                onSubmitOB={props.onSubmitOB}
            />
        ),
        selectableRows: 'single'
    }

    const columns = [
        { name: 'ob_id', label: 'OB ID', options: { display: false } },
        {
            name: 'name', label: 'OB Name',
            options: {}
        },
        { name: 'version', label: 'Version', options: { display: false } },
        { name: 'comment', label: 'Comment', options: { display: false } },
        { name: 'ra', label: 'RA', options: { display: true } },
        { name: 'dec', Label: 'Dec', options: { display: true } },
        { name: 'sem_id', Label: 'Semid', options: { display: false } },
        {
            name: 'submitted',
            label: 'Submitted',
            options: {
                display: true,
                customBodyRender: (value: any, tableMeta: any, updateValue: any) => {
                    return(
                    <FormControlLabel
                        label=""
                        value={value}
                        control={<Switch value={value} />}
                        onChange={ (event, checked) => update_value(event, checked)
                        }
                    />)
                }
            }
        }
    ]

    return (
        <MUIDataTable
            data={rows}
            columns={columns}
            options={options}
            title={""}
            components={{ Checkbox: CustomCheckbox }}
        />
    )
}

export default SelectedOBTable