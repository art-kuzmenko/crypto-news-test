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
      get label(){
        const ctx = this.context;
        const symbol = this.symbol || '';
        return (symbol ? symbol + ' ' : '') + '(' + (ctx?.id || 'coin') + ')';
      },
      get formattedPrice(){
        return this.price != null ? formatUsd(this.price) : '...';
      }
    },
    actions: {
      async refreshPrice(){
        const ctx = this.context;
        if (!ctx || !ctx.id || !ctx.apiBase) return;
        const url = ctx.apiBase.replace(/\/$/, '') + '/price/' + encodeURIComponent(ctx.id);
        try{
          const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
          if(!res.ok) throw new Error('Bad response');
          const data = await res.json();
          this.price = data.price;
          this.symbol = data.symbol;
          this.name = data.name;
        }catch(err){
          // keep old price
        }
      }
    },
    effects: {
      init(){
        // Initial fetch and poll every minute
        this.actions.refreshPrice();
        const interval = setInterval(() => this.actions.refreshPrice(), 60 * 1000);
        return () => clearInterval(interval);
      }
    }
  });
})();


