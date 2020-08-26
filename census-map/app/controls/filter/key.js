import { $el, domData } from '../../util/dom.js';
import { throttle, debounce } from '../../util/wait.js';
import { props, hash } from '../../util/state.js';
import { load } from '../../util/template.js';
import ranges from './ranges.js';
import itineraries from '../itinerary/index.js';
import map from '../../map/index.js';

const templates = {
  selected: 'app/controls/filter/template/key.html',
}

export const init = () => new Promise((resolve) => {
  $el.colours.addEventListener('input', throttle(onInput, 100));
  $el.coloursReset.addEventListener('click', (e) => {
    Object.keys(props.colours || {}).forEach((key) => {
      delete props.colours[key];
      hash.set(key, '');
    });
    delete e.target.parentElement.parentElement.dataset.colourised;
    update();
  });
  load(templates).then(resolve);
});

const onInput = (e) => {
  const key = e.target.dataset.key;
  if (key === 'selected') {
    map.deselect();
  } else if (e.target.type === 'color') {
    const colour = e.target.value;
    e.target.parentElement.style.background = colour;
    e.target.parentElement.parentElement.parentElement.dataset.colourised = '';
    if (!props.colours) props.colours = {};
    props.colours[key] = colour;
    hash.set(key, colour.replace(/#/, ''));
    props.filtered.filter[key].colour = props.filtered.filter[key].colourFull = colour;
  } else {
    const toggle = !e.target.checked;
    hash.set(key, { toggle });
    if (toggle) {
      e.target.parentElement.parentElement.dataset.toggled = '';
    } else {
      delete e.target.parentElement.parentElement.dataset.toggled;
    }
  }
  map.render();  
};

export const update = () => {
  const filters = domData.filters();
  const filterKeys = Object.keys(filters);
  const ranges = domData.ranges();
  const rangesKeys = Object.keys(ranges);
  const filtered = props.filtered = { gid: {}, filter: {}, keys: [] };
  props.data.features.forEach((feature, i) => {

    const item = feature.properties;
    if (!item.gbrmpa && !item.keysourcereef && !item.priorityreef) return;

    const isInvalid = rangesKeys.find((type) => {
      return feature.properties.hasOwnProperty(type) && (feature.properties[type] < ranges[type].value[0]
      || feature.properties[type] > ranges[type].value[1]);
    });

    const matches = [];
    if (!isInvalid) {
      if (!filterKeys.length && rangesKeys.length) {
        matches.push({
          colour: ['A', 'A', '0'],
          title: 'Reef importance analysis',
          key: undefined,
          type: 'importance',
          value: ['importance'],
        });
      }
      if (filters.status && item.status) {
        filters.status.forEach(status =>
          item.status.toLowerCase().indexOf(status.value) >= 0 && matches.push(status));
      }
      if (filters.survey) {
        filters.survey.forEach(survey =>
          (survey.value
            ? item.survey && survey.value.find(v => item.survey.find(s => s.indexOf(v) === 0))
            : !item.survey) && matches.push(survey));
      }
      if (filters.attr) {
        filters.attr.forEach(attr =>
          item[attr.value] && matches.push(attr));
      }
    }

    if (matches.length) {
      const key = matches.reduce((_, m) => _ + (m.key || m.value), '').toLowerCase();
      if (!filtered.filter[key] ) {
        const label = matches.reduce((_, m, i) => {
          const l = m.key || [].concat(m.value).join('').toUpperCase();
          if(_.type !== m.type) {
            _.type = m.type;
            _.list.push(`<abbr title="${m.title}">${l}</abbr>`);
          } else {
            _.list[_.list.length - 1] += `<abbr title="${m.title}">${l}</abbr>`;
          }
          return _;
        }, { list: [] }).list.join(' / ');

        const stored = hash.props[key] || {};
        const colour = stored.value
        ? stored.value.replace(/^#?/, '#')
        : matches.reduce((_, m) =>
            m.colour.map((c, i) => _[i] + parseInt(c, 16)), [0, 0, 0])
          .reduce((_, c) => _ + (c % 16).toString(16), '#')
        filtered.filter[key] = {
          key,
          label,
          list: [],
          toggle: stored.toggle,
          colour,
          colourFull: colour.length > 4 ? colour : colour.replace(/([a-f0-9])/gi, '$1$1'),
        };
        filtered.keys.push(key);
      }
      filtered.active = true;
      filtered.gid[item.gid] = feature;
      filtered.filter[key].list.push(feature);
      feature.filter = filtered.filter[key];
    } else {
      filtered.reset = true;
    }
  });

  render();
  map.render();
};

export const render = () => {
  const selected = hash.props.selected && hash.props.selected.value.length && hash.props.selected.value;

  if (selected || (props.filtered && props.filtered.active)) {
    $el.colours.parentElement.dataset.filtered = '';
    $el.nav.dataset.filtered = '';
  } else {
    delete $el.colours.parentElement.dataset.filtered; 
    delete $el.nav.dataset.filtered;
  }

  $el.colours.innerHTML = templates.selected({
    filtered: props.filtered,
    itinerary: props.activeControls.itineraries && props.activeItinerary,
    selected,
  });
}

export default { init, update, render };