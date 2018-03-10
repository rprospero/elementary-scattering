"use strict";

console.log("Hello, World");

var radius = 20;
var svg = document.querySelector("svg");
var pt = svg.createSVGPoint();
var neutron = document.querySelector("#neutron")
var final = document.querySelector("#final")

function dot(a, b) {
    return a.x*b.x+a.y*b.y;
};
function add(a, b) {
    return {"x": a.x+b.x, "y": a.y+b.y};
}
function sub(a, b) {
    return {"x": a.x-b.x, "y": a.y-b.y};
}
function scale(s, v) {
    return {"x": s*v.x, "y": s*v.y};
}

function box_collide(x, v) {
    // x+vt = p
    // t = (p-x)/v
    var hits = [];
    hits.push((0-x.x)/v.x);
    hits.push((0-x.y)/v.y);
    hits.push((200-x.x)/v.x);
    hits.push((200-x.y)/v.y);
    hits = hits.filter(x => x>0);
    hits.sort((a, b) => a-b)
    return add(x, scale(hits[0], v));
}
    

function collission(x, v) {
    // pt = x + v t
    // ((x + vt)-d)^2 = R^2
    // x^2 + v^2t^2+d^2+2xvt-2xd-2dvt - R^2 = 0
    // a = v^2
    // b =2xv - 2dv
    // c = x^2 + d^2 - 2xd - R^2
    var d = {"x": 100, "y": 100};
    var a = dot(v, v);
    var b = 2 * (dot(x, v) - dot(d, v));
    var c = dot(x, x) + dot(d, d) - 2 * dot(x, d) - radius*radius;
    var D = b*b-4*a*c;

    if(D < 0){return {"pt": null, "v": v}}

    var v_out = {"x": v.y, "y": v.x};

    var pt = null;
    var t1 = (-b - Math.sqrt(D))/2/a;
    if(t1 > 0){pt = add(x, scale(t1, v));}
    else {
	var t2 = (-b + Math.sqrt(D))/2/a;
	if(t2 > 0){pt = add(x, scale(t2, v))}
	else {return {"pt": null, "v": v}}
    };
    var norm = {"x": pt.x-100, "y": pt.y-100};
    norm = scale(1/Math.sqrt(dot(norm, norm)), norm);
    v_out = sub(v, scale(2*dot(v, norm), norm));
    return {"pt": pt, "v": v_out};
};
    

function makePath(a) {
    var result = "M " + a[0].x + " " + a[0].y;
    for(var idx=1; idx<a.length; idx++) {
	result += " L " + a[idx].x + " " + a[idx].y;
    }
    return result;
};

var beam = Rx.Observable.fromEvent(svg, "mousemove")
    .map(function(e) {
	pt.x = e.clientX;
	pt.y = e.clientY;
	var cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());
	cursorpt.y = 0;
	return cursorpt;
    });

beam.subscribe(pt => document.querySelector("#source").setAttribute("transform","translate("+pt.x+",0)"))

var neutron_path = beam.map(function(x) {
    var path = [x];
    var c = collission(x, {"x": 0, "y":1});
    while(c.pt !== null) {
	path.push(c.pt);
	c = collission(c.pt, c.v);
    }
    var last = path[path.length-1];
    path.push(box_collide(last, c.v));
    // path.push({"x": last.x+40*c.v.x, "y": last.y+40*c.v.y})
    return path;});

neutron_path.map(makePath)
    .subscribe(path => neutron.setAttribute("d",path));

var hit = neutron_path.map(function(x) {
    return x[x.length-1];
});

hit.subscribe(function(pt) {
    final.setAttribute("cx", pt.x);
    final.setAttribute("cy", pt.y);
});

console.log("None");

Rx.Observable.fromEvent(document.querySelector("#view-path"), "change")
    .map(e => e.target.checked)
    .subscribe(function(b){
	if(b) {
	    neutron.setAttribute("class", "drawn");
	} else {
	    neutron.setAttribute("class", "hidden");
	}});

var sample = document.querySelector("#sample");
Rx.Observable.fromEvent(document.querySelector("#view-sample"), "change")
    .map(e => e.target.checked)
    .subscribe(function(b){
	if(b) {
	    sample.setAttribute("class", "sample");
	} else {
	    sample.setAttribute("class", "hidden");
	}});
