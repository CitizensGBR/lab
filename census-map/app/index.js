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
  });

  Map.init();
  Controls.init().then(() => {
    $el.search.dispatchEvent(new Event('input'));
  });
});
