import React from "react"
import { ra_dec_to_deg } from '../sky-view/sky_view_util'
import { Scoby } from "../../../typings/ptolemy"

interface Props {
    selOBRows: Scoby[]
}

const format_target_coords = (ra: string | number, dec: string | number) => {
    const coords = `${ra} ${dec}`
    return coords
}

const style_popup = () => {
    const pt: any = document.querySelector('.aladin-popupTitle')
    pt.setAttribute('style', 'color: black')
}

const add_target = (aladin: any, win: any, ra: number, dec: number) => {
    var cat = win.A.catalog({ name: 'Target', sourceSize: 18 });
    aladin.addCatalog(cat);
    const options = { popupTitle: 'Target', popupDesc: '' }
    cat.addSources([win.A.marker(ra, dec, options)]);
    style_popup()
}

const add_selected_catalog = (aladin: any, win: any, selOBRow: Scoby) => {
    var cat = win.A.catalog({ name: 'Selected Catalog Star', sourceSize: 18, shape: 'circle' });
    aladin.addCatalog(cat);
    const options = {}
    cat.addSources(win.A.source(selOBRow.ra, selOBRow.dec, options));
}

const add_catalog = (aladin: any, win: any, selOBRows: Scoby[]) => {
    var cat = win.A.catalog({ name: 'Targets', sourceSize: 18 });
    aladin.addCatalog(cat);
    aladin.on('objectClicked', function (object: any) {
        if (object) {
            console.log('objectClicked', object)
        }
    })

    aladin.on('objectHovered', function (object: any) {
        if (object) console.log('objectHovored', object.data?.id0)
    })

    for (let idx = 0; idx < selOBRows.length; idx++) {
        const obRow = selOBRows[idx]
        const id0 = obRow.ob_id 
        const options = {
            id0: id0,
            idx: idx,
            popupTitle: obRow.name
        }
        obRow.ra && 
            cat.addSources(
                win.A.marker(ra_dec_to_deg(obRow.ra as string), 
                            ra_dec_to_deg(obRow.dec as string, true), options));
    }
}

export default function Aladin(props: Props) {

    const scriptloaded = () => {
        const win: any = window
        const firstRow = props.selOBRows[0]

        let params: any = { survey: 'P/DSS2/color', zoom: 2, showReticle: true }
        if (firstRow.ra) {
            let ra = ra_dec_to_deg(firstRow.ra as string)
            let dec = ra_dec_to_deg(firstRow.dec as string, true)
            const coords = format_target_coords(ra, dec)
            params['target'] = coords
        }

        let aladin = win.A.aladin('#aladin-lite-div', params);

        // add_target(aladin, win, raDeg, decDeg)
        add_catalog(aladin, win, props.selOBRows)
        // if (props.selIdx) {
        //     console.log('selected idx:', props.selIdx)
        //     const selRow = props.selOBRows[props.selIdx]
        //     add_selected_catalog(aladin, win, selRow)
        // }
        const url = 'https://irsa.ipac.caltech.edu/cgi-bin/Gator/nph-query?catalog=allwise_p3as_psd&spatial=cone&radius=300&radunits=arcsec&objstr=00h+42m+44.32s+41d+16m+08.5s&size=300&outfmt=3&selcols=ra,dec,w1mpro,w2mpro,w3mpro,w4mpro'
        win.A.catalogFromURL(url)
    }

    React.useEffect(() => {

        // const aladinStyle = document.createElement('link')
        // aladinStyle.href = "https://aladin.u-strasbg.fr/AladinLite/api/v3/latest/aladin.min.css"
        // aladinStyle.rel = 'stylesheet'
        // aladinStyle.type = 'text/css'
        // document.head.appendChild(aladinStyle)
        // const jqScript = document.createElement("script")
        // jqScript.src = "https://code.jquery.com/jquery-1.12.1.min.js"
        // jqScript.async = true
        // document.body.appendChild(jqScript)
        // console.log('generating aladin window')
        const script = document.createElement("script")
        script.src = "https://aladin.u-strasbg.fr/AladinLite/api/v3/latest/aladin.js"
        script.async = true
        script.onload = scriptloaded
        document.body.appendChild(script)
    }, [])

    React.useEffect(() => {


    }, [props.selOBRows])


    return (
        <div id='aladin-lite-div' style={{ width: '600px', height: '600px' }} />
    )
}
