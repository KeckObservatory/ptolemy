import { ObservationBlock, SemesterIds, RawLog } from './../typings/ptolemy';
import { mock_semesters } from './mock_semesters'
import { Container } from "../typings/ptolemy";
import { default as mock_obs } from './ob.json'
import { default as mock_containers } from './containers-demo.json'
import { default as mock_logs } from './mock_logs.json'

import { mock_targets, mock_metadata } from './mock_ob_metadata_targets'

export const mock_get_logs = (
   n_logs: number, 
   subsystem?: string,
   semid?: string, 
   ) => {
   const mockPromise = new Promise<RawLog[]>((resolve) => {
      resolve(mock_logs as RawLog[])
   })
   return mockPromise
}

export const mock_get_container_ob_metadata = (semid: string, container_id?: string) => {
   const mockPromise = new Promise<Partial<ObservationBlock[]>>((resolve) => {
      resolve(mock_metadata as any)
   })
   return mockPromise
}

export const mock_get_container_ob_target = (semid: string, container_id?: string) => {
   const mockPromise = new Promise<Partial<ObservationBlock[]>>((resolve) => {
      resolve(mock_targets as any)
   })
   return mockPromise
}

export const mock_ob_get = (ob_id: string): Promise<ObservationBlock> => {
   const mockPromise = new Promise<ObservationBlock>((resolve) => {
      const idx = Math.floor(Math.random() * mock_obs.length)
      resolve(mock_obs[idx] as unknown as ObservationBlock)
   })
   return mockPromise
}

export const mock_ob_get_many = (ob_ids: string[]): Promise<ObservationBlock[]> => {
      let obs = ob_ids.map((ob_id: string) => {
         const idx = Math.floor(Math.random() * mock_obs.length)
         return mock_obs[idx] as unknown as ObservationBlock
      })
   const mockPromise = new Promise<ObservationBlock[]>((resolve) => {
      resolve(obs)
   })
   return mockPromise
}

export const mock_get_semesters = (): Promise<SemesterIds> => {
   const mockPromise = new Promise<SemesterIds>((resolve) => {
      const semids = {
         associations: mock_semesters.map(sem => sem.sem_id),
         keck_id: 2003
      }
      resolve(semids)
   })
   return mockPromise
}

export const mock_get_containers = (sem_id: string): Promise<Container[]> => {
   const mockPromise = new Promise<Container[]>((resolve) => {
      const sem_id_containers = mock_containers.filter((container: Container) => {
         return container.sem_id === sem_id
      }) as Container[]
      resolve(sem_id_containers)
   })
   return mockPromise
}

const sliceIntoChunks = (arr: Array<unknown>, chunkSize: number) => {
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