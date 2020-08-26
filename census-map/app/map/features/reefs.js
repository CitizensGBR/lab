import { mapbox } from '../../config.js';
import filterKey from '../../controls/filter/key.js';

let map;

export const init = (baseMap) => {
  map = baseMap;

  mapbox.layer.reefs = 'gbr-features-reefs';

  const layer = map.getLayer(mapbox.layer.features);

  map.addLayer({
    id: mapbox.layer.reefs,
    type: 'fill-extrusion',
    source: 'composite',
    'source-layer': layer.sourceLayer,
    layout: {},
    paint: {
      'fill-extrusion-color': [
        'case',
        ['any',
          ['==', ['get', 'id'], ['feature-state', 'hover']],
          ['==', ['get', 'id'], ['feature-state', 'selected']],
          ['all', ['==', ['get', 'gid'], ['feature-state', 'filtered']], ['!', ['to-boolean', ['feature-state', 'toggled']]]],
        ],
        ['case',
          ['to-boolean', ['feature-state', 'hover']],
          ['case', 
            ['to-boolean', ['feature-state', 'selected']],
            '#F5F',
            '#FF0',
          ],
          ['case', 
            ['to-boolean', ['feature-state', 'selected']],
            '#F0F',
            ['feature-state', 'colour'],
          ],
        ],
        '#FFF'
      ],
      'fill-extrusion-opacity': 0.5,
      'fill-extrusion-base': 799,
      'fill-extrusion-height': [
        'case',
        ['any',
          ['==', ['get', 'id'], ['feature-state', 'hover']],
          ['==', ['get', 'id'], ['feature-state', 'selected']],
          ['all', ['==', ['get', 'gid'], ['feature-state', 'filtered']], ['!', ['to-boolean', ['feature-state', 'toggled']]]],
        ],
        ['case', ['to-boolean', ['feature-state', 'hover']], 1800, 1200],
        1
      ],
    }
  }, mapbox.layer.labels);
  filterKey.update();
};

export default { init };