export interface Container {
	_id: string,
	sem_id: string,
	name: string,
	observation_blocks: string[],
	comment?: string
}

export interface Semester {
    _id: string
    comment?: string
    container_list: string[]
    name: string
    sem_id: string
}
export type Method = 'get' | 'put' | 'post' | 'remove'
export type Document = ObservationBlock | object
export type SourceAPI = 'ptolemy_demo' | 'ptolemy_local' | 'ptolemy_docker'

export type OBSequence = Acquisition | Science
export type OBComponent = Target | OBSequence 
export type OBSeqNames = 'acquisition' | 'science' | 'signature' | 'target' | 'sequences'

export type OBType = 'science' | 'engineering' | 'calibration'
export interface Base {
	comment?: string
}

export interface Status extends Base {
	executions: string[]
	state: string
}

export interface Scoby {
	row_id?: string
	sem_id?: string
	container_id?: string
	ob_id?: string
    name?: string
}

export interface OBCell {
	target?: Target;
	id: string;
	name: string;
	type: 'ob' | 'container';
	ra?: string;
	dec?: string;
	cid?: string;
	ob?: ObservationBlock;
}

export interface OBMetadata {
	name: string;
	version: string | number;
	priority: number;
	ob_type: OBType; 
	pi_id: number;
	sem_id: string;
	instrument: Instrument;
	comment: string
}


export interface ObservationBlock extends Base {
	_id: string,
	metadata: OBMetadata;
	target?: Target;
	time_constraints: string[] | string[][];
	comment: string;
	sequences?: Science[];
	acquisition: Acquisition;
	associations: string[];
	status: Status;
}

export type Acquisition = DefaultAcquisition | KCWIAcquisition

export interface AcquisitionMetadata extends Metadata {

}

export interface BaseSequence extends Base {
	metadata: Metadata;
	parameters: { [key:string]: any }
}

export interface DefaultAcquisition extends BaseSequence{
    metadata: AcquisitionMetadata;
	template_id: string;
}

export type GSMode = 'Automatic' | 'Operator' | 'User'
export type PO = 'REF' | 'IFU'
export type Slicer = 'Small' | 'Medium' | 'Large'
export type Grating = 'BL' | 'BM' | 'BH1' | 'BH2' | 'RL' | 'RM' | 'RH1' | 'RH2'
export type Instrument = 'KCWI' | 'DEIMOS' | 'MOSFIRE'

export interface KCWIAcquisition extends BaseSequence {
	parameters: KCWIAcquisitionParameters
}

export interface KCWIAcquisitionParameters extends Base {
	guider_po: string,
	wrap: string,
	ra_offset: number,
	dec_offset: number,
	guider_gs_ra: number,
	guider_gs_dec: number,
	guider_gs_mode: GSMode
}

export interface Dither extends Base {
	'min': number,
	'max': number,
	'letter': string,
}

export type Science = KCWIScience

export interface KCWIScienceParameters {
    [key: string]: number | string | Slicer | Grating | any
}

export interface Metadata {
	name: string,
	version: string,
	ui_name: string,
	instrument: Instrument,
    template_type: string,
	script: string
}

export interface SequenceMetadata {
	[key: string]: any
}

export interface ScienceMetadata extends SequenceMetadata {
}

export interface AcquisitionMetadata extends SequenceMetadata {
}

export interface KCWIScience extends Base {
	metadata: ScienceMetadata;
	parameters: KCWIScienceParameters;
	template_id?: string;
}

export interface DefaultScience extends Base{
	instrument: string,
	exposure_sequences: string[],
	associations: string[],
}

export interface Observation extends Base {
	exposure_sequences: string[],
	associations: string[],
}

export interface Target {
	name: string,
	ra: string,
	dec: string,
	ra_deg?: number,
	dec_deg?: number,
	equinox: number,
	frame: string,
	ra_offset: number,
	dec_offset: number,
	pa: number,
	pm_ra: number,
	pm_dec: number,
	d_ra: number,
	d_dec: number,
	epoch: number,
	obstime: number,
	mag: Magnitude[],
	wrap?: string,
	comment?: string
}

export interface Magnitude extends Base {
	band: string,
	mag: number,
}


export type InstrumentPackage = KCWIInstrumentPackage

interface KCWIInstrumentPackage extends Base {
  instrument: Instrument
  version: string | number
  modes: string[]
  cameras: Cameras[]
  templates: InstrumentPackageTemplates
  configuration_parameters: object[]
}

export type CameraName = "BLUE" | "RED"
export type CameraIdentifier = "CAM1" | "CAM2"

export interface Cameras extends Object {
  name: CameraName 
  type: string
  identifier: CameraIdentifier
  detector: string
}

export interface TemplateEntry {
	name: string;
	version: string
}

export interface InstrumentPackageTemplates {
  [key: string]: TemplateEntry[] 
}

export type TemplateType = "acq" | "sci" | "config"

export interface TemplateMetadata extends Metadata {

}

export interface TemplateParameter {
  ui_name: string;
  option: string;
  allowed: string[] | number[] | object[];
  default: string | number | null;
  type: string;
  optionality: string;
}

export interface Template {
	template_id: string;
	metadata: TemplateMetadata;
	parameters: {[key: string]: TemplateParameter};
    name: string,
}
