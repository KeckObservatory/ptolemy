import axios, { AxiosResponse } from 'axios';

import { handleResponse, handleError, intResponse, intError } from './response';
import {
    Container,
    ObservationBlock,
    SemesterIds,
    Instrument,
    InstrumentPackage,
    Template
} from './../typings/papahana'
import { OBTableRow, UserInfo } from './../typings/ddoi_api'
import {
    mock_get_instrument_package,
    mock_get_template,
    mock_get_containers,
    mock_get_observation_block_from_container,
    mock_get_semesters,
    mock_ob_get,
    mock_get_semester_obs,
    mock_get_container_ob_metadata,
    mock_get_container_ob_target,
    mock_get_ob_table

} from '../mocks/mock_utils';

// Define your api url from any source.
// Pulling from your .env file when on the server or from localhost when locally
const IS_PRODUCTION: boolean = process.env.REACT_APP_ENVIRONMENT === 'production'
const IS_DEVELOPMENT: boolean = process.env.REACT_APP_ENVIRONMENT === 'development'
const IS_BUILD = IS_PRODUCTION || IS_DEVELOPMENT

console.log(`is BUILD ? set to ${IS_BUILD}`)
console.log(`is DEVELOPMENT ? set to ${IS_DEVELOPMENT}`)
var DEVELOPMENT_URL = 'https://www3build.keck.hawaii.edu'
var PRODUCTION_URL = 'https://www3.keck.hawaii.edu'
var TEST_URL = 'http://localhost:50000/v0' //use locally or for testing (npm start or npm run demobuild)
var BASE_URL = IS_BUILD ? PRODUCTION_URL : TEST_URL // sets for production vs test 

BASE_URL = IS_DEVELOPMENT ? DEVELOPMENT_URL : BASE_URL
var API_URL = BASE_URL + '/api/ddoi/'

var OB_URL = API_URL + 'obsBlocks'
var CONTAINER_URL = API_URL + 'containers'
var SEMESTERS_URL = API_URL + 'semesterIds'
var INSTRUMENT_URL = API_URL + 'instrumentPackages'
var TAG_URL = API_URL + 'tags'
console.log('backend url set to')
console.log(API_URL)

const axiosInstance = axios.create({
    withCredentials: true,
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }
})
axiosInstance.interceptors.response.use(intResponse, intError);

export const get_userinfo = (): Promise<UserInfo> => {
    const url = BASE_URL + '/userinfo';
    return axiosInstance.get(url)
        .then(handleResponse)
        .catch(handleError)
}

const get_ob_table = (): Promise<OBTableRow[]> => {
    const url = API_URL + '/search/ob/tableview';
    return axiosInstance
        .get(url)
        .then(handleResponse)
        .catch(handleError)
}

const get_semesters = (): Promise<SemesterIds> => {
    const url = `${SEMESTERS_URL}`
    return axiosInstance
        .get(url)
        .then(handleResponse)
        .catch(handleError);
}

const get_semester_obs = (sem_id: string): Promise<ObservationBlock[]> => {
    const url = `${SEMESTERS_URL}/${sem_id}/ob`
    return axiosInstance
        .get(url)
        .then(handleResponse)
        .catch(handleError);
}

const get_instrument_package = (instrument: Instrument): Promise<InstrumentPackage> => {
    const url = `${INSTRUMENT_URL}/${instrument}`
    return axiosInstance
        .get(url)
        .then(handleResponse)
        .catch(handleError);
}


const get_template = (name: string, ip_version: string = '0.1.0', inst: string = 'KCWI'): Promise<{ [key: string]: Template }> => {
    let url = `${INSTRUMENT_URL}/${inst}/templates?template_name=${name}&ip_version=${ip_version}`
    if (name.includes('target')) {
        url += '&parameter_order=true'
    }
    return axiosInstance
        .get(url)
        .then(handleResponse)
        .catch(handleError);
}

const get_containers = (sem_id: string): Promise<Container[]> => {
    const url = `${SEMESTERS_URL}/${sem_id}/containers?`
    return axiosInstance
        .get(url)
        .then(handleResponse)
        .catch(handleError);
}

const get_observation_blocks_from_container = (container_id: string): Promise<ObservationBlock[]> => {
    const url = `${CONTAINER_URL}/items/?container_id=${container_id}`
    return axiosInstance
        .get(url)
        .then(handleResponse)
        .catch(handleError);
};

const ob_get = (ob_id: string): Promise<ObservationBlock> => {
    const url = `${OB_URL}?ob_id=${ob_id}`
    return axiosInstance
        .get(url)
        .then(handleResponse)
        .catch(handleError);
}

const ob_post = (ob: object): Promise<string> => {
    return axiosInstance
        .post(`${OB_URL}`, ob)
        .then(handleResponse)
};

const ob_put = (ob_id: string, ob: ObservationBlock): Promise<unknown> => {
    const url = `${OB_URL}?ob_id=${ob_id}`
    return axiosInstance
        .put(url, ob)
        .then(handleResponse)
        .catch(handleError);
};

const ob_remove = (ob_id: string): Promise<unknown> => {
    return axiosInstance
        .delete(`${OB_URL}?ob_id=${ob_id}`)
        .then(handleResponse)
        .catch(handleError);
};

const container_get = (container_id: string): Promise<Container> => {
    const url = `${CONTAINER_URL}?container_id=${container_id}`
    return axiosInstance
        .get(url)
        .then(handleResponse)
        .catch(handleError);
}

const container_post = (container: object): Promise<string> => {
    return axiosInstance
        .post(`${CONTAINER_URL}`, container)
        .then(handleResponse)
        .catch(handleError);
};

const container_put = (container_id: string, container: Container): Promise<number> => {
    const url = `${CONTAINER_URL}?container_id=${container_id}`
    return axiosInstance
        .put(url, container)
        .then(handleResponse)
        .catch(handleError);
};

const container_remove = (container_id: string): Promise<unknown> => {
    return axiosInstance
        .delete(`${CONTAINER_URL}?container_id=${container_id}`)
        .then(handleResponse)
        .catch(handleError);
};

const get_container_ob_metadata = (semid: string, container_id?: string) => {
    let url = `${SEMESTERS_URL}/${semid}/ob/metadata`
    url = container_id ? url + `?container_id=${container_id}` : url
    return axiosInstance
        .get(url)
        .then(handleResponse)
        .catch(handleError);
}

const get_container_ob_target = (semid: string, container_id?: string) => {
    let url = `${SEMESTERS_URL}/${semid}/ob/targets`
    url = container_id ? url + `?container_id=${container_id}` : url
    return axiosInstance
        .get(url)
        .then(handleResponse)
        .catch(handleError);
}


const add_tag = (ob_id: string, tag: string): Promise<string> => {
    let url = TAG_URL + '/add'
    url = `?tag_name=${tag}&ob_id=${ob_id}`
    return axiosInstance
        .get(url)
        .then(handleResponse)
        .catch(handleError);
};

const delete_tag = (ob_id: string, tag: string): Promise<string> => {
    let url = TAG_URL + '/delete'
    url = `?tag_name=${tag}&ob_id=${ob_id}`
    return axiosInstance
        .get(url)
        .then(handleResponse)
        .catch(handleError);
};

export const get_container_ob_data = {
    get_container_ob_metadata: IS_BUILD ? get_container_ob_metadata : mock_get_container_ob_metadata,
    get_container_ob_target: IS_BUILD ? get_container_ob_target : mock_get_container_ob_target
}


export const get_select_funcs = {
    get_template: IS_BUILD ? get_template : mock_get_template,
    get_semesters: IS_BUILD ? get_semesters : mock_get_semesters,
    get_containers: IS_BUILD ? get_containers : mock_get_containers,
    get_observation_blocks_from_container: IS_BUILD ? get_observation_blocks_from_container : mock_get_observation_block_from_container,
    get_instrument_package: IS_BUILD ? get_instrument_package : mock_get_instrument_package
}

export const ob_api_funcs = {
    get: IS_BUILD ? ob_get : mock_ob_get,
    post: ob_post,
    put: ob_put,
    remove: ob_remove,
};

export const container_api_funcs = {
    get: container_get,
    post: container_post,
    put: container_put,
    remove: container_remove
}

export const semid_api_funcs = {
    get_semester_obs: IS_BUILD ? get_semester_obs : mock_get_semester_obs
}

export const ob_table_funcs = {
    get_ob_table: IS_BUILD ? get_ob_table : mock_get_ob_table 
}

export const tag_functions = {
    add_tag: add_tag,
    delete_tag: delete_tag 
}