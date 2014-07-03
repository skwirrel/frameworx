/*

    Frameworx - a Node.js module for generating 3D stick frameworks (https://www.github.com/skwirrel/frameworx/)
    Copyright (C) 2014 Ben Jefferson <skwirrel@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/

var fs = require('fs');
var sprintf = require('sprintf');

function sqr(x) { return Math.pow(x,2); }

if (typeof(process)!='undefined') {
	segment = process.env.SEGMENT || 0;
	segmentSize = 10000;
} else {
	segment=0;
}
slices=[];
proximity=0.8;


function toRadians(degrees) {
	return degrees * Math.PI / 180;
}

function getVector(x,y,z) {
	if ('|object|array|'.indexOf(typeof(x))>0) {
		return x;
	}
	return([x,y,z]);
}

// Uses the point as a directional vector but changes the length so that it is equal to 1
function normalizeVector( vector ) {
	var length = distance( vector );
	var normalized = [];
	normalized[0] = vector[0]/length;
	normalized[1] = vector[1]/length;
	normalized[2] = vector[2]/length;
	return normalized;
	
}

rotatePoint = function(point,angle,xpart,ypart) {
	angle = (angle * Math.PI)/180;
	var x = point[xpart]*Math.cos(angle) - point[ypart]*Math.sin(angle);
	var y = point[xpart]*Math.sin(angle) + point[ypart]*Math.cos(angle);
	var newPoint = [point[0],point[1],point[2]];
	newPoint[xpart]=x;
	newPoint[ypart]=y;
	return newPoint;
}

function lineLookup(radius) {
	this.radius = radius;
	this.data = []
}

lineLookup.prototype.sortPoints = function( point1, point2 ) {
	var x1 = Math.floor(point1[0]/this.radius);
	var y1 = Math.floor(point1[1]/this.radius);
	var z1 = Math.floor(point1[2]/this.radius);
	var x2 = Math.floor(point2[0]/this.radius);
	var y2 = Math.floor(point2[1]/this.radius);
	var z2 = Math.floor(point2[2]/this.radius);

	if (
		( x1>x2 ) ||
		( x1==x2 && y1>y2 ) ||
		( x1==x2 && y1==y2 && z1>z2 )
	) return [[x2,y2,z2],[x1,y1,z1]];
	else return [[x1,y1,z1],[x2,y2,z2]];
};

lineLookup.prototype.add = function(point1,point2) {

	var points = this.sortPoints(point1,point2);
	x1 = points[0][0];
	y1 = points[0][1];
	z1 = points[0][2];
	x2 = points[1][0];
	y2 = points[1][1];
	z2 = points[1][2];
	
	if (typeof(this.data[x1])=='undefined') this.data[x1]=[];
	if (typeof(this.data[x1][y1])=='undefined') this.data[x1][y1]=[];
	if (typeof(this.data[x1][y1][z1])=='undefined') this.data[x1][y1][z1]=[];
	if (typeof(this.data[x1][y1][z1][x2])=='undefined') this.data[x1][y1][z1][x2]=[];
	if (typeof(this.data[x1][y1][z1][x2][y2])=='undefined') this.data[x1][y1][z1][x2][y2]=[];
	if (typeof(this.data[x1][y1][z1][x2][y2][z2])=='undefined') this.data[x1][y1][z1][x2][y2][z2]=1;
}

lineLookup.prototype.check = function(point1,point2) {

	var points = this.sortPoints(point1,point2);
	x1 = points[0][0];
	y1 = points[0][1];
	z1 = points[0][2];
	x2 = points[1][0];
	y2 = points[1][1];
	z2 = points[1][2];

	if (typeof(this.data[x1])=='undefined') return 0;
	if (typeof(this.data[x1][y1])=='undefined') return 0;
	if (typeof(this.data[x1][y1][z1])=='undefined') return 0;
	if (typeof(this.data[x1][y1][z1][x2])=='undefined') return 0;
	if (typeof(this.data[x1][y1][z1][x2][y2])=='undefined') return 0;
	if (typeof(this.data[x1][y1][z1][x2][y2][z2])=='undefined') return 0;
	return 1;
}

function pointLookup(radius,countOnly) {
	this.radius = radius;
	this.points = [];
	this.countOnly = countOnly;
}

pointLookup.prototype.roundPoint = function (point) {
	this.x = Math.floor(point[0]/this.radius);
	this.y = Math.floor(point[1]/this.radius);
	this.z = Math.floor(point[2]/this.radius);
}

// If a stick is passed instead of a point then the line itself is stored in the lookup table against both the start point and the end point
pointLookup.prototype.add = function(point,count,item) {
	if (point.type=='stick') {
		this.add(point.start,count,point);
		this.add(point.end,count,point);
		return;
	}
	if (typeof(item)=='undefined') item = point;
	this.roundPoint(point);
	if (!count) count=1;
	
	if (typeof(this.points[this.x])=='undefined') this.points[this.x]=[];
	if (typeof(this.points[this.x][this.y])=='undefined') this.points[this.x][this.y]=[];
	if (this.countOnly) {
		if (typeof(this.points[this.x][this.y][this.z])=='undefined') this.points[this.x][this.y][this.z]=0;
		this.points[this.x][this.y][this.z]+=count;
	} else {
		if (typeof(this.points[this.x][this.y][this.z])=='undefined') this.points[this.x][this.y][this.z]=[];
		this.points[this.x][this.y][this.z].push(item);
	}
}

pointLookup.prototype.count = function(point) {
	this.roundPoint(point);

	if (typeof(this.points[this.x])=='undefined') return 0;
	if (typeof(this.points[this.x][this.y])=='undefined') return 0;
	if (typeof(this.points[this.x][this.y][this.z])=='undefined') return 0;
	if (this.countOnly) {
		return (this.points[this.x][this.y][this.z]);
	} else {
		return (this.points[this.x][this.y][this.z].length);
	}
}

pointLookup.prototype._get = function(point) {	

	if (typeof(this.points[point[0]])=='undefined') return [];
	if (typeof(this.points[point[0]][point[1]])=='undefined') return [];
	if (typeof(this.points[point[0]][point[1]][point[2]])=='undefined') return [];
	return this.points[point[0]][point[1]][point[2]];
}

pointLookup.prototype.clear = function(point) {
	this.roundPoint(point);

	if (typeof(this.points[this.x])=='undefined') return;
	if (typeof(this.points[this.x][this.y])=='undefined') return;
	if (typeof(this.points[this.x][this.y][this.z])=='undefined') return;
	if (this.countOnly) {
		this.points[this.x][this.y][this.z] = 0;
	} else {
		this.points[this.x][this.y][this.z] = [];
	}
}

pointLookup.prototype.eachPoint = function(callback) {
	var x,y,z;
	for ( x in this.points ) {
		for (y in this.points[x]) {
			for (z in this.points[x][y]) {
				callback(this.points[x][y][z],x,y,z);
			}
		}
	}
}

function mergePoints( points ) {
	var avx=0;
	var avy=0;
	var avz=0;
	for( var idx = points.length-1; idx>=0; idx-- ) {
		avx+=points[idx][0];
		avy+=points[idx][1];
		avz+=points[idx][2];
	}
	avx=avx/points.length;
	avy=avy/points.length;
	avz=avz/points.length;
	for( var idx = points.length-1; idx>=0; idx-- ) {
		points[idx][0] = avx;
		points[idx][1] = avy;
		points[idx][2] = avz;
	}
}

// Measure distance between two points, or, if only one point is passed, the distance of that point from the origin
function distance( point1, point2 ) {
	if (typeof(point2)=='undefined') point2=[0,0,0];
	return Math.sqrt(
		Math.pow(point1[0]-point2[0],2)+
		Math.pow(point1[1]-point2[1],2)+
		Math.pow(point1[2]-point2[2],2)
	);
}

pointLookup.prototype.mergeClosePoints = function() {
	var x,y,z;

	// iterate through all the points
	for (x in this.points) {
		x=parseInt(x);
		for (y in this.points[x]) {
			y=parseInt(y);
			for (z in this.points[x][y]) {
				z=parseInt(z);
				var possibleNearby = [];
				var nearx, neary, nearz;
				for (nearx=-1;nearx<2;nearx++) {
					for (neary=-1;neary<2;neary++) {
						for (nearz=-1;nearz<2;nearz++) {
							var toAdd = this._get([x+nearx,y+neary,z+nearz]);
							possibleNearby = possibleNearby.concat( toAdd );
						}
					}
				}

				for (var idx1 = this.points[x][y][z].length-1; idx1>=0; idx1--) {
					var point = this.points[x][y][z][idx1];
					var nearby = [ point ];
					for (var idx2 = possibleNearby.length-1; idx2>=0; idx2--) {
						var dist = distance( possibleNearby[idx2],point );
						if (dist>0 && dist<this.radius) {
							nearby.push( possibleNearby[idx2] );
						}
					}
					if (nearby.length>1) {
						mergePoints(nearby);
					}
				}
			}
		}
	}
}

pointLookup.prototype.fillGaps = function(lineLookup,looseEndLimit,width) {
	var looseEnds = new pointLookup(this.radius);
	
	var x,y,z;
	// iterate through all the points
	for (x in this.points) {
		x=parseInt(x);
		for (y in this.points[x]) {
			y=parseInt(y);
			for (z in this.points[x][y]) {
				z=parseInt(z);
				var converging = this._get([x,y,z]);
				if (converging.length<=looseEndLimit) {
					// we have a loose end
					for (var i=converging.length-1; i>=0; i--) {
						looseEnds.add(converging[i]);
					}
				}
			}
		}
	}
	
	return looseEnds.joinLooseEnds(looseEndLimit,lineLookup,width);
}

pointLookup.prototype.joinLooseEnds = function(looseEndLimit, lineLookup,width) {
	var infill = new frame();
	
	var x,y,z;
	// iterate through all the points
	for (x in this.points) {
		x=parseInt(x);
		for (y in this.points[x]) {
			y=parseInt(y);
			for (z in this.points[x][y]) {
				z=parseInt(z);

				// Check if this point is still a loose end
				if (this.points[x][y][z].length>looseEndLimit) continue;

				// Look for loosends nearby				
				var possibleNearby = [];
				var nearx, neary, nearz;
				var searchSize = 3;
				for (nearx=-searchSize;nearx<=searchSize;nearx++) {
					for (neary=-searchSize;neary<=searchSize;neary++) {
						for (nearz=-searchSize;nearz<=searchSize;nearz++) {
							if (nearx==0 && neary==0 && nearz==0) continue;
							var toAdd = this._get([x+nearx,y+neary,z+nearz]);
							// Check the other point to make sure it is still a loose end
							if (toAdd.length>looseEndLimit) continue;
							possibleNearby = possibleNearby.concat( toAdd );
						}
					}
				}

				if (!possibleNearby.length) continue;
				
				// all the points in this square should already have been merged so we just take the position of the first
				var point = this.points[x][y][z][0];
				
				possibleNearby.sort(function(a,b) {
					d1 = distance(point,a);
					d2 =  distance(point,b);
					if (d1<d2) return -1;
					if (d1>d2) return 1;
					return 0;
				});
				
				// add a member joining point to the closest which we're not already connected to
				for( var i=0; i<possibleNearby.length; i++ ) {
					if (!lineLookup.check(point, possibleNearby[i])) {
						infill.add(new stick(point, possibleNearby[i],width));
						this.points[x][y][z].push(point);
						// add the new points in at each end - this means they may or may not still be loose ends
						this.add(possibleNearby[i]);
						break;
					}
				}
			}
		}
	}
	
	return infill;
}
				
function stick(start,end,thickness) {
	this.type='stick';
	this.start=[start[0],start[1],start[2]];
	this.end=[end[0],end[1],end[2]];
	this.thickness=thickness || 1;
	this.deleted=false;
}

function outerPoints(axis,p1,p2,p3,p4) {
	if (p1[axis]>p2[axis]) { var t=p1; p1=p2; p2=t };
	if (p3[axis]>p4[axis]) { var t=p3; p3=p4; p4=t };
	var min = p1[axis]<p3[axis] ? p1:p3;
	var max = p2[axis]>p4[axis] ? p2:p4;
	return [min,max];
}

stick.prototype.vector = function() {
	return [
		this.end[0]-this.start[0],
		this.end[1]-this.start[1],
		this.end[2]-this.start[2],
	]
}

// This function assumes that we already know that the two lines share a common point
// Tolerance is expressed in max degrees between lines
stick.prototype.colinearWith = function(stick2,tolerance)  {
	// Convert the two sticks into normalized vectors (i.e. same direction but length=1)
	// Then measure the distance between the two end points of the vectors
	// If the distance if either very close to 0 or very close to 2 then the lines are going in exactly the same or exactly opposite directions
	var dist = distance( normalizeVector(this.vector()), normalizeVector(stick2.vector()) );
	if (dist > 1.4) dist = 2-dist;
	var maxDeviation = Math.sin(toRadians(tolerance/2))*2;
	return dist<maxDeviation;
}

// This assumes that the two sticks are colinear
stick.prototype.mergeWith = function(stick2) {

	var p = [ this.start, this.end, stick2.start, stick2.end ];
	// Pick any point - lets pick point [0]
	// Now find the point which is furthest away
	var endPoint1Idx;
	var endPoint2Idx;
	var maxDist = 0;
	for (var i=1; i<4; i++) {
		var dist = distance(p[0],p[i]);
		if (dist>maxDist) {
			maxDist = dist;
			endPoint1Idx = i;
		}
	}

	maxDist = 0;
	// Now that we have found one end we can find the point which is furthest from this
	for (var i=0; i<4; i++) {
		if (i==endPoint1Idx) continue;
		var dist = distance(p[endPoint1Idx],p[i]);
		if (dist>maxDist) {
			maxDist = dist;
			endPoint2Idx = i;
		}
	}

	return new stick( p[endPoint1Idx], p[endPoint2Idx] );
}

stick.prototype.length = function() {
	return distance(this.end,this.start);
}

stick.prototype.midpoint = function(fraction) {
	if (typeof(fraction)=='undefined') fraction=0.5;
	return [
		this.start[0]+(this.end[0]-this.start[0])*fraction,
		this.start[1]+(this.end[1]-this.start[1])*fraction,
		this.start[2]+(this.end[2]-this.start[2])*fraction
	];
}

stick.prototype.swapEnds = function() {
	var tmp = this.start;
	this.start = this.end;
	this.end = tmp;
}

stick.prototype.scale = function( scaleX, scaleY, scaleZ ) {
	if (typeof(scaleY)=='number') scale = [scaleX,scaleY,scaleZ];
	else if (typeof(scaleX)=='number') scale = [scaleX,scaleX,scaleX];
	else scale = scaleX;
	
	return new stick(
		[this.start[0]*scale[0],this.start[1]*scale[1],this.start[2]*scale[2]],
		[this.end[0]*scale[0],this.end[1]*scale[1],this.end[2]*scale[2]],
		this.thickness
	);
}

stick.prototype.render = function(thickness,resolution) {
	return cylinder({start:this.start,end:this.end,radius:thickness*this.thickness,fn:resolution||8})
		.unionForNonIntersecting(sphere({center:this.start,radius:thickness*this.thickness,fn:resolution||8}))
		.unionForNonIntersecting(sphere({center:this.end,radius:thickness*this.thickness,fn:resolution||8}))
}

stick.prototype.translate = function(x,y,z) {
	vector = getVector(x,y,z);

	return new stick(
		[this.start[0]+vector[0],this.start[1]+vector[1],this.start[2]+vector[2]],
		[this.end[0]+vector[0],this.end[1]+vector[1],this.end[2]+vector[2]],
		this.thickness
	);
}

stick.prototype.rotate = function(angle,xpart,ypart) {
	return new stick(
		rotatePoint(this.start,angle,xpart,ypart),
		rotatePoint(this.end,angle,xpart,ypart),
		this.thickness
	);
}


stick.prototype.rotateZ = function(angle) {
	return this.rotate(angle,0,1)
}

stick.prototype.rotateY = function(angle) {
	return this.rotate(angle,0,2)
}

stick.prototype.rotateX = function(angle) {
	return this.rotate(angle,1,2)
}

stick.prototype.outsidePrintArea = function(printArea) {
    var axis;
    for( axis=0; axis<3; axis++) {
        if (!printArea[axis].length) continue;
        if (this.start[axis]<printArea[axis][0]) return true;
        if (this.start[axis]>printArea[axis][1]) return true;
        if (this.end[axis]<printArea[axis][0]) return true;
        if (this.end[axis]>printArea[axis][1]) return true;
    }
    return false;
}

function frame() {
	this.start=[0,0,0];
	this.end=[0,0,0];
	this.members = [];
	this.type='frame';
	this.deleted=false;
}


frame.prototype.eachMember = function(callback) {
	var numMembers = this.members.length;

	for (var count=0; count<numMembers; count++) {
		if (this.members[count].deleted) continue;
		callback(this.members[count],count);
	}
}

frame.prototype.length = stick.prototype.length;

frame.prototype.copy = function() {
	return this.translate(0,0,0);
}

frame.prototype.add = function(thing) {
	if (thing.type=='frame') {
		this.members = this.members.concat(thing.copy().members);
	} else if (thing.type=='stick') {
		this.members.push(thing);
	}
}

frame.prototype.rotate = function(angle,xpart,ypart) {
	var newFrame = new frame();	
	newFrame.start = rotatePoint(this.start,angle,xpart,ypart);
	newFrame.end = rotatePoint(this.end,angle,xpart,ypart);

	this.eachMember(function(member){
		newFrame.add(member.rotate(angle,xpart,ypart));
	});
	
	return newFrame;
}

frame.prototype.rotateZ = function(angle) {
	return this.rotate(angle,0,1)
}

frame.prototype.rotateY = function(angle) {
	return this.rotate(angle,0,2)
}

frame.prototype.rotateX = function(angle) {
	return this.rotate(angle,1,2)
}

frame.prototype.translate = function(x,y,z) {
	vector = getVector(x,y,z);

	var newFrame = new frame();

	this.eachMember(function(member){	
		newFrame.add(member.translate(vector));
	});
	
	newFrame.start = [this.start[0]+vector[0],this.start[1]+vector[1],this.start[2]+vector[2]];
	newFrame.end = [this.end[0]+vector[0],this.end[1]+vector[1],this.end[2]+vector[2]];

	return newFrame;
}

frame.prototype.scale = function(scaleX,scaleY,scaleZ) {
	var newFrame = new frame();

	this.eachMember(function(member){
		newFrame.add(member.scale(scaleX,scaleY,scaleZ));
	});

	if (typeof(scaleY)=='number') scale = [scaleX,scaleY,scaleZ];
	else if (typeof(scaleX)=='number') scale = [scaleX,scaleX,scaleX];
	else scale = scaleX;
	
	newFrame.start = [this.start[0]*scale[0],this.start[1]*scale[1],this.start[2]*scale[2]];
	newFrame.end = [this.end[0]*scale[0],this.end[1]*scale[1],this.end[2]*scale[2]];

	return newFrame;
}

frame.prototype.scaleX = function(scale) {
	return this.scale([scale,1,1]);
}

frame.prototype.scaleY = function(scale) {
	return this.scale([1,scale,1]);
}

frame.prototype.scaleZ = function(scale) {
	return this.scale([1,1,scale]);
}

frame.prototype.split = function( parts ) {
	if (!parts) parts = 2;
	
	var newMembers = [];
	
	this.eachMember(function(member){
		var lastPoint = member.start;
		
		for (var i=1; i<=parts; i++) {
			var midPoint = member.midpoint(i/parts);
			newMembers.push(new stick(lastPoint,midPoint));
			lastPoint = midPoint;
		}
	});

	this.members = newMembers;
	return this;
}	

frame.prototype.vacuum = function() {
	var newMembers = [];
	this.eachMember(function(member){
		// remove zero length lines
		if (
			member.start[0]==member.end[0] &&
			member.start[1]==member.end[1] &&
			member.start[2]==member.end[2]
		) return;
		newMembers.push(member);
	});

	this.members = newMembers;
}	


frame.prototype.mergePoints = function( proximity ) {	
	var lookup = new pointLookup(proximity);
	this.eachMember(function(member) {
		lookup.add(member.start);
		lookup.add(member.end);
	});
	lookup.mergeClosePoints();

	return this;
}

frame.prototype.mergeSticks = function( proximity, colinearityTolerance, repeatCount ) {
	if (typeof(repeatCount)=='undefined') repeatCount = 2;
	if (typeof(colinearityTolerance)=='undefined') colinearityTolerance = 0.5;

	var self = this;
	var numMerges=0;
	do {
		numMerges++;
		var numMerged = 0;

		// rebuild the pointLookup as some points may have moved during merge
		// or the points may no longer exists after lines have been merged in previous iteration
		var lookup = new pointLookup(proximity);
		this.eachMember(function(member) {
			lookup.add(member);
		});

		lookup.eachPoint(function(members){
			if (members.length<2) return;
			// Compare each line arriving at this point with every other line arriving here to see if they are colinear
			var numMembers = members.length;
			for( var member1Idx=0; member1Idx<numMembers-1; member1Idx++ ) {
				if (members[member1Idx].deleted) continue;
				for( var member2Idx=member1Idx+1; member2Idx<numMembers; member2Idx++ ) {
					if (members[member2Idx].deleted) continue;
					if (members[member1Idx].colinearWith(members[member2Idx],colinearityTolerance)) {
						numMerged++;
						var merged = members[member1Idx].mergeWith(members[member2Idx]);
						//merged = merged.translate([1,0,0]);
						members[member1Idx].deleted=true;
						members[member2Idx].deleted=true;
						members[member1Idx] = merged;
						self.add(merged);
						lookup.add(merged);
					}
				}
			}
		});

	} while (numMerged>0 && numMerges<repeatCount);
	
frame.prototype.fillGaps = function( proximity ) {
		for( var looseEndLimit=2; looseEndLimit<=3; looseEndLimit++) {
			var numMembers = this.members.length;
			var lines = new lineLookup(proximity);
			var lookup = new pointLookup(proximity);
			this.eachMember(function(member) {
				lookup.add(member.start);
				lookup.add(member[count].end);
				lines.add(member[count].start,member[count].end);
			});
			var infill = lookup.fillGaps(lines,looseEndLimit,1);
			this.add(infill);
		}
	}
}

frame.prototype._writeStl = function(file,offset) {

	if ((this.members.length % 3) != 0) {
		console.log('Frame does not have whole multiple of 3 number of members and so cannot be written to STL file');
		return;
	}
	this.eachMember(function(member) {
		file._writeVertex([
			member.start[0]+offset[0],
			member.start[1]+offset[1],
			member.start[2]+offset[2]
		]);
	});
}

frame.prototype.layAlongLine = function( line ) {

	point1 = line.start;
	point2 = line.end;
	var direction = [
		point2[0]-point1[0],
		point2[1]-point1[1],
		point2[2]-point1[2]
	];
	var length=Math.sqrt(sqr(direction[0])+sqr(direction[1])+sqr(direction[2]));

	// Move point 1 to the origin
	var newFrame = this.rotateY(Math.asin(direction[2]/length)/(2*Math.PI)*360);
	newFrame = newFrame.rotateZ(Math.atan2(direction[1],direction[0])/(2*Math.PI)*360);

	newFrame = newFrame.translate(point1);
	
	return newFrame;
}

frame.prototype.layAlongX = function layAlongX() {
	point1 = this.start;
	point2 = this.end;
	var direction = [
		point2[0]-point1[0],
		point2[1]-point1[1],
		point2[2]-point1[2]
	];
	var length=Math.sqrt(sqr(direction[0])+sqr(direction[1])+sqr(direction[2]));

	// Move point 1 to the origin
	var newFrame = this.translate([point1[0]*-1,point1[1]*-1,point1[2]*-1]);
	newFrame = newFrame.rotateZ(-1*(Math.atan2(direction[1],direction[0])));
	newFrame = newFrame.rotateY(-1*(Math.asin(direction[2]/length)));
	
	return newFrame;
}

frame.prototype.renderStl = function(stlFile, radius, resolution, printArea) {
	this.vacuum();
	if (typeof(radius)=='undefined') radius=0.5;
	if (typeof(resolution)=='undefined') resolution=8;
	
	if (typeof(printArea)=='undefined') printArea=[[],[],[]];
	var points = [[],[]];
	var angleStep = Math.PI*2/resolution;
	var rootTwo = Math.pow(2,0.5);
	for( i=0; i<resolution; i++ ) {
		var angle = angleStep*i;
		points[0][i] = [0,Math.sin(angle)*radius,Math.cos(angle)*radius];
		points[1][i] = [-radius/rootTwo,Math.sin(angle+angleStep/2)*radius/rootTwo,Math.cos(angle+angleStep/2)*radius/rootTwo];
	}

	nullPoint = [0,0,0];
	dome1 = new frame();
	disc1 = new frame();
	for( i=0; i<resolution; i++ ) {
		var nextPoint = (i+1) % resolution;

		// Only the start points of these sticks will be used so we don't need to bother defining the ends
		dome1.add( new stick(points[0][i]			,nullPoint));
		dome1.add( new stick(points[0][nextPoint]	,nullPoint));
		dome1.add( new stick(points[1][i]			,nullPoint));

		dome1.add( new stick(points[0][nextPoint]	,nullPoint));
		dome1.add( new stick(points[1][nextPoint]	,nullPoint));
		dome1.add( new stick(points[1][i]			,nullPoint));

		dome1.add( new stick(points[1][i]			,nullPoint));
		dome1.add( new stick(points[1][nextPoint]	,nullPoint));
		dome1.add( new stick([-radius,0,0]			,nullPoint));
		
		disc1.add( new stick(points[0][i]			,nullPoint));
		disc1.add( new stick(points[0][nextPoint]	,nullPoint));
		disc1.add( new stick([0,0,0]				,nullPoint));
	}

	dome2 = dome1.rotateY(180);
	disc2 = disc1.rotateY(180);
	
	var numMembers = this.members.length;
	var count;
	var numFacets = (numMembers * resolution * 8) -1;

	var min = [ this.members[0].start[0], this.members[0].start[1], this.members[0].start[2] ];
	var maxThickness = 0;
	
	for (count=0; count<numMembers; count++) {
		if (this.members[count].start[0]<min[0]) min[0]=this.members[count].start[0];
		if (this.members[count].start[1]<min[1]) min[1]=this.members[count].start[1];
		if (this.members[count].start[2]<min[2]) min[2]=this.members[count].start[2];

		if (this.members[count].end[0]<min[0]) min[0]=this.members[count].end[0];
		if (this.members[count].end[1]<min[1]) min[1]=this.members[count].end[1];
		if (this.members[count].end[2]<min[2]) min[2]=this.members[count].end[2];
		
		if (this.members[count].thickness > maxThickness) maxThickness = this.members[count].thickness;
	}
	maxThickness *= radius;
	
	var offset = [maxThickness-min[0],maxThickness-min[1],maxThickness-min[2]];
	// don't move things if we don't have to - i.e. only use offset to stop negative coodrs
	if (offset[0]<0) offset[0] = 0;
	if (offset[1]<0) offset[1] = 0;
	if (offset[2]<0) offset[2] = 0;
	
    var axis;
    for (axis=0; axis<3; axis++) {
        if (!printArea[axis].length) continue;
        printArea[axis][0] -= offset[axis];
        printArea[axis][1] -= offset[axis];
    }
    
   	var endpointLookup = new pointLookup(maxThickness,true);
	for (count=0; count<numMembers; count++) {
		endpointLookup.add(this.members[count].start);
		endpointLookup.add(this.members[count].end);
	}
	
	for (count=0; count<numMembers; count++) {

        if (this.members[count].outsidePrintArea(printArea,offset)) continue;	
		var member = new frame();
		var length = this.members[count].length();
		var thickness = this.members[count].thickness;

		var startCap = disc1;
		var endCap = disc2;

		if (endpointLookup.count(this.members[count].start)<5) {
			startCap = dome1;
			// Add a load of bogus point counts so to this point so that any future sticks meeting here won't have caps put on them
			endpointLookup.add(this.members[count].start,100);
		}
		if (endpointLookup.count(this.members[count].end)<5) {
			endCap = dome2;
			endpointLookup.add(this.members[count].end,100);
		}

		if (thickness != 1 ) {
			startCap = startCap.scale([thickness,thickness,thickness]);
			endCap = endCap.scale([thickness,thickness,thickness]);
		}
		endCap = endCap.translate([length,0,0]);
		
		member.start = [0,0,0];
		member.end = [length,0,0];

		for( i=0; i<resolution; i++ ) {
			var pointStep = startCap.members.length / resolution;
			var pointOffset = i * pointStep;
			var nextPointOffset = ((i+1) % resolution) * pointStep;
			
			member.add( new stick(startCap.members[pointOffset].start																,nullPoint));
			member.add( new stick([length,startCap.members[nextPointOffset].start[1],startCap.members[nextPointOffset].start[2]]	,nullPoint));
			member.add( new stick(startCap.members[nextPointOffset].start															,nullPoint));

			member.add( new stick(startCap.members[pointOffset].start																,nullPoint));
			member.add( new stick([length,startCap.members[pointOffset].start[1],startCap.members[pointOffset].start[2]]			,nullPoint));
			member.add( new stick([length,startCap.members[nextPointOffset].start[1],startCap.members[nextPointOffset].start[2]]	,nullPoint));

		}

		member.add(startCap);
		member.add(endCap);
		
		member = member.layAlongLine(this.members[count]);
		
		member._writeStl(stlFile,offset);
		
		// if (count % 1000 == 0) console.log(count);
	}

}

function stlFile(filename) {
	this.fd = fs.openSync(filename,'w');
	this.numFacets = 0;
	this.buffer = new Buffer( 50 );
	this.vertices = [];
	this._writeHeader()
}

stlFile.prototype.render = function( framework, radius, resolution, printArea ) {
	return framework.renderStl( this, radius, resolution, printArea );
}

stlFile.prototype._writeHeader = function( )  {
	for( var i=0; i<84; i++ ) {
		this.buffer.writeUInt8(1, 0);
		fs.writeSync(this.fd,this.buffer,0,1);
	}
}

stlFile.prototype._writeVertex = function( vertex )  {
	this.vertices.push( vertex );
	if (this.vertices.length==3) {
		this._writeFacet(this.vertices);
		this.vertices=[];
	}
}

stlFile.prototype._writeFacet = function( vertices )  {
	// put the normal on the front
	vertices.unshift([0,0,0]);
	var offset=0;
	for( var vertexCount=0; vertexCount<4; vertexCount++ ) {
		for( var coordCount=0; coordCount<3; coordCount++ ) {
			if (Math.round(vertices[vertexCount][coordCount],9)<0) {
				console.log('Negative point encountered:',vertices[vertexCount][coordCount]);
				return;
			}
			// if the coordinate is false but not zero then something dodgey is going on
			if (!vertices[vertexCount][coordCount] && vertices[vertexCount][coordCount]!=0) {
				console.log('Inavlid coordinate for axis '+coordCount+' in vertex:'+this.numFacets,vertices[vertexCount][coordCount]);
				return;
			}
		}
	}

	this.numFacets++;
	this.buffer.writeFloatLE(0,0);
	for( var vertexCount=0; vertexCount<4; vertexCount++ ) {
		for( var coordCount=0; coordCount<3; coordCount++ ) {	
			this.buffer.writeFloatLE(vertices[vertexCount][coordCount],offset);
			offset+=4;
		}
	}
	this.buffer.writeUInt16LE(0,offset);
	fs.writeSync(this.fd,this.buffer,0,50);
}

stlFile.prototype.close = function( )  {
	//this.buffer.writeUInt32LE(500,0);
	this.buffer.writeUInt32LE(this.numFacets,0);
	fs.writeSync(this.fd,this.buffer,0,4,80);
}


exports.stlFile = stlFile;
exports.framework = frame;
exports.stick = stick;

