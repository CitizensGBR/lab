export const data = {
  gbrmpa: 'data/gbrmpa-reefs.json',
  features: 'data/GBR-Features-points.pbf',
  keysourcereefs: 'data/source-reefs.json',
  priorityreefs: 'data/priority-reefs-2020.csv',
  /* V2 */
  grc2020: 'data/v2/grc2020.json',
  priorityreefsv2: 'data/v2/priority-reefs-final-2020.csv',
  dhw: 'data/v2/dhw.csv',
  cotspriority: 'data/v2/cots-priority-2021.json',
  cotstarget: 'data/v2/cots-target-2021.json',
  /* OLD - can remove */
  gbr2020: 'data/v2/gbr2020.csv',
};

export const mapbox = {
  style: 'mapbox://styles/citizensgbr/ckbfua7qs392g1inrykf56d9m',
  token: 'pk.eyJ1IjoiY2l0aXplbnNnYnIiLCJhIjoiY2poem8xZGk4MHo4NDNscGJsNGxzdHl6NiJ9._B84xipGf6JtH64bRGqlog&fresh=true',
  layer: {
    labels: 'gbr-labels',
    features: 'gbr-features',
    elevation: 'gbr-elevation',
  },
};

export default { data, mapbox };