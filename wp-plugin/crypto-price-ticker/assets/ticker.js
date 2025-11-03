(function(){
  // Vanilla fallback if Interactivity API is unavailable
  if (!window.wp || !window.wp.interactivity) {
    function formatUsd(n){
      try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 8 }).format(n); }
      catch(e){ return '$' + (Math.round(n * 100) / 100); }
    }
    async function refreshForEl(el){
      try{
        const ctxStr = el.getAttribute('data-wp-context') || '{}';
        const ctx = JSON.parse(ctxStr);
        if (!ctx || !ctx.id || !ctx.apiBase) return;
        const url = ctx.apiBase.replace(/\/$/, '') + '/price/' + encodeURIComponent(ctx.id);
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!res.ok) throw new Error('Bad response');
        const data = await res.json();
        const labelEl = el.querySelector('[data-wp-text="state.label"]');
        const priceEl = el.querySelector('[data-wp-text="state.formattedPrice"]');
        if (labelEl) labelEl.textContent = (data.symbol ? data.symbol.toUpperCase() + ' ' : '') + '(' + (ctx.id || 'coin') + ')';
        if (priceEl) priceEl.textContent = formatUsd(data.price);
      }catch(_e){ /* noop */ }
    }
    function initFallback(){
      const els = document.querySelectorAll('[data-wp-interactive="cryptoTicker"]');
      els.forEach((el)=>{
        refreshForEl(el);
        const interval = setInterval(()=>refreshForEl(el), 60*1000);
        el.__cptInterval = interval;
      });
      document.addEventListener('visibilitychange', ()=>{
        // simple optimization: refresh when tab becomes visible
        if (document.visibilityState === 'visible') {
          const els = document.querySelectorAll('[data-wp-interactive="cryptoTicker"]');
          els.forEach((el)=>refreshForEl(el));
        }
      });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initFallback);
    } else {
      initFallback();
    }
    return;
  }
  const { store } = window.wp.interactivity;

  function formatUsd(n){
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 8 }).format(n);
    } catch(e) {
      return '$' + (Math.round(n * 100) / 100);
    }
  }

  store('cryptoTicker', {
    state: {
      price: null,
      symbol: '',
      name: '',
      get label(){
        const ctx = this.context;
        const sym = this.symbol || '';
        return (sym ? sym + ' ' : '') + '(' + (ctx?.id || 'coin') + ')';
      },
      get formattedPrice(){
        return this.price != null ? formatUsd(this.price) : '...';
      }
    },
    actions: {
      async refreshPrice({ context, state }){
        if (!context || !context.id || !context.apiBase) return;
        const url = context.apiBase.replace(/\/$/, '') + '/price/' + encodeURIComponent(context.id);
        try{
          const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
          if(!res.ok) throw new Error('Bad response');
          const data = await res.json();
          state.price = data.price;
          state.symbol = (data.symbol || '').toUpperCase();
          state.name = data.name || '';
        }catch(err){
          // keep old state
        }
      }
    },
    effects: {
      init({ actions }){
        actions.refreshPrice();
        const interval = setInterval(actions.refreshPrice, 60 * 1000);
        return () => clearInterval(interval);
      }
    }
  });
})();


