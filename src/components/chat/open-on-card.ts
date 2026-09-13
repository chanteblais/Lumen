/**
 * Inlined at the top of <body> (layout.tsx), beside the scene fade script, so
 * it runs while the HTML is still being read. The chat opens on the greeting
 * card with the earlier conversation one scroll up (MessageList), but its own
 * scroll only runs once React has hydrated — up to a second on Home — and
 * until then the page painted from the top: the old chat showed, then slid
 * away. This scrolls to the card (`[data-opens-here]`) as soon as it is in the
 * document, before the first paint, and again on a client navigation (React's
 * commit lands before paint too). MessageList's effect still runs after it.
 */
export const OPEN_ON_CARD_SCRIPT = `(function(){
function place(n){if(n.nodeType!==1)return;var el=n.matches("[data-opens-here]")?n:n.querySelector("[data-opens-here]");if(el)el.scrollIntoView({block:"start",behavior:"auto"})}
new MutationObserver(function(rs){rs.forEach(function(r){r.addedNodes.forEach(place)})}).observe(document.documentElement,{childList:true,subtree:true});
})();`;
