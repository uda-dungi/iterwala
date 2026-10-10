// CSP-safe replacement for the inline onload="this.media='all'" trick on the font stylesheet.
document.querySelectorAll('link[data-async-css]').forEach(function (l) {
  if (l.sheet) l.media = 'all';
  else l.addEventListener('load', function () { l.media = 'all'; });
});
