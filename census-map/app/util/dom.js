export const $el = {
  search: document.querySelector('.search-input'),
  searchResults: document.querySelector('.search-results'),
  nav: document.querySelector('.nav'),
  filters: [ ...document.querySelectorAll('.filter-item') ],
  itineraries: document.querySelector('.filter-itineraries'),
  itinerariesInput: document.querySelector('#toggle-itineraries'),
  itinerariesLabel: document.querySelector('.filter-itineraries--label'),
  controlsToggle: document.querySelectorAll('input[name="filter-section-toggle"]'),
  ranges: [ ...document.querySelectorAll('.filter-range') ],
  colours: document.querySelector('.filter-colours'),
  coloursReset: document.querySelector('.reset-colours'),
  depth: document.querySelector('.meta-depth'),
};

export const domData = {
  filters: () => {
    return $el.filters.reduce((_, filter) => {
      if (filter.checked) {
        _[filter.dataset.type] = [].concat(_[filter.dataset.type] || []).concat({
          title: filter.dataset.title,
          type: filter.dataset.type,
          key: filter.dataset.key,
          value: filter.dataset.value ? filter.dataset.value.split('|') : null,
          colour: (filter.dataset.colour || '').slice(1).split(''),
        });
      }
      return _;
    }, {});
  },

  ranges: () => {
    return $el.ranges.reduce((_, range) => {
      const value = range.noUiSlider.get().map(v => isNaN(v) ? +v.replace('%', '') : +v);
      const changed = range.dataset.min != value[0] || range.dataset.max != value[1];
      if (changed) {
        _[range.dataset.type] = {
          title: range.dataset.title,
          type: range.dataset.type,
          value,
        };
      }
      return _;
    }, {});
  },
};

export default { $el, data: domData };