import MUIDataTable, { MUIDataTableOptions } from "mui-datatables"
import { Scoby } from "../../typings/ptolemy"
import Tooltip from '@mui/material/Tooltip'
import Button from '@mui/material/Button';
import Checkbox from "@mui/material/Checkbox";
import { ob_api_funcs } from "../../api/ApiRoot";
import Paper from "@mui/material/Paper";

interface Props {
    rows: Scoby[],
    setSelObs: Function
    setSelObRows: Function
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
    setSelObs: Function,
    setSelObRows: Function,
    rows: Scoby[]
}

const CustomToolbarSelect = (props: CTProps) => {
    const handleClick = async () => {
        //set selected rows here
        const selectedIdxs = Object.keys(props.selectedRows.lookup)
        //@ts-ignore
        const selObRows = selectedIdxs.map(idx => props.rows[idx])
        const ob_ids = selObRows.map((row: Scoby) => row.ob_id)
        let selObs = ob_ids ? await ob_api_funcs.get_many(ob_ids) : []
        console.log('selOb len', selObs.length)
        props.setSelObs(selObs)
        props.setSelObRows(selObRows)
    };
    return (
        <Tooltip title={"Add selected OBs to observation queue"}>
            <Button variant="outlined" onClick={handleClick}>Select OBs</Button>
        </Tooltip>
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

const AvailableOBTable = (props: Props) => {

    const options: MUIDataTableOptions = {
        filterType: 'dropdown',
        onRowsDelete: () => false,
        selectableRowsHeader: false,
        selectableRowsHideCheckboxes: false,
        customToolbarSelect: selectedRows => (
            <CustomToolbarSelect
                selectedRows={selectedRows}
                setSelObs={props.setSelObs}
                setSelObRows={props.setSelObRows}
                rows={props.rows}
            />
        ),
        selectableRows: 'multiple'
    }

    const columns = [
        { name: 'ob_id', label: 'OB ID', options: { display: false } },
        {
            name: 'name', label: 'OB Name',
            options: { }
        },
        {
            name: 'instrument', label: 'Instrument',
            options: { }
        },
        {
            name: 'container_name', label: 'Container Name',
            options: {}
        },
        {
            name: 'ob_type', label: 'OB Type',
            options: {
                setCellProps: () => ({ style: { minWidth: "80px", maxWidth: "80px" } })

            }
        },
        { name: 'version', label: 'Version', options: { display: false } },
        { name: 'comment', label: 'Comment', options: { display: false } },
        { name: 'ra', label: 'RA', options: { display: true } },
        { name: 'dec', Label: 'Dec', options: { display: true } },
        { name: 'sem_id', Label: 'Semid', options: { display: false } },
    ]

    return (
        <MUIDataTable
            data={props.rows}
            columns={columns}
            options={options}
            title={""}
            components={{ Checkbox: CustomCheckbox }}
        />
    )
}

export default AvailableOBTable