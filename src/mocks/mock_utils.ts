import { Instrument, ObservationBlock, Template } from '../typings/ptolemy';
import { mock_semesters } from './mock_semesters'
import { Semester, Container, InstrumentPackage } from "../typings/ptolemy";
import { default as mock_obs } from './ob.json'
import { default as mock_templates } from './templates.json'
import { default as mock_containers } from './containers-demo.json'
import { default as mock_instrument_packages } from './instrument_packages.json'


export const mock_get_instrument_package = (instrument: Instrument): Promise<InstrumentPackage> => {
   const mockPromise = new Promise<InstrumentPackage>((resolve) => {
      const ip = mock_instrument_packages[0] as InstrumentPackage
      resolve(ip)
   })
   return mockPromise
}

export const mock_get_template = (name: string): Promise<Template[]> => {
   const mockPromise = new Promise<Template[]>((resolve) => {
      const template = mock_templates.find(t => t.metadata.name === name) as any
      resolve([template])
   })
   return mockPromise
}

export const mock_ob_get = (ob_id: string): Promise<ObservationBlock> => {
   const mockPromise = new Promise<ObservationBlock>((resolve) => {
      const idx = Math.floor(Math.random() * mock_obs.length)
      resolve(mock_obs[idx] as ObservationBlock | any)
   })
   return mockPromise
}

export const mock_get_semesters = (observer_id: string): Promise<Semester[]> => {
   const mockPromise = new Promise<Semester[]>((resolve) => {
      resolve(mock_semesters)
   })
   return mockPromise
}

export const mock_get_containers = (sem_id: string, observer_id: string): Promise<Container[]> => {
   const mockPromise = new Promise<Container[]>((resolve) => {
      const sem_id_containers = mock_containers.filter((container: Container) => {
         return container.sem_id === sem_id
      }) as Container[]
      resolve(sem_id_containers)
   })
   return mockPromise
}

const sliceIntoChunks = (arr: Array<any>, chunkSize: number) => {
   const res = [];
   for (let i = 0; i < arr.length; i += chunkSize) {
      const chunk = arr.slice(i, i + chunkSize);
      res.push(chunk);
   }
   return res;
}

export const mock_get_observation_block_from_container = (container_id: string): Promise<ObservationBlock[]> => {
   const mockPromise = new Promise<ObservationBlock[]>((resolve) => {
      const obsChunks = sliceIntoChunks(mock_obs, 5)
      const idx = Math.floor(Math.random() * obsChunks.length)
      const obs = obsChunks[idx] as ObservationBlock[]
      resolve(obs)
   })
   return mockPromise
}