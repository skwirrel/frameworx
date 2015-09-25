var frameworx = require('..');

var cube = new frameworx.framework();

var sideLength = 10;
var stick = new frameworx.stick([0,0,0],[0,0,sideLength]).translate([-sideLength/2,-sideLength/2,-sideLength/2]);

// Use the basic stick and 2 rotated copies to make a U shape
cube.add(stick);
cube.add(stick.rotateX(90));
cube.add(stick.rotateX(-90));

// Add a rotated copy of the U shape
cube.add(cube.rotateZ(90));
// Add a rotated copy of everything we have so far - this gives us a ring of 4 U shapes - i.e. a cube
cube.add(cube.rotateZ(180));

truss = new frameworx.framework();

var trussLength = 10;
for( i=0; i<trussLength; i++ ) {
	truss.add(cube.translateX(i*sideLength));
}

truss.deduplicate();
truss.start = [0,0,0];
truss.end = [sideLength*(trussLength-1),0,0];
truss.showSpine();

// Some examples of different parameters for the twist
// truss.add(truss.twist(180).translateY(sideLength*2));
// truss.add(truss.twist(180,0.1).translateY(sideLength*2));
// truss.add(truss.twist(720).translateY(sideLength*2));

// Some examples of different parameters for the bend
// truss.add(truss.bend(180).translateY(sideLength*2));
// truss.add(truss.bend(180,0.1).translateY(sideLength*2));
// truss.add(truss.bend(360,0.1));
truss.add(truss.bend(360,0.1));



var stlFile = new frameworx.stlFile('output/bentCubicTruss.stl');
truss.renderStl(stlFile,1,8);
stlFile.close();

// Now run command something like this...
// node cube.js && ( cd output && meshlab bentCubicTuss.stl )
// N.B. There seems to be a bug in meshlab on some Linux distros where "meshlab output/bentCubicTuss.stl" fails but "meshlab bentCubicTuss.stl" works - hence use of cd above
