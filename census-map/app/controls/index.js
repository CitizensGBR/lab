import { $el } from '../util/dom.js';
import { props, hash } from '../util/state.js';
import filters from './filter/index.js';
import itinerary from './itinerary/index.js';
import search from './search/index.js';
import map from '../map/index.js';

export const init = () => {
  props.activeControls = {};

  let controlMode;
  /* REMOVE */
  if (location.pathname.indexOf('/v2') >= 0) {
    console.log('AUTO ADMIN: PLEASE REMOVE')
    $el.nav.dataset.control = controlMode = 'admin';
  } else if (hash.props.admin && hash.props.admin.active) {
    $el.nav.dataset.control = controlMode = 'admin';
  } else if (hash.props.controls && hash.props.controls.active) {
    $el.nav.dataset.control = controlMode = 'control';
  } else {
    $el.itinerariesInput.checked = true;
  }

  window.addEventListener('keydown', (e) => {
    if (e.keyCode === 67 && e.ctrlKey && e.shiftKey) {
      controlMode = (!controlMode && 'control')
      || (controlMode == 'control' && 'admin')
      || null;

      if (controlMode) {
        $el.nav.dataset.control = controlMode;
        $el.highlightInput.checked = true;
      } else {
        delete $el.nav.dataset.control;
        $el.itinerariesInput.checked = true;
      }
      hash.set('admin', controlMode === 'admin');
      hash.set('controls', controlMode === 'control');
    }
  });

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