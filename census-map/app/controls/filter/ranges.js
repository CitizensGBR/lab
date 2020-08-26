import 'https://cdnjs.cloudflare.com/ajax/libs/noUiSlider/14.6.0/nouislider.min.js';
import { $el } from '../../util/dom.js';
import { debounce } from '../../util/wait.js';
import { props, hash } from '../../util/state.js';
import filterKey from './key.js';
import Reefs from '../../map/features/reefs.js';

export const init = () => {
  $el.ranges.forEach(($range) => {
    const key = $range.dataset.key;
    const format = $range.dataset.format || 'n';
    const min = +$range.dataset.min || 0;
    const max = +$range.dataset.max || 1;
    const start = hash.props[key]
    ? hash.props[key].value
    : $range.dataset.start;
    $range.dataset.min = min;
    $range.dataset.max = format === 'p' ? 100 : max;
    noUiSlider.create($range, {
      start: start ? start.split(',').map(n => +n) : [min, (format === 'p' ? 100 : max)],
      connect: true,
      tooltips: true,
      format: (() => {
        if (format === 'i') return { to: n => Math.round(n), from: n => +n };
        if (format === 'p') return { to: n => `${Math.round(n * 100)}%`, from: n => +n / 100 };
      })() || null,
      step: +$range.dataset.step || null,
      range: { min, max },
    });

    $range.noUiSlider.on('change', () => {
      const values = $range.noUiSlider.get().map(v => isNaN(v) ? +v.replace('%', '') : +v);
      if ($range.dataset.min != values[0] || $range.dataset.max != values[1]) {
        hash.set(key, values);
      } else {
        hash.set(key, null);
      }
      filterKey.update();
    });
    const outputs = $range.previousElementSibling.querySelectorAll('output');
    if (outputs.length) {
      $range.noUiSlider.on('update', (values, handle) => outputs[handle].innerHTML = values[handle]);
    }
  });
};

export default { init };