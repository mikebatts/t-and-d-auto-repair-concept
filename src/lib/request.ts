import { createContext, useContext } from 'react'
import type { ServiceKey } from './business'

export interface RequestApi {
  /**
   * Opens the guided request dialog, optionally with a service pre-selected.
   * `trigger` is the control that opened it; focus returns there on close.
   */
  openRequest: (service?: ServiceKey, trigger?: HTMLElement | null) => void
}

export const RequestContext = createContext<RequestApi>({ openRequest: () => {} })

export const useRequest = () => useContext(RequestContext)
