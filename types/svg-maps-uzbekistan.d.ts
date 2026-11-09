declare module '@svg-maps/uzbekistan' {
  interface SvgMapLocation {
    id: string
    name: string
    path: string
  }

  interface SvgMap {
    label: string
    viewBox: string
    locations: SvgMapLocation[]
  }

  const map: SvgMap
  export default map
}
