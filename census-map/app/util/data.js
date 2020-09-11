import 'https://unpkg.com/geobuf@3.0.1/dist/geobuf.js';
import 'https://unpkg.com/pbf@3.0.5/dist/pbf.js';

// simple csv parser
const parseCSV = csv =>
  csv.split('\r\n').reduce((_, row, i) =>
    row.split(',').reduce((__, cell, ii) => {
      if (!i) __.cols.push(cell);
      else {
        if (__.list.length < i) __.list.push({});
        __.list[i - 1][__.cols[ii]] = isNaN(cell) ? cell : +cell;
      }
      return __
    }, _), { cols: [], list: [] }).list;

export const load = (sources) => {
  const isString = typeof sources === 'string';
  const list = isString || Array.isArray(sources)
  ? [].concat(sources)
  : Object.assign({}, sources);

  return Promise.all(Object.keys(list).map(key => fetch(list[key])
  .then((e) => {
    const ext = list[key].replace(/^.*\.([^.]+)$/, '$1');
    if (ext === 'pbf') {
      return e.arrayBuffer().then(b =>
        geobuf.decode(new Pbf(b)).features);
    }
    if (ext === 'json') return e.json();
    return e.text().then((txt) => {
      if (ext === 'csv') return parseCSV(txt);
      return txt;
    });
  })
  .then(data => list[key] = data)))
  .then(() => isString ? list[0] : list);
};

export default { load }
