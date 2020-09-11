import { $el } from '../util/dom.js';
import { props, hash } from '../util/state.js';
import filters from './filter/index.js';
import itinerary from './itinerary/index.js';
import search from './search/index.js';
import map from '../map/index.js';

export const init = () => {
  props.activeControls = {};

  if (hash.props.admin && hash.props.admin.active) {
    $el.nav.dataset.control = 'admin';
  } else if (hash.props.controls && hash.props.controls.active) {
    $el.nav.dataset.control = '';
  } else {
    $el.itinerariesInput.checked = true;
  }

  return Promise.all([filters, search, itinerary].map(fn => fn.init()))
  .then(() => {
    $el.controlsToggle.forEach(($input) => {
      $input.addEventListener('change', () => {
        $el.controlsToggle.forEach($i =>
          props.activeControls[$i.value] = $i.checked);
        map.update(true);
      });
      if ($input.checked) $input.dispatchEvent(new Event('change'));
    });
  });
};

export default { init };