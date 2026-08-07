export type DeviceType = 'desktop' | 'mobile' | 'tablet'

export interface PortalConnection {
  connectionId: string
  userId: string
  country: string
  countryName: string
  city: string
  timezone: string
  device: DeviceType
  internetSpeedMbps: number
  connectedAt: string
  relatedCountry: string
}

export interface CountryNode {
  code: string
  name: string
  connectionCount: number
  avgSpeedMbps: number
  deviceCounts: Record<DeviceType, number>
  timezones: string[]
}

export interface CountryRelation {
  from: string
  to: string
  weight: number
}

export interface GraphData {
  nodes: CountryNode[]
  relations: CountryRelation[]
}
