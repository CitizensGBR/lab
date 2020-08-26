import { debounce } from './wait.js';
import { $el } from './dom.js';

const storage = {
  hash: {
    data: {},
    load() {
      storage.hash.loaded = true;
      storage.hash.data = location.hash
      ? location.hash.slice(1)
      .split('|').reduce((_, param) => {
        const split = param.split(/:(.+)/, 2);
        const key = split[0].replace(/^!?_?/, '');
        const value = split[1];
        if (key) {
          _[key] = {
            value,
            active: /^!?[^_]/.test(param),
            toggle: param.charAt(0) === '!',
          };
        }
        return _;
      }, {})
      : {};
    },
    persist(data) {
      if (!storage.hash.loaded) storage.hash.load();
      Object.keys(data).forEach((key) => {
        // delete key if null value
        if (data[key] === null) {
          delete storage.hash.data[key];
          return;
        }
        // create a key if doesn't exist
        if (!storage.hash.data[key]) storage.hash.data[key] = {};
        // set active state on boolean
        if (typeof data[key] === 'boolean') storage.hash.data[key].active = data[key];
        // set toggle / active / value via object
        else if (typeof data[key] === 'object'
          && (data[key].hasOwnProperty('value') || data[key].hasOwnProperty('toggle') || data[key].hasOwnProperty('active'))) {
          Object.assign(storage.hash.data[key], data[key]);
        // else set value
        } else storage.hash.data[key].value = data[key];
        // delete if inactive and valueless
        if (!storage.hash.data[key].active && !storage.hash.data[key].value && !storage.hash.data[key].toggle) {
          delete storage.hash.data[key];
        }
      });
      storage.hash.store();
    },
    store: debounce(() => {
      const hashStr = Object.keys(storage.hash.data).map((key) => {
        const item = storage.hash.data[key];
        const value = item.value && item.value.toString().replace(/[#|]/g, '');
        return `${item.toggle ? '!' : ''}${item.active ? '' : '_'}${key}${ value ? `:${value}` : ''}`;
      });

      history.replaceState(null, '', location.pathname + (hashStr.length ? '#' + hashStr.join('|') : ''));
    }),
    clear() {
      history.replaceState(null, '', location.pathname);
    },
  },
  local: {
    data: {},
    load() {
      storage.local.loaded = true;
      try {
        storage.local.data = localStorage.state && JSON.parse(localStorage.state);
      } catch(e) {}
    },
    persist(data) {
      if (!storage.local.loaded) storage.local.load();
      Object.keys(data).forEach((key) => {
        if (data[key] === null) delete storage.local.data[key];
        else storage.local.data[key] = data[key];
      });
      try {
        localStorage.state = storage.local.data;
      } catch(e) {}
    },
  },
  temp: {
    data: {},
    persist(data) {
      Object.keys(data).forEach((key) => {
        if (data[key] === null) delete storage.temp.data[key];
        else storage.temp.data[key] = data[key];
      });
    },
  },
};

export const props = storage.temp.data;
export const hash = {
  get props() {
    return getState(false, 'hash');
  },
  clear: storage.hash.clear,
  set(key, value) {
    return setState(key, value, 'hash');
  },
};
export const local = {
  get props() {
    return getState(false, 'local');
  },
  set(key, value) {
    return setState(key, value, 'local');
  },
};

export const getState = (key, state = 'temp') => {
  if (storage[state].load && !storage[state].loaded) storage[state].load();
  const data = key ? storage[state].data[key] : storage[state].data;
  return key && data && state === 'hash' ? data.value : data;
};

export const setState = (key, value, state = 'temp') => {
  const keyMap = typeof key === 'object' ? key : { [key]: value };
  const stateType = typeof key === 'object' && storage[value] ? value : state;
  storage[stateType].persist(keyMap);
};

export default {
  get props() {
    return storage.temp.data;
  },
  get: getState,
  set: setState,
  hash,
  local,
};