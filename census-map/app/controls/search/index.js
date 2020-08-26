import { $el } from '../../util/dom.js';
import { props } from '../../util/state.js';
import { score } from '../../util/search.js';
import { load } from '../../util/template.js';
import map from '../../map/index.js';

const templates = {
  search: 'app/controls/search/template.html',
};

export const init = () => new Promise(resolve =>
  load(templates).then(() => {
    $el.search.addEventListener('input', onSearch);
    $el.searchResults.addEventListener('click', onSearchResult);
    resolve();
  }));

const onSearch = () => {
  if (!props.data.features) return;
  const query = $el.search.value;
  $el.search.dataset.focus = '';
  if (!query) {
    $el.searchResults.innerHTML = '';
    return;
  }

  $el.searchResults.innerHTML = props.data.features.reduce((_, feature) => {
    let searchScore = score(feature.properties.search, query, true);
    if (searchScore === 0) return _;
    return _.concat({ properties: feature.properties, searchScore });
  }, [])
  .sort((a, b) => b.searchScore - a.searchScore || b.search - a.search)
  .reduce((_, feature) =>
    _.concat(templates.search({ item: feature.properties })), '');
};

const onSearchResult = (e) => {
  const $li = e.target.closest('li');
  if (!$li) return;

  const feature = props.data.features[+$li.dataset.index];

  $el.search.value = feature.properties.name || feature.properties.gid;
  delete $el.search.dataset.focus;

  map.easeTo(feature.geometry.coordinates);
};

export default { init };