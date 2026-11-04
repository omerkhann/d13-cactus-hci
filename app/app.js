/* Route Status Page: shared logic for every screen.
   Built: saved route, trip list from data.json, statuses, update age, offline storage (sw.js).
   Simulated (Wizard-of-Oz): vendor updates live in this browser's storage (vendor.html), no SMS is sent. */
var KEY = { route:"rsp.route", vendor:"rsp.vendor", clock:"rsp.clock", sms:"rsp.sms", simOffline:"rsp.simOffline" };
var LABEL = { always:"Always runs", daily:"Runs daily", announced:"Announced", pending:"Not yet announced", notrunning:"Not running", changed:"Changed" };

function get(k){ try{ var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; }catch(e){ return null; } }
function set(k,v){ try{ if(v===null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function q(n){ return new URLSearchParams(location.search).get(n); }
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }

/* Prototype clock: by default the page runs at 2:08 PM so the storyboard scenario (2:30 return) can be shown any time of day. */
var memClock = null;
function setDemoClock(){ var t=new Date(); t.setHours(14,8,0,0); memClock={mode:"demo",offset:t.getTime()-Date.now()}; set(KEY.clock, memClock); }
function now(){ var c = get(KEY.clock) || memClock; if(!c){ setDemoClock(); c = memClock; } return c.mode==="real" ? new Date() : new Date(Date.now()+c.offset); }
function dayKey(d){ return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }
function fmt24(hm){ var p=hm.split(":"), h=+p[0], m=p[1]; return ((h%12)||12)+":"+m+" "+(h<12?"AM":"PM"); }
function fmtClock(d){ return fmt24(d.getHours()+":"+String(d.getMinutes()).padStart(2,"0")); }
function mins(hm){ var p=hm.split(":"); return (+p[0])*60+(+p[1]); }
function ago(ts){ var m=Math.round((now().getTime()-ts)/60000); if(m<1) return "just now"; if(m<60) return m+" min ago"; var h=Math.floor(m/60); return h+" h "+(m%60)+" min ago"; }
function dayLabel(d){ return d.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"}); }

function isOffline(){ return !navigator.onLine || !!get(KEY.simOffline); }
function loadData(){ return fetch("data.json").then(function(r){ if(!r.ok) throw new Error("load"); return r.json(); }); }

/* Vendor announcements for today. Seeded with sample entries the first time each day. */
function vendorState(data){
  var v = get(KEY.vendor), today = dayKey(now());
  if(!v || v.date!==today){
    v = { date:today, updatedAt: now().getTime() - data.sample.minutesAgo*60000, trips: JSON.parse(JSON.stringify(data.sample.trips)), log: [] };
    set(KEY.vendor, v);
  }
  return v;
}

/* One trip as the student sees it. which = "today" or "tomorrow". */
function view(t, ann){
  var s = ann ? ann.status : (t.kind==="always"?"always":t.kind==="daily"?"daily":"pending");
  var time = (ann && ann.status==="changed" && ann.time) ? ann.time : t.time;
  return { id:t.id, kind:t.kind, dir:t.dir, pickup:t.pickup, status:s, label:LABEL[s],
    time:time, was:(time!==t.time ? t.time : null),
    bus:(ann && ann.bus) || t.bus || "", was_bus:(ann && ann.status==="changed" && ann.prevBus) || null,
    note:(ann && ann.note) || "" };
}
function trips(data, route, which, v){
  var r = data.routes[route]; if(!r) return [];
  return r.trips.map(function(t){ return view(t, which==="today" ? v.trips[t.id] : null); })
    .sort(function(a,b){ return mins(a.time)-mins(b.time); });
}
function nextTrip(list){
  var n = now(), m = n.getHours()*60+n.getMinutes();
  for(var i=0;i<list.length;i++){ if(list[i].status!=="notrunning" && mins(list[i].time)>=m) return list[i]; }
  return null;
}
function facts(t){ return [t.dir, t.bus ? t.bus+(t.was_bus?" (was "+t.was_bus+")":"") : "Bus not assigned yet", (t.dir==="To campus"?"Pickup: ":"Departs: ")+t.pickup].join(" · "); }
function tripRow(t, next){
  return '<li><a class="trip'+(next?' is-next':'')+(t.status==="notrunning"?' off':'')+'" href="trip.html?id='+t.id+'">'
    + '<span class="time">'+fmt24(t.time)+(t.was?'<span class="was">was '+fmt24(t.was)+'</span>':'')+'</span>'
    + '<span><span class="st st-'+t.status+'">'+esc(t.label)+'</span>'+(next?' <strong>Next</strong>':'')+'</span>'
    + '<span class="meta">'+esc(t.status==="notrunning" ? t.dir+" · Not running today" : facts(t))+'</span></a></li>';
}
/* Plain-language line for the Updates list and the change alert. */
function updateLine(t){
  var dirWord = t.dir==="To campus" ? "pickup" : "return";
  if(t.status==="changed") return "CHANGED: The "+fmt24(t.was||t.time)+" "+dirWord+" now leaves at "+fmt24(t.time)+(t.bus?" on "+t.bus:"")+".";
  if(t.status==="notrunning") return "The "+fmt24(t.time)+" "+dirWord+" is not running today.";
  if(t.status==="announced") return (t.bus? t.bus+" assigned to the ":"Confirmed: the ")+fmt24(t.time)+" "+dirWord+".";
  return "";
}
if("serviceWorker" in navigator){ navigator.serviceWorker.register("sw.js").catch(function(){}); }
