var frameworx = require('..');

var cube = new frameworx.framework();

var stick = new frameworx.stick([0,0,0],[0,0,10]).translate([-5,-5,-5]);

// Use the basic stick and 2 rotated copies to make a U shape
cube.add(stick);
cube.add(stick.rotateX(90));
cube.add(stick.rotateX(-90));

// Add a rotated copy of the U shape
cube.add(cube.rotateZ(90));
// Add a rotated copy of everything we have so far - this gives us a ring of 4 U shapes - i.e. a cube
cube.add(cube.rotateZ(180));

var stlFile = new frameworx.stlFile('output/cube.stl');
cube.renderStl(stlFile,1,8);
stlFile.close();

// Now run command something like this...
// node cube.js && meshlab output/cube.stl
