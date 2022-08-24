
export interface OBTableRow { 
_id: string
acquisition: string
common_parameters: string
instrument: string
number_sequences: number
ob_name: string
ob_type: string
sem_id: string
tags: string[]
target_name?: string
}

// to be replaced by OBTableRow when api is complete
export interface GlobalTableRow { 
    ob_id: string,
    name?: string,
    ob_type: string,
    sem_id: string,
    instrument: string,
    tags?: string[],
    target?: string,
    acquisition?: string,
    common_parameters?: string,
    observations?: string
}

export interface UserInfo {
    status: string;
    Id: number;
    Title: string;
    FirstName: string;
    MiddleName: string;
    LastName: string;
    Email: string;
    Affiliation: string;
    WorkArea: string;
    Interests: string;
    Street: string;
    City: string;
    State: string;
    Country: string;
    Zip: string;
    Phone: string;
    Fax: string;
    URL: string;
    ModDate: string;
    Exposed: string;
    username: string;
    resetcode: number;
    AllocInst: string;
    BadEmail: string;
    Category: string;
}