export const debounce = (fn, delay = 100) => {
  let debounced;
  return (...args) => {
    clearTimeout(debounced);
    debounced = setTimeout(() => fn(...args), delay);
  };
};

export const throttle = (fn, delay = 500) => {
  let throttled;
  let tailArgs;

  return (...args) => {
    if (throttled) {
      tailArgs = args;
      return;
    }

    throttled = true;
    fn(...args);
    setTimeout(() => {
      throttled = null;
      if (tailArgs) {
        fn(...tailArgs);
        tailArgs = null;
      }
    }, delay);
  };
};

export default { debounce, throttle };