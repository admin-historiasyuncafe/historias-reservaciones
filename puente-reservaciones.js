/**
 * puente-reservaciones.js
 * Imita google.script.run para que el index.html original funcione
 * fuera de Apps Script (GitHub Pages) sin cambiar su código.
 *
 * Pega abajo la URL de tu implementación (termina en /exec).
 * Debe ser la forma https://script.google.com/macros/s/.../exec
 * (sin /a/macros/historiasyuncafe.com/ y sin ?authuser=0).
 */
(function () {
  'use strict';

  var API_URL = 'https://script.google.com/macros/s/AKfycbznKOW_UkK0ep83ol_2fDqXmKv_F2sDBdKFLvKV9xKgqnJW46w8ohnLgrM1ENYfZVQc/exec';

  function call(fn, args) {
    if (API_URL.indexOf('https://script.google.com/macros/s/') !== 0) {
      return Promise.reject(new Error('Falta configurar la URL en puente-reservaciones.js'));
    }
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, 30000) : null;
    return fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn: fn, args: args }),
      credentials: 'omit',
      redirect: 'follow',
      signal: ctl ? ctl.signal : undefined
    }).then(function (r) {
      return r.json();
    }).then(function (d) {
      if (timer) clearTimeout(timer);
      if (d && d.ok) return d.data;
      throw new Error((d && d.error) || 'Error del servidor.');
    }).catch(function (e) {
      if (timer) clearTimeout(timer);
      if (e && e.name === 'AbortError') throw new Error('Tardó demasiado. Intenta de nuevo.');
      if (e instanceof SyntaxError || (e && e.name === 'TypeError')) {
        throw new Error('No se pudo conectar con el servidor.');
      }
      throw e;
    });
  }

  function runner(ok, fail) {
    return new Proxy({}, {
      get: function (_, prop) {
        if (prop === 'withSuccessHandler') return function (f) { return runner(f, fail); };
        if (prop === 'withFailureHandler') return function (f) { return runner(ok, f); };
        if (typeof prop !== 'string') return undefined;
        return function () {
          var args = Array.prototype.slice.call(arguments);
          call(prop, args).then(function (data) { if (ok) ok(data); },
                                function (err) { if (fail) fail(err); });
        };
      }
    });
  }

  window.google = { script: { run: runner(null, null) } };
})();