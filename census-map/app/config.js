export const data = {
  gbrmpa: 'data/gbrmpa-reefs.json',
  keysourcereefs: 'data/source-reefs.json',
  priorityreefs: 'data/priority-reefs.csv',
  gbr2020: 'data/gbr2020.csv',
  grc2020: 'data/grc2020.json',
  features: 'data/GBR-Features-points.pbf',
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