import { $el } from '../../util/dom.js';
import { props, hash } from '../../util/state.js';
import { load } from '../../util/template.js';
import map from '../../map/index.js';
import filterKey from '../filter/key.js';
import featureItineraries from '../../map/features/itineraries.js';

const templates = {
  itineraries: 'app/controls/itinerary/template/itineraries.html',
  features: 'app/controls/itinerary/template/features.html',
};
const drag = {};
const idMap = {};
const gidMap = {};

export const init = () => new Promise((resolve) => {

  $el.colours.addEventListener('click', (e) => {
    if (e.target.dataset.action === 'itinerary') {
      create(hash.props.selected.value);
      map.deselect();
      map.update(true);
    }
  });

  $el.itineraries.addEventListener('dragstart', (e) => {
    e.dataTransfer.effectAllowed = 'move';
    drag.item = e.target;
    drag.list = e.target.parentElement.parentElement;
    drag.indexOriginal = +e.target.dataset.index;
    drag.order = +e.target.parentElement.style.order;
    e.target.parentElement.classList.add('is-dragging');
    drag.list.addEventListener('dragover', dragOver);
    drag.list.addEventListener('drop', dragDrop);
    drag.list.dataset.drag = '';
  });
  $el.itineraries.addEventListener('dragend', dragEnd);
  $el.itineraries.addEventListener('click', onAction);
  $el.itineraries.addEventListener('input', onAction);
  $el.itinerariesInput.addEventListener('click', () => {
    $el.itineraries.querySelectorAll('[name="itinerary-toggle"]').forEach($i => $i.checked = false);
    delete props.activeItinerary;
    props.activeControls.itineraries = true;
    filterKey.render();
    map.update(true);
  });

  loadFromHash();

  load(templates).then(() => {
    render();
    resolve();
  });
});

const invalidAction = (action, event) => {
  const type = {
    click: ['remove', 'remove-feature'],
    input: ['toggle', 'title', 'date-from', 'date-to'],
  }[event];
  return !type || type.indexOf(action) < 0;
}

const onAction = (e) => {
  const action = e.target.dataset.action;
  if (!action || invalidAction(action, e.type)) return;

  const index = +(e.target.dataset.index || 0);
  if (action === 'toggle') {
    props.activeItinerary = props.itineraries[index];
    const active = props.activeItinerary.features[0];
    if (active) {
      map.fitBounds(map.toBounds(props.activeItinerary.features), { padding: 100 });
    }
    filterKey.render();
    map.update(true);
  } else if (action === 'title') {
    props.itineraries[index].title = e.target.value;
    e.target.parentElement.nextElementSibling.firstElementChild.innerText = props.itineraries[index].title || `Itinerary #${index + 1}`;
    save();
  } else if (action && action.indexOf('date') === 0) {
    const isFrom = action.indexOf('from') > 0;
    if (isFrom) {
      const dateTo = e.target.nextElementSibling;
      try {
        if (dateTo.value && new Date(dateTo.value) < new Date(e.target.value)) {
          dateTo.value = e.target.value;
        }
      } catch (e) {
        dateTo.value = '';
      }
      e.target.nextElementSibling.min = e.target.value;
    } else {
      const dateFrom = e.target.previousElementSibling;
      try {
        if (dateFrom.value && new Date(dateFrom.value) > new Date(e.target.value)) {
          e.target.value = dateFrom.value;
        }
      } catch (e) { /**/ }
    }
    props.itineraries[index].dates[isFrom ? 0 : 1] = e.target.value;
    save();
  } else if (action === 'remove') {
    props.itineraries.splice(index, 1);
    delete props.activeItinerary;
    render();
    filterKey.render();
    map.update(true);
  } else if (action === 'remove-feature') {
    props.activeItinerary.features.splice(index, 1);
    updateItinerary(e.target.parentElement.parentElement);
  }
};

const distanceBetweenPoints = (a, b) =>
  Math.sqrt(Math.pow(a.geometry.coordinates[0] - b.geometry.coordinates[0], 2)
  + Math.pow(a.geometry.coordinates[1] - b.geometry.coordinates[1], 2));

export const create = (gids) => {
  const features = gids.reduce((_, gid) => {
    const list = (gidMap[gid] || []).slice();
    if (list.length > 1 && _.length) {
      list.sort((a, b) =>
        distanceBetweenPoints(a, _.slice(-1)[0])
        - distanceBetweenPoints(b, _.slice(-1)[0]));
    }
    return _.concat(list);
  }, []);

  if (props.activeItinerary) {
    Array.prototype.push.apply(props.activeItinerary.features, features);
    map.update(true);
    const $list = $el.itineraries.querySelector(`[name="itinerary-toggle"][data-index="${props.activeItinerary.index}"] ~ .filter-itinerary--item > ol`)
    updateItinerary($list);
  } else {
    props.itineraries.push({
      title: '',
      features,
      dates: [],
      index: props.itineraries.length,
    });
    setTimeout(() => {
      const $itinerary = $el.itineraries.querySelector('[name="itinerary-toggle"]:last-of-type');
      const $container = $el.itineraries.previousElementSibling;
      if (!$container.checked) $container.click();
      if ($itinerary) $itinerary.checked = true;
      map.update(true);
    });
    render();
  }
};

const loadFromHash = () => {
  let itineraries;
  if (hash.props.itinerary) {
    try {
      itineraries = hash.props.itinerary.value.split(':').map(serial => serial.split(';'));
    } catch (e) { /**/ }
  }
  if (!Array.isArray(itineraries)) {
    itineraries = [];
  }

  props.data.features.forEach((feature) => {
    idMap[feature.id] = feature;
    if (!gidMap[feature.properties.gid]) gidMap[feature.properties.gid] = [];
    gidMap[feature.properties.gid].push(feature);
  });
  props.itineraries = itineraries.map((itinerary, index) => ({
    title: decodeURIComponent(itinerary[0]),
    features: (itinerary[1] || '').split(',').reduce((__, id) => __.concat(idMap[id] || []), []),
    dates: itinerary[2] ? itinerary[2].split(',') : [],
    index,
  }));
};

const saveToHash = () => {
  // serialised in form: title a;id,id,id;from,to:title b;id,id:title c
  const serialised = props.itineraries.map(itinerary =>
    [itinerary.title.replace(/[;:|#]/g, c => encodeURIComponent(c))]
    .concat(
      itinerary.features.map(feature => feature.id).toString() || [],
      itinerary.dates.toString() || [],
    ).join(';'))
  .join(':');
  hash.set('itinerary', serialised);
}

const save = () => {
  saveToHash();
};

const updateItinerary = ($list) => {
  $list.innerHTML = templates.features({ features: props.activeItinerary.features });
  $list.nextElementSibling.dataset.count = props.activeItinerary.features.length;
  save();
  map.update();
}

const render = () => {
  $el.itineraries.innerHTML = templates.itineraries({ itineraries: props.itineraries });
  $el.itinerariesLabel.dataset.total = props.itineraries.length;
  save();
};

const dragEnd = () => {
  if (!drag.item) return;
  drag.item.parentElement.classList.remove('is-dragging');
  drag.list.removeEventListener('dragover', dragOver);
  drag.list.removeEventListener('drop', dragDrop);
  if (drag.hasOwnProperty('insertIndex')) {
    const itinerary = props.itineraries[+drag.list.dataset.index];
    const item = itinerary.features.splice(+drag.item.dataset.index, 1)[0];
    itinerary.features.splice(drag.insertIndex, 0, item);
    updateItinerary(drag.list);
  }
  delete drag.order;
  delete drag.insertIndex;
  delete drag.list.dataset.drag;
  delete drag.item;
  delete drag.list;
};

const dragOver = (e) => {
  e.preventDefault();
  e.stopPropagation();
  const index = +e.target.dataset.index;
  if (drag.indexOriginal === index) {
    delete drag.index;
    return;
  } else if (drag.index === index) return;
  drag.index = index;
  const order = +e.target.style.order;

  const orderOffset = order > drag.order ? 1 : -1;
  drag.order = drag.item.parentElement.style.order = order + orderOffset;
  const indexOffset = index <= drag.indexOriginal || order <= drag.order
  ? (drag.indexOriginal > index && drag.order > order && 1) || 0
  : -1;
  drag.insertIndex = index + indexOffset;
};

const dragDrop = (e) => {
  e.preventDefault();
  e.stopPropagation();
  dragEnd();
};


export default { init, create };