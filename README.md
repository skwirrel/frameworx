Frameworx.js
============

Introduction
------------

This module is designed to make it easier to write programs using node.js to generate 3D frameworks. It was built to solve a particular problem - that of generating 3D fractal truss structures to be 3D printed. However I think it might be of use to others so I am releasing it here under the GPL license.

What this module does
---------------------

Allows for the generation of 3D frameworks by placing "sticks" and by copying and manipulating sticks. It provides functions to generate new sticks by specifying start and end points, but also to translate, scale and rotate sticks or groups of sticks. Finally, the resulting framework can be written out to a binary .STL file.

What this module does not do
----------------------------

* This module cannot render anything other than sticks.
* This module doesn't properly calculate the juntion of more than one stick - it simply renders the two sticks one on top of the other. In most cases this doesn't matter as it is resovled by 3D printing / rendering software.
* This module doesn't display any 3D - it just creates .STL files. You will need a program such as [MeshLab](http://meshlab.sourceforge.net/) to visualize the output from the resulting .STL file.

Basic example
-------------

The following code will generate a simple cube frame as shown in the image below

![Output from simple example](examples/output/cube.jpg)

	var frameworx = require('./frameworx.js');

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

	var stlFile = new frameworx.stlFile('output.stl');
	cube.renderStl(stlFile,1,8);
	stlFile.close();

	// Now run command something like this...
	// node cube.js && meshlab output.stl


More examples are available in the examples directory

