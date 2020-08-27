/* Adapted from:
 * @Turfjs/distance
 * https://github.com/Turfjs
 * MIT Licensed
 */
const earthRadius = 6371008.8;
const factors = {
    cm: earthRadius * 100,
    deg: earthRadius / 111325,
    ft: earthRadius * 3.28084,
    in: earthRadius * 39.370,
    km: earthRadius / 1000,
    m: earthRadius,
    mi: earthRadius / 1609.344,
    mm: earthRadius * 1000,
    nmi: earthRadius / 1852,
    rad: 1,
    yd: earthRadius / 1.0936,
};

const degreesToRadians = (degrees) => {
    const radians = degrees % 360;
    return radians * Math.PI / 180;
}

const radiansToLength = (radians, units = 'km') => {
    const factor = factors[units];
    return radians * factor;
}

export const distance = (from, to, units = 'km') => {
    const dLat = degreesToRadians((to[1] - from[1]));
    const dLon = degreesToRadians((to[0] - from[0]));
    const lat1 = degreesToRadians(from[1]);
    const lat2 = degreesToRadians(to[1]);

    const a = Math.pow(Math.sin(dLat / 2), 2) +
          Math.pow(Math.sin(dLon / 2), 2) * Math.cos(lat1) * Math.cos(lat2);

    return radiansToLength(2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)), units);
}

export default { distance };