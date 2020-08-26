import { $el } from '../../util/dom.js';
import { hash } from '../../util/state.js';
import ranges from './ranges.js';
import filterKey from './key.js';

export const init = () => Promise.all([
  filterKey.init(),
  ranges.init(),
]).then(() => {
  $el.filters.forEach(($filter) => {
    const key = ($filter.dataset.key || $filter.dataset.value).toLowerCase();
    if (hash.props[key] && hash.props[key].active) $filter.checked = true;
    $filter.addEventListener('change', () => {
      hash.set(key, $filter.checked);
      filterKey.update();
    })
  });
});

export default { init };
