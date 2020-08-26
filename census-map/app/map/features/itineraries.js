import { mapbox } from '../../config.js';
import { props } from '../../util/state.js';
// import 'https://cdnjs.cloudflare.com/ajax/libs/Turf.js/5.1.6/turf.min.js';

const subprops = {
  // GeoJSON object to hold our measurement features
  geojson: {
    type: 'FeatureCollection',
    features: [],
  },
  // Layer ids
  layer: {
    points: 'itinerary-points',
    lines: 'itinerary-lines',
    labels: 'itinerary-labels',
    reefs: 'itinerary-reefs',
  },
  // currently visible gids
  active: [],
}

// Create a linestring to show a line between reefs
const getLinestring = (coordinates=[], properties={}) => ({
  type: 'Feature',
  properties,
  geometry: {
    type: 'LineString',
    coordinates,
  },
});


export const init = (map) => {
  // map.on('click', getPoint);

  map.addSource('itineraries', {
    type: 'geojson',
    data: subprops.geojson,
  });

  generateHatch().then((img) => {
    map.addImage('itinerary-hatch', img);

    map.addLayer({
      id: subprops.layer.reefs,
      type: 'fill-extrusion',
      source: 'composite',
      'source-layer': map.getLayer(mapbox.layer.features).sourceLayer,
      paint: {
        'fill-extrusion-pattern': 'itinerary-hatch',
        'fill-extrusion-base': 700,
        // 'fill-extrusion-opacity': [
        //   'interpolate',
        //   ['exponential', 0.5],
        //   ['zoom'],
        //   6,
        //   0,
        //   8,
        //   1
        // ],
        'fill-extrusion-height': 1800,
        // 'fill-extrusion-height': [
        //   'case',
        //   ['==', ['get', 'gid'], ['feature-state', 'active']],
        //   1200,
        //   1100
        // ],
        // 'fill-extrusion-opacity': [
        //   'interpolate',
        //   ['linear'],
        //   ['feature-state', 'opacity'],
        //   0, 0,
        //   1, 1
        // ],
      },
    }, mapbox.layer.labels);

    filterReefs(map, false);
  });


  map.addLayer({
    id: subprops.layer.lines,
    type: 'line',
    source: 'itineraries',
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-color': '#000',
      'line-width': 2,
      'line-dasharray': [2, 2],
      'line-opacity': [
        'interpolate',
        ['exponential', 0.5],
        ['zoom'],
        8, 0,
        10, 1
      ],
    },
    filter: ['in', '$type', 'LineString']
  });
  
  // Add styles to the map
  map.addLayer({
    id: subprops.layer.points,
    type: 'circle',
    source: 'itineraries',
    paint: {
      'circle-radius': 3,
      'circle-stroke-color': '#000',
      'circle-stroke-width': 2,
      'circle-color': '#fff',
      'circle-stroke-opacity': [
        'interpolate',
        ['exponential', 0.5],
        ['zoom'],
        9, 0,
        10, 1
      ],
      'circle-opacity': [
        'interpolate',
        ['exponential', 0.5],
        ['zoom'],
        9, 0,
        10, 1
      ],
    },
    filter: ['in', '$type', 'LineString']
  });

  map.addLayer({
    id: subprops.layer.labels,
    type: 'symbol',
    source: 'itineraries',
    layout: {
      'symbol-placement': 'line',
      'symbol-spacing': 150,
      'text-field': ['get', 'title'],
      'text-font': ['Roboto Bold'],
      'text-justify': 'auto',
      'text-size': 12,
    },
    paint: {
      'text-color': '#00007f',
      'text-color': '#000',
      'text-halo-color': '#fff',
      'text-halo-color': '#d8e9fe',
      'text-halo-width': 2,
      'text-opacity': [
        'interpolate',
        ['exponential', 0.5],
        ['zoom'],
        9, 0,
        10, 1
      ],
    },
    filter: ['in', '$type', 'LineString']
  });

  update(map);
};

const activeItineraries = () =>
  props.activeControls.itineraries
  ? [].concat(props.activeItinerary || props.itineraries)
  : [];

const filterReefs = (map, gids) => {
  const active = Array.isArray(gids) && gids.length
    ? gids.filter((gid, i) => gids.indexOf(gid) === i)
    : [typeof gids === 'string' ? gids : 0];

  const isEqual = active.length === subprops.active.length
    && !active.find(v => !subprops.active.includes(v));

  // don't re-render
  if (isEqual) return;
  subprops.active = active;

  map.setFilter(subprops.layer.reefs, [
    'match',
    ['get', 'gid'],
    subprops.active,
    true,
    false
  ]);
};

export const update = (map) => {
  subprops.geojson.features = activeItineraries().map(i => getLinestring(i.features.map(f => f.geometry.coordinates), { title: i.title }));
  map.getSource('itineraries').setData(subprops.geojson);
}

export const render = (map) => {
  if (!map.getLayer(subprops.layer.reefs)) return;
  
  const features = activeItineraries().reduce((_, i) => _.concat(i.features), []);
  filterReefs(map, features.map(f => f.properties.gid));
}

const getPoint = (e) => {
  const features = map.queryRenderedFeatures(e.point, { layers: ['measure-points'] });

  // Remove the linestring from the group
  // So we can redraw it based on the points collection
  if (subprops.geojson.features.length > 1) subprops.geojson.features.pop();

  // If a feature was clicked, remove it from the map
  if (features.length) {
    const id = features[0].properties.id;
    subprops.geojson.features = subprops.geojson.features.filter(point =>
      point.properties.id !== id);
  } else {
    const point = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [e.lngLat.lng, e.lngLat.lat]
      },
      properties: {
        id: String(new Date().getTime())
      },
    };
    subprops.geojson.features.push(point);
  }

  if (subprops.geojson.features.length > 1) {
    linestring.geometry.coordinates = subprops.geojson.features.map(point =>
      point.geometry.coordinates);
    subprops.geojson.features.push(linestring);
  }
  map.getSource('itineraries').setData(subprops.geojson);
};


const generateHatch = () => new Promise((resolve) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.height = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(4, 4);
  ctx.strokeStyle = '#c00';
  ctx.stroke();
  const img = new Image();
  img.onload = () => resolve(img);
  img.src = canvas.toDataURL('image/png');
});

export default { init, update, render };