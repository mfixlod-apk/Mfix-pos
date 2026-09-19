/* MFIX Reports date-range fix.
 * The current renderReports template escapes the two date interpolations, which
 * leaves the literal text "${reportDateFrom}" / "${reportDateTo}" in the DOM.
 * Wrap the existing renderer without changing its reporting calculations.
 */
(function(){
  'use strict';

  function install(){
    if(typeof window.renderReports !== 'function') return false;
    if(window.__mfixReportsDateRangeFixInstalled) return true;

    const original=window.renderReports;
    window.renderReports=function(){
      const html=original.apply(this,arguments);
      const now=new Date();
      const pad=n=>String(n).padStart(2,'0');
      const today=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate());
      const first=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-01';
      return String(html)
        .replaceAll('${reportDateFrom}', first)
        .replaceAll('${reportDateTo}', today);
    };

    window.__mfixReportsDateRangeFixInstalled=true;
    return true;
  }

  if(!install()){
    let attempts=0;
    const timer=setInterval(function(){
      attempts++;
      if(install() || attempts>=100) clearInterval(timer);
    },50);
  }
})();
