// Sample data for the wireframes. Bus numbers and pickup points are placeholders.
var NOW = "2:08 PM";
var DATA = {
  A: { name: "Route A", today: [
      { id:"a0700", time:"7:00 AM", dir:"To campus", status:"Always runs", bus:"Bus 12", pick:"Pickup: Stop A1" },
      { id:"a0900", time:"9:00 AM", dir:"To campus", status:"Announced", bus:"Bus 7", pick:"Pickup: Stop A2" },
      { id:"a1030", time:"10:30 AM", dir:"To campus", status:"Announced", bus:"Bus 7", pick:"Pickup: Stop A2" },
      { id:"a1330", time:"1:30 PM", dir:"From campus", status:"Not running", bus:"", pick:"" },
      { id:"a1430", time:"2:30 PM", dir:"From campus", status:"Announced", bus:"Bus 11", pick:"Departs: Gate 4 stand", next:true, note:"Bus 11 assigned to the 2:30 return. Leaves from the Gate 4 stand." },
      { id:"a1600", time:"4:00 PM", dir:"From campus", status:"Not yet announced", bus:"", pick:"Departs: Gate 4 stand" },
      { id:"a1730", time:"5:30 PM", dir:"From campus", status:"Runs daily", bus:"Bus 12", pick:"Departs: Gate 4 stand" } ],
    tomorrow: [
      { id:"t0700", time:"7:00 AM", dir:"To campus", status:"Always runs", bus:"Bus 12", pick:"Pickup: Stop A1" },
      { id:"t0900", time:"9:00 AM", dir:"To campus", status:"Not yet announced", bus:"", pick:"Pickup: Stop A2" },
      { id:"t1430", time:"2:30 PM", dir:"From campus", status:"Not yet announced", bus:"", pick:"Departs: Gate 4 stand" },
      { id:"t1730", time:"5:30 PM", dir:"From campus", status:"Runs daily", bus:"Bus 12", pick:"Departs: Gate 4 stand" } ] },
  B: { name: "Route B", today: [
      { id:"b0700", time:"7:00 AM", dir:"To campus", status:"Always runs", bus:"Bus 3", pick:"Pickup: Stop B1" },
      { id:"b1430", time:"2:30 PM", dir:"From campus", status:"Not yet announced", bus:"", pick:"Departs: Gate 4 stand", next:true },
      { id:"b1730", time:"5:30 PM", dir:"From campus", status:"Runs daily", bus:"Bus 3", pick:"Departs: Gate 4 stand" } ],
    tomorrow: [
      { id:"u0700", time:"7:00 AM", dir:"To campus", status:"Always runs", bus:"Bus 3", pick:"Pickup: Stop B1" },
      { id:"u1730", time:"5:30 PM", dir:"From campus", status:"Runs daily", bus:"Bus 3", pick:"Departs: Gate 4 stand" } ] }
};
function q(name){ return new URLSearchParams(location.search).get(name); }
function routeKey(){ var r=q("route"); if(r && DATA[r]) return r; try{ var s=localStorage.getItem("route"); if(s && DATA[s]) return s; }catch(e){} return "A"; }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }
function tripItem(t, r, opts){
  opts = opts || {};
  var cls = t.status==="Changed" ? "t-status st-changed" : (t.status==="Not running" ? "t-status st-off" : "t-status");
  var meta = [t.dir, t.bus, t.pick].filter(Boolean).join(" · ");
  var href = "w3.html?route="+r+"&trip="+t.id+(opts.changed?"&changed=1":"");
  return '<li'+(t.next?' class="next"':'')+'><a class="trip" href="'+href+'">'
    + '<span class="t-time">'+esc(t.time)+'</span>'
    + (t.next?'<span class="t-next">Next trip</span>':'')
    + '<span class="'+cls+'">'+esc(t.status)+'</span>'
    + '<span class="t-meta">'+esc(meta)+'</span></a></li>';
}
function renderList(el, trips, r, opts){ el.innerHTML = trips.map(function(t){ return tripItem(t, r, opts); }).join(""); }
function changedTrips(r){
  return DATA[r].today.map(function(t){
    if(t.id!=="a1430") return t;
    return { id:t.id, time:"2:20 PM (was 2:30)", dir:t.dir, status:"Changed", bus:"Bus 14 (was Bus 11)", pick:t.pick, next:true,
      note:"The 2:30 return now leaves at 2:20 on Bus 14, from the Gate 4 stand." };
  });
}
function findTrip(r, id, changed){
  var all = (changed ? changedTrips(r) : DATA[r].today).concat(DATA[r].tomorrow);
  for(var i=0;i<all.length;i++) if(all[i].id===id) return all[i];
  return DATA[r].today[0];
}
