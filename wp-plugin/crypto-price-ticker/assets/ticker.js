(function(){
  if (!window.wp || !window.wp.interactivity) return;
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


