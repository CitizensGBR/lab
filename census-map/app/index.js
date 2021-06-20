import Util from './util/index.js';
import { $el } from './util/dom.js';
import Controls from './controls/index.js';
import Map from './map/index.js';
import { load } from './util/data.js';
import { props } from './util/state.js';
import { data as sources } from './config.js';

load(sources).then((data) => {
  props.data = data;

  const meta = props.data.gbrmpa.meta;
  const gidMap = {};
  props.data.gbrmpa.list.forEach((item) => {
    if (!gidMap[item.gid]) gidMap[item.gid] = {};

    const data = gidMap[item.gid];
    data.gbrmpa = true;

    if ('mgmt' in item) data.mgmt = meta.mgmt[item.mgmt];
    if (item.status) data.status = item.status;
    if (item.zone) {
      data.zone = item.zone.map(zone => ({
        ...meta.zone[zone[0]],
        km2: zone[1] || 0,
      }));
    }
    if (item.survey) {
      data.survey = item.survey.map(i => meta.survey[i]);
    }
  });

  const missing = [];
  props.data.priorityreefs.forEach((item) => {
    if (!gidMap[item.gid]) {
      missing.push(item.gid);
      gidMap[item.gid] = {};
    }
    gidMap[item.gid].priorityreef = true;
    Object.assign(gidMap[item.gid], item);
  });

  props.data.keysourcereefs.forEach((gid) => {
    if (!gidMap[gid]) gidMap[gid] = {};
    gidMap[gid].keysourcereef = true;
  });

  const adopt_closest_feature = [];

  props.data.features.forEach((feature, index) => {
    if (!feature.properties.gid) console.log(feature.properties);
    feature.properties.search = [feature.properties.name, feature.properties.gid].filter(v => v).join(' ');
    const lat = feature.geometry.coordinates[1];
    feature.properties.sector = (lat < -14.9 && 'Central') || (lat < -20.5 && 'Southern') || 'Northern';
    feature.properties.index = index;
    const missing_i = missing.indexOf(feature.properties.gid);
    if (missing_i >= 0) missing.splice(missing_i, 1);
    if (gidMap[feature.properties.gid]) {
      Object.assign(feature.properties, gidMap[feature.properties.gid], feature.properties);
    }
    if (!feature.properties.aims_sector || !feature.properties.mgmt) {
      adopt_closest_feature.push(feature);
    }
  });

  /***
   * MAP features missing detail (usually non-reef features) to the closest available feature
   ***/
  adopt_closest_feature.forEach((feature) => {
    const closest_feature = props.data.features
    .filter(f =>
      f.id !== feature.id
      && Math.abs(f.geometry.coordinates[1] - feature.geometry.coordinates[1]) < 0.5
      && Math.abs(f.geometry.coordinates[0] - feature.geometry.coordinates[0]) < 0.5)
    .sort((a, b) =>
      Util.turf.distance(feature.geometry.coordinates, a.geometry.coordinates)
      - Util.turf.distance(feature.geometry.coordinates, b.geometry.coordinates))[0];

    feature.properties.adopted_feature_id = closest_feature.id;
    const is_gbrmpa = feature.properties.gbrmpa;
    feature.properties = Object.assign({}, closest_feature.properties, feature.properties);
    if (!is_gbrmpa) delete feature.properties.gbrmpa;
  });

  /***
   * MAP features to the closest available reef data
   ***/
  props.data.features.forEach((feature) => {
    const gbr2020 = data.gbr2020
    .filter(feature2020 =>
      Math.abs(feature2020.LAT - feature.geometry.coordinates[1]) < 0.5
      && Math.abs(feature2020.LON - feature.geometry.coordinates[0]) < 0.5)
    .sort((a, b) =>
      Util.turf.distance(feature.geometry.coordinates, [a.LON, a.LAT])
      - Util.turf.distance(feature.geometry.coordinates, [b.LON, b.LAT]))[0];

    Object.assign(feature.properties, gbr2020);
    delete feature.properties.LAT;
    delete feature.properties.LON;
  });

  props.data.features.forEach((feature) => {
    if (!data.grc2020.find(grcID => grcID === feature.id)) return;
    feature.properties.survey = ['grc2020'].concat(feature.survey || []);    
  });

  /* DOWNLOAD UPDATED FEATURES WITH A CLICK */
  // window.addEventListener('click', () => {
  //   let dl = JSON.stringify(props.data.features, null, 2);

  //   const anchor = document.createElement('a')
  //   anchor.download = 'features-download.json';
  //   anchor.href = URL.createObjectURL(new Blob([dl]));
  //   anchor.click()
  // })

  Map.init();
  Controls.init().then(() => {
    $el.search.dispatchEvent(new Event('input'));
  });
});
