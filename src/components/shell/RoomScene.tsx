import Image from "next/image";

type Room = "home" | "today" | "library";

/**
 * A room's painting behind the shell (globals.css → Home: the room, Today: the
 * garden, Library: the reading room). An image in the page rather than a CSS
 * background, so the browser starts it with the HTML (and a preload in the
 * head) instead of after the stylesheet, which was ~0.4s later on a first
 * visit. Until it arrives the room's own colour shows, and it fades in over
 * it; a painting already in the browser shows at once (`SCENE_FADE_SCRIPT`).
 */
export function RoomScene({ room }: { room: Room }) {
  return (
    <div className={`${room}-scene`} aria-hidden>
      {/* The fade script sets data-shown / data-instant before React hydrates; the DOM wins. */}
      <Image src={`/${room}-room.webp`} alt="" fill preload unoptimized sizes="100vw" className="scene-painting" suppressHydrationWarning />
      {/* Home's stove: its firelight flickers over the painting (globals.css → Home: the fire). */}
      {room === "home" && (
        <div className="scene-fire">
          <div className="scene-fire-light">
            <span className="scene-fire-spill" />
            <span className="scene-fire-glow" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Inlined at the top of <body> (layout.tsx), so it runs while the HTML is still
 * being read. Every `img.scene-painting` that appears — in the first HTML or
 * after a client navigation — is marked shown: at once (`data-instant`, no
 * fade) if the painting is already loaded, otherwise when it finishes loading
 * (or fails, so the room's colour never hides the page). The CSS shows it
 * anyway after 3s should this never run.
 */
export const SCENE_FADE_SCRIPT = `(function(){
function show(img,instant){if(instant)img.setAttribute("data-instant","");img.setAttribute("data-shown","")}
function watch(img){if(img.hasAttribute("data-shown")||img.__scene)return;img.__scene=1;
if(img.complete&&img.naturalWidth)return show(img,true);
var done=function(){show(img,false)};img.addEventListener("load",done,{once:true});img.addEventListener("error",done,{once:true})}
function scan(n){if(n.nodeType!==1)return;if(n.matches("img.scene-painting"))watch(n);else n.querySelectorAll("img.scene-painting").forEach(watch)}
new MutationObserver(function(rs){rs.forEach(function(r){r.addedNodes.forEach(scan)})}).observe(document.documentElement,{childList:true,subtree:true});
})();`;
