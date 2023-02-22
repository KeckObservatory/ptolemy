import { Container, Scoby, DetailedContainer } from "../typings/ptolemy";
import { get_select_funcs, get_container_ob_data } from './ApiRoot';
import { ObservationBlock, SemesterIds } from '../typings/ptolemy'

export const get_sem_id_list = (): Promise<SemesterIds> => {
   //make sem_id list from semesters
   const promise = new Promise<SemesterIds>((resolve) => {
      get_select_funcs.get_semesters().then((semesterIds: SemesterIds) => {
         resolve(semesterIds)
      })
   })
   return promise
}

export const get_container_target_metadata = async (sem_id: string, container_id?: string) => {
   const metadata = await get_container_ob_data.get_container_ob_metadata(sem_id, container_id)
   const targets = await get_container_ob_data.get_container_ob_target(sem_id, container_id)
   let obs: Partial<ObservationBlock>[] = []
   metadata.forEach((md: Partial<ObservationBlock>) => {
      const target = targets.find((t: Partial<ObservationBlock>) => t._id === md._id)
      if (target) {
         md['target'] = target['target']
      }
      else {
      }
      obs.push(md)
   })
   return obs
}

export const make_all_ob_container = async (sem_id: string, detailedContainers: DetailedContainer[]) => { //make synthetic container for All OBs
   let allContainer: DetailedContainer = {
      name: 'All OBs',
      observation_blocks: [],
      ob_details: [],
      _id: 'All OBs',
      sem_id: sem_id
   }
   let partialObs: Partial<ObservationBlock>[] = []
   if (sem_id) {
      partialObs = await get_container_target_metadata(sem_id)
   }
   allContainer['ob_details'] = partialObs
   detailedContainers.push(allContainer)
   return detailedContainers
}

export const make_detailed_containers = async (sem_id: string, containers: Container[]) => { // adds All OBs in a special container
   const detailedContainers: DetailedContainer[] = []
   for (let idx = 0; idx < containers.length; idx++) {
      const container = containers[idx]
      let partialObs: Partial<ObservationBlock>[] = []
      if (sem_id) {
         partialObs = await get_container_target_metadata(sem_id, container._id)
      }
      const dContainer: DetailedContainer = { ...container, 'ob_details': partialObs }
      detailedContainers.push(dContainer)
   }
   return detailedContainers
}

const scoby_rows_and_det_containers = (sem_id: string, detailedContainers: DetailedContainer[]) => {
   let scoby: Scoby[] = []
   detailedContainers.forEach((container: DetailedContainer) => {
      const cid = container._id
      container.ob_details.forEach((ob: Partial<ObservationBlock>) => {
         const row: Scoby = {
            sem_id: sem_id,
            container_id: cid,
            ob_id: ob._id as string,
            container_name: container.name,
            name: ob.metadata?.name as string,
            ra: ob.target?.parameters.target_coord_ra,
            dec: ob.target?.parameters.target_coord_dec,
            comment: ob.comment as string,
            ob_type: ob.metadata?.ob_type as string,
            version: ob.metadata?.version as string,
         }
         scoby.push(row)
      })
   })
   return scoby
}

export const remove_duplicated_rows = (scoby: Scoby[]) => {
   const scobyObj: { [key: string]: Scoby } = {}
   // find duplicates
   scoby.forEach((row: Scoby) => {
      const ob_id = row.ob_id as string
      const container_id = row.container_id
      if (scobyObj.hasOwnProperty(ob_id)) { // determine which duplicated row to use
         const incumbant_row = scobyObj[ob_id]
         const incumbant_container_id = incumbant_row.container_id
         if (incumbant_container_id === 'All OBs') { // replace synthetic row with actual.
            scobyObj[ob_id] = row
         }
      }
      else {
         scobyObj[ob_id] = row
      }
   })
   const uniqueScoby = Object.values(scobyObj)
   return uniqueScoby
}

export const make_semid_scoby_table_and_containers = async (sem_id: string): Promise<[Scoby[], DetailedContainer[]]> => {
   return get_containers(sem_id)
      .then(async (containers: Container[]) => {
         return await make_detailed_containers(sem_id, containers)
      })
      .then(async (detailedContainers: DetailedContainer[]) => {
         return await make_all_ob_container(sem_id, detailedContainers)
      })
      .then((detailedContainers: DetailedContainer[]) => {
         let scoby = scoby_rows_and_det_containers(sem_id, detailedContainers)
         scoby = remove_duplicated_rows(scoby)
         return [scoby, detailedContainers]
      })
}

export const get_containers = (sem_id: string): Promise<Container[]> => {
   //make container given sem_id
   const promise = new Promise<Container[]>((resolve) => {
      if (!sem_id) {
         resolve([])
      }
      else {
         resolve(get_select_funcs.get_containers(sem_id))
      }
   })
   return promise
}