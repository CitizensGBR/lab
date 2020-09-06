import 'https://cdnjs.cloudflare.com/ajax/libs/mapbox-gl/1.11.1/mapbox-gl.js';

import { mapbox } from '../config.js';
import { $el } from '../util/dom.js';
import { props, hash } from '../util/state.js';
import { debounce } from '../util/wait.js';
import { load } from '../util/template.js';
import filterKey from '../controls/filter/key.js';
import Reefs from './features/reefs.js';
import Itineraries from './features/itineraries.js';

let map;
let ready;
const templates = {
  attribution: 'app/map/template/attribution.html',
  popupDepth: 'app/map/template/popup-depth.html',
  popupReef: 'app/map/template/popup-reef.html',
};

export const init = () => new Promise((resolve) => {
  if (hash.props.selected && hash.props.selected.value) {
    hash.props.selected.value = hash.props.selected.value.split(',');
  } else {
    hash.set('selected', '');
  }

  mapboxgl.accessToken = mapbox.token;
  map = new mapboxgl.Map({
    container: 'map',
    style: mapbox.style, // stylesheet location
    center: [146, -16.77], // starting position [lng, lat]
    zoom: 6, // starting zoom
    attributionControl: false,
  });
  map.once('render', map.resize);
  Promise.all([
    load(templates),
    new Promise(resolve => map.once('load', resolve)),
  ])
  .then(() => {
    map.addControl(new mapboxgl.AttributionControl({
      customAttribution: templates.attribution(),
    }));
    map.addControl(new mapboxgl.ScaleControl({
      // maxWidth: 80,
    }));
 
    mapReady();
    resolve();
  });
});


const mapReady = () => {
  ready = true;
  Itineraries.init(map);
  Reefs.init(map);

  map.easeTo({
    zoom: 10,
    bearing: 0,
    pitch: 40,
    duration: 2000,
    center: [146.265366, -16.778374] // Milln Reef,
  });

  const debounceRender = debounce(render, 500);

  map.on('click', () => delete $el.search.dataset.focus);
  map.on('move', debounceRender);
  map.on('sourcedata', debounceRender);
  map.on('mouseenter', mapbox.layer.elevation, () => {
    map.getCanvas().style.cursor = 'auto';
    map.on('mousemove', mapbox.layer.elevation, onMove);
  });
  map.on('mouseleave', mapbox.layer.elevation, () => {
    map.getCanvas().style.cursor = '';
    map.off('mousemove', mapbox.layer.elevation, onMove);
    onMove();
  });

  map.on('click', mapbox.layer.reefs, (e) => {
    const feature = e.features[0];
    const state = map.getFeatureState(feature);
    const reset = state && state.selected === feature.properties.id;
    map.setFeatureState(feature, { selected: reset ? null : feature.properties.id });
    let list = [].concat((hash.props.selected && hash.props.selected.value) || []);
    if (reset) {
      const i = list.indexOf(feature.properties.gid);
      if (i >= 0) list.splice(i, 1);
    } else {
      list.push(feature.properties.gid);
    }
    hash.set('selected', list);
    filterKey.update();
  });
  map.on('mousemove', mapbox.layer.features, (e) => {
    const feature = e.features[0];
    if (props.feature && feature.properties.id === props.feature.properties.id) return;
    if (props.feature) {
      map.setFeatureState(props.feature, { hover: false });
    }
    props.feature = feature;
    map.setFeatureState(feature, { hover: feature.properties.id });
  });
  map.on('mouseleave', mapbox.layer.reefs, () => {
    if (props.feature) {
      map.setFeatureState(props.feature, { hover: false });
    }
    props.feature = null;
  });
};

export const deselect = () => {
  hash.set('selected', null);
  delete props.selected;
  map.queryRenderedFeatures({ layers: [mapbox.layer.reefs] })
  .forEach((feature) => {
    const state = map.getFeatureState(feature);
    if (state.selected) {
      map.setFeatureState(feature, { selected: null });
    }
  });
  filterKey.render();
};

export const update = (doRender) => {
  if (!ready) return;
  Itineraries.update(map);
  if (doRender) render();
};

export const render = () => {
  if (!ready) return;
  const filtered = props.filtered || {};
  if (filtered.running || (!filtered.active && !filtered.reset) || !mapbox.layer.reefs) return;
  
  filtered.running = true;
  // const selectedList = props.activeControls.itineraries && props.activeItinerary
  // ? props.activeItinerary.features.map(feature => feature.properties.gid)
  // : [].concat((hash.props.selected && hash.props.selected.value) || []);
  const selectedList = [].concat((hash.props.selected && hash.props.selected.value) || []);
  map.queryRenderedFeatures({ layers: [mapbox.layer.reefs] })
  .forEach((feature) => {
    const state = map.getFeatureState(feature);
    const item = filtered.gid[feature.properties.gid];
    const toggled = item && (hash.props[item.filter.key] || {}).toggle || null;
    const selected = selectedList.indexOf(feature.properties.gid) >= 0 ? feature.properties.id : null;
    map.setFeatureState(feature, {
      colour: item ? item.filter.colour : null,
      filtered: item ? feature.properties.gid : null,
      toggled,
      selected,
    });
  });
  Itineraries.render(map);
  filtered.running = false;
};

const onMove = (e) => {
  if (!e) {
    if (props.popup && props.popup.isOpen()) props.popup.remove();
    return;
  }

  const feature = e.features[0];
  const z = feature.properties.z;
  const depth = z > 0 ? z : (z <= -100 && `~${Math.max(200, -z + 10)}`)
    || `${-z}`;

  if (!props.popup) {
    props.popup = new mapboxgl.Popup({
      anchor: 'top-left',
      closeButton: false,
      closeOnClick: false,
      className: 'popup-hover',
      offset: [9, 18],
    });
    
    if (!props.popupElement) {
      props.popupElement = document.createElement('div');
      props.popupElement.className = 'popup-hover--content meta-item';
    }
    props.popup.setDOMContent(props.popupElement);
    props.popup.trackPointer();
  }
  
  // props.popup.setLngLat(e.lngLat)
  if (!props.popup.isOpen()) {
    setTimeout(() => props.popup.addTo(map));
  }

  props.popupElement.innerHTML = templates.popupDepth({ z, depth, lngLat: e.lngLat });

  if (props.feature && !props.popupReef) {
    const data = props.data.features.find(f => f.id === props.feature.properties.id);
    props.popupReef = new mapboxgl.Popup({
      anchor: 'bottom',
      closeButton: false,
      closeOnClick: false,
      className: 'popup-hover',
      offset: 50,
    }).setLngLat(data.geometry.coordinates);
    props.popupReef.setHTML(templates.popupReef({ reef: data.properties }));
    props.popupReef.addTo(map);
  } else if (!props.feature && props.popupReef) {
    props.popupReef.remove();
    delete props.popupReef;
  }
};

export const easeTo = (center, duration = 2000) =>
  map.easeTo(Object.assign({
    zoom: 10,
    bearing: 0,
    pitch: 40,
  }, center.center ? center : {
    center,
    duration,
  }));

export const fitBounds = (bounds, options = {}) =>
  map.fitBounds(bounds, Object.assign({
    maxZoom: 10,
    bearing: 0,
    pitch: 40,
  }, options));

export const toBounds = list => [].concat(list).reduce((_, feature) => {
  if (!_) return [[feature.geometry.coordinates[0], feature.geometry.coordinates[1]], [feature.geometry.coordinates[0], feature.geometry.coordinates[1]]];
  _[0][0] = Math.min(_[0][0], feature.geometry.coordinates[0]);
  _[0][1] = Math.min(_[0][1], feature.geometry.coordinates[1]);
  _[1][0] = Math.max(_[1][0], feature.geometry.coordinates[0]);
  _[1][1] = Math.max(_[1][1], feature.geometry.coordinates[1]);
// [sw, ne]
  return _;
}, false);

export default { init, deselect, easeTo, fitBounds, toBounds, render, update };
