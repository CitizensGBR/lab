import * as tokml from 'https://unpkg.com/geojson-to-kml@0.0.1/src/tokml.js';

const style = `<Style>
  <LineStyle>
    <color>FF0000CC</color>
    <width>2</width>
  </LineStyle>
  <PolyStyle>
    <fill>0</fill>
    <outline>1</outline>
  </PolyStyle>
</Style>`.replace(/\s/g, '');

export const toKML = (geojson, documentName, documentDescription) =>
`<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    ${tokml.root(geojson, { documentName, documentDescription }).replace(/(<placemark>)/ig, `$1${style}`)}
  </Document>
</kml>`;

export default { fromGeoJSON: toKML };
