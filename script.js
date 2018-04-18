"use strict";

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

function Circle(r, cntr) {
    this.radius = r;
    this.center = cntr;
    this.collission = function(x, v) {
	// pt = x + v t
	// ((x + vt)-d)^2 = R^2
	// x^2 + v^2t^2+d^2+2xvt-2xd-2dvt - R^2 = 0
	// a = v^2
	// b =2xv - 2dv
	// c = x^2 + d^2 - 2xd - R^2
	var d = {"x": this.center.x, "y": this.center.y};
	var a = dot(v, v);
	var b = 2 * (dot(x, v) - dot(d, v));
	var c = dot(x, x) + dot(d, d) - 2 * dot(x, d) - this.radius*this.radius;
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
	var norm = {"x": pt.x-this.center.x, "y": pt.y-this.center.y};
	norm = scale(1/Math.sqrt(dot(norm, norm)), norm);
	v_out = sub(v, scale(2*dot(v, norm), norm));
	return {"pt": pt, "v": v_out};
    };
    this.draw = function() {
	var node = document.createElementNS("http://www.w3.org/2000/svg", "circle");
	node.setAttribute("cx", this.center.x);
	node.setAttribute("cy", this.center.y);
	node.setAttribute("r", this.radius);
	node.setAttribute("class", "sample");

	return node;
    }
}

function points2homogeneous(p1, p2) {
    // a p1.x + p1.y + c = 0
    // c = -a p1.x - p1.y
    // a p2.x + p2.y - a p1.x - p1.y = 0
    // a (p2.x - p1.x) = p1.y - p2.y
    if(p1.x === p2.x) {
	return {"a": 1, "b": 0, "c": -p1.x};
    }
    var a = (p2.y - p1.y)/(p1.x - p2.x);
    var c = -p1.y - a * p1.x;
    console.assert(p1.x*a + p1.y + c == 0, a, c, p1.x, p1.y);
    console.assert(p2.x*a + p2.y + c == 0, a, c, p2.x, p2.y);
    return {"a": a, "b": 1, "c": c};
}

function vec2homogeneous(x, v) {
    // pt = x + vt
    // slope = v.y/v.x
    // y = m x + b
    // x.y = v.y/v.x * x.x + b
    // b = v.y/v.x * x.x - x.y
    // y-mx - b = 0
    // y - m x - b = 0
    if(v.x == 0) {
	return {"a": 1, "b": 0, "c": -x.x}
    }
    var m = v.y/v.x;
    var b = x.y - m * x.x;
    console.assert(x.x*-m + x.y - b == 0, -m, b);
    return {"a": -m, "b": 1, "c": -b};
}

function homogeneous_intersect(a, b) {
    var c = a.a*b.b-b.a*a.b;
    if(c===0) { return null;}
    return {"x": (a.b*b.c-a.c*b.b)/c,
	    "y": (a.c*b.a-a.a*b.c)/c};
}

function homogeneous_norm(x) {
    if(x.a===0){return {"x": 1, "y": 0};}
    if(x.b===0){return {"x": 0, "y": 1};}
    return {"x": x.a, "y": x.b};
};

function vec_dist(pt, x, v) {
    if(v.x === 0) {
	return (pt.y-x.y)/v.y;
    };
    return (pt.x-x.x)/v.x;
}

function Polygon(pts) {
    this.points = pts;
    this.collission = function(x, v) {
	var inner = vec2homogeneous(x, v);

	var linear = []
	for(var idx=0; idx< this.points.length-1; idx++) {
	    linear.push(points2homogeneous(this.points[idx], this.points[idx+1]));
	}
	linear.push(points2homogeneous(this.points[idx], this.points[0]));
	var pts = linear.map(x => {return {"pt": homogeneous_intersect(inner, x),
					  "v": homogeneous_norm(x)}});

	var intersections = [];
	var minx = 0; var miny = 0; var maxx = 0; var maxy = 0;
	for(var idx=0; idx< this.points.length-1; idx++) {
	    if(pts[idx].pt===null){continue;}
	    minx = Math.min(this.points[idx].x, this.points[idx+1].x);
	    miny = Math.min(this.points[idx].y, this.points[idx+1].y);
	    maxx = Math.max(this.points[idx].x, this.points[idx+1].x);
	    maxy = Math.max(this.points[idx].y, this.points[idx+1].y);
	    if(minx <= pts[idx].pt.x && maxx >= pts[idx].pt.x &&
	       miny <= pts[idx].pt.y && maxy >= pts[idx].pt.y) {
		intersections.push(pts[idx]);
	    }
	}
	minx = Math.min(this.points[idx].x, this.points[0].x);
	miny = Math.min(this.points[idx].y, this.points[0].y);
	maxx = Math.max(this.points[idx].x, this.points[0].x);
	maxy = Math.max(this.points[idx].y, this.points[0].y);
	if(pts[idx].pt !== null &&
	   minx <= pts[idx].pt.x && maxx >= pts[idx].pt.x &&
	   miny <= pts[idx].pt.y && maxy >= pts[idx].pt.y) {
	    intersections.push(pts[idx]);
	}

	intersections = intersections.filter(function(a) {
	    var dist = (a.pt.x-x.x)*(a.pt.x-x.x)+(a.pt.y-x.y)*(a.pt.y-x.y);
	    return dist > 1e2;
	});

	intersections = intersections.filter(a => vec_dist(a.pt, x, v) > 0);
	intersections.sort((a,b) => vec_dist(a.pt, x, v) - vec_dist(b.pt, x, v))

	if(intersections.length===0) {
	    return {"pt": null, "v": v};
	}

	var pt = intersections[0].pt
	var norm = intersections[0].v;
	norm = scale(1/Math.sqrt(dot(norm, norm)), norm);
	if(dot(v, norm) > 0) {norm = scale(-1, norm);}
	var v_out = sub(v, scale(2*dot(v, norm), norm));
		       
	return {"pt": pt, "v": v_out};
	// return {"pt": pt, "v": norm};
    };
    this.draw = function() {
	var node = document.createElementNS("http://www.w3.org/2000/svg", "path");
	node.setAttribute("d", makePath(this.points));
	node.setAttribute("class", "sample");

	return node;
    };
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
    return add(x, scale(hits[0]-9, v));
}
    

    

function makePath(a) {
    var result = "M " + a[0].x + " " + a[0].y;
    for(var idx=1; idx<a.length; idx++) {
	result += " L " + a[idx].x + " " + a[idx].y;
    }
    return result;
};

// Beam at mouse cursor
// var beam = Rx.Observable.fromEvent(svg, "mousemove")
//     .map(function(e) {
// 	pt.x = e.clientX;
// 	pt.y = e.clientY;
// 	var cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());
// 	cursorpt.y = 0;
// 	return cursorpt;
//     });

//Beam moves on its own
var beam = Rx.Observable.timer(25, 25)
    .map(function(e) {
	var x = e % 200;
	return {"x": x, "y": 0};
    });

beam.subscribe(pt => document.querySelector("#source").setAttribute("transform","translate("+pt.x+",0)"))

Rx.Observable.fromEvent(document.querySelector("#view-path"), "change")
    .map(e => e.target.checked)
    .startWith(document.querySelector("#view-path").checked)
    .subscribe(function(b){
	if(b) {
	    neutron.setAttribute("class", "drawn");
	} else {
	    neutron.setAttribute("class", "hidden");
	}});

var sample = document.querySelector("#sample");
Rx.Observable.fromEvent(document.querySelector("#view-sample"), "change")
    .map(e => e.target.checked)
    .startWith(document.querySelector("#view-sample").checked)
    .subscribe(function(b){
	if(b) {
	    sample.setAttribute("visibility", "visible");
	} else {
	    sample.setAttribute("visibility", "hidden");
	}});


var circle = new Circle(35, {"x": 100, "y":100});
var square = new Polygon([{"x": 100, "y": 40}, {"x": 160, "y": 100},
			    {"x": 100, "y": 160}, {"x": 40, "y": 100}]);

var active_sample = Rx.Observable.fromEvent(document.querySelector("#sample-choice"), "change")
    .map(x => x.target.value)
    .startWith(document.querySelector("#sample-choice").value)
    .map(function(choice) {
	if(choice === "square") {
	    return square;
	}
	return circle;
    })

active_sample.subscribe(console.log);

active_sample.subscribe( function(sample) {
    document.querySelector("#sample").innerHTML = "";
    document.querySelector("#sample").appendChild(sample.draw());
});

var neutron_path = beam.combineLatest(active_sample)
    .map(function(x) {
	var path = [x[0]];
	var sample = x[1];
	console.log(sample);
	var c = sample.collission(path[0], {"x": 0, "y":1});
	var idx = 0;
	while(c.pt !== null) {
	    path.push(c.pt);
	    c = sample.collission(c.pt, c.v);
	    idx++;
	    if(idx>3){break;}
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
