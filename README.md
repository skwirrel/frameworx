Frameworx.js
============

Introduction
------------

This module is designed to make it easier to write programs using node.js to generate 3D frameworks. It was built to solve a particular problem - that of generating 3D fractal truss structures to be 3D printed. However I think it might be of use to others so I am releasing it here under the GPL license.

What this module does
---------------------

This module allows for the generation of 3D frameworks by placing "sticks" and by copying and manipulating them. It provides functions to generate new sticks by specifying start and end points, but also to translate, scale and rotate sticks or groups of sticks (frameworks). Finally, the resulting framework can be written out to a binary .STL file.

What this module does not do
----------------------------

* This module cannot create any shape other than a framework of sticks.
* This module doesn't properly calculate the juntion of more than one stick - it simply renders the two sticks one on top of the other. In most cases this doesn't matter as it is resovled by 3D printing / rendering software. This is deliberate becuase computing the intersections properly is hard work, would make the rendering much slower and would significantly increase the complexity (and thus size) of the final model.
* This module doesn't display any 3D - it just creates .STL files. You will need a program such as [MeshLab](http://meshlab.sourceforge.net/) to visualize the output from the resulting .STL file.

Get in touch
------------

If you find this module useful please do drop me a line so that I can demonstrate to my wife that I'm not wasting my time!

I have written this module principally to enable me to design and print fractal trusses with a view to investigating their structural properties. If you are involved with projects which have access to 3D printers, stress testing equipment or structural analysis tools I would be happy to make any improvements or changes you require in return for help printing or otherwise investigating fractal truss designs.

Please also let get in touch if you would like to help improve or develop this module.

![Output from simple example](https://raw.githubusercontent.com/skwirrel/frameworx/master/authors.png)

License
---------

    Copyright (C) 2014 Ben Jefferson

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

Examples
--------

### examples/cube.js ###

The following code will generate a simple cube frame as shown in the image below

![Output from simple example](https://raw.githubusercontent.com/skwirrel/frameworx/master/examples/output/cube.jpg)

	var frameworx = require('frameworx');

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

	// Create a new .STL to write the framework out to
	var stlFile = new frameworx.stlFile('cube.stl');
	
	// Actually write the framework to the .STL file
	// All sticks will be 1mm in diameter and have 8 sides
	cube.renderStl(stlFile,1,8);
	
	// Close off the .STL file
	stlFile.close();

	// Now run command something like this...
	// node cube.js && meshlab cube.stl

### examples/cubicFractalTruss.js ###

Here is a more complex example to draw a cubic fractal truss. The mergeSticks routine is especially helpful here as the final shape ends up having lots of short colinear sticks.

![Cubic fractal truss](https://raw.githubusercontent.com/skwirrel/frameworx/master/examples/output/cubicFractalTruss.jpg)

	// ========== CONFIGURATION ==========

	// This variable determines how deep the subdivision goes and how long the members are at each level
	// The complexity goes up exponentially with the number of levels
	//    any more than 3 levels is likely to take a long time and fail due to lack of RAM
	var levels = [4,4,5];
	//Other options are...
	// var levels = [1]; // The fundamental building block
	// var levels = [5]; // A non-fractal version of the truss
	// var levels = [5,5,1]; // A cube made of fractal trusses

	// This is the file which the resulting stl data is written to
	// This file will be silently overwritten if it already exists
	var outputFilename =  'squareFractalTruss.stl';

	// This is the length of the side for the fundamental building block (a cube in this case) at the deepest level
	var stickLength = 4;

	// This is the radius of the sticks used to build the truss
	var stickRadius = 0.4;

	// This is the number of sides that the sticks are drawn with
	// More sides gives more round-looking sticks but larger file size
	var stickResolution = 8;

	// ====== END OF CONFIGURATION =======


	// If you move this file out of the distribution directory you will need to replace the next line with...
	// var frameworx = require('frameworx');
	var frameworx = require('..');

	var stick = new frameworx.stick([0,0,0],[stickLength,0,0]);

	var trussLength = stickLength;

	for ( var i = 0; i<levels.length; i++ ) {

		// Create the basic building block of the truss (a cube in this case)
		var cube = new frameworx.framework();
		var edges = new frameworx.framework();
		stick = stick.translate([-trussLength/2,trussLength/2,trussLength/2]);
		edges.add(stick);
		edges.add(stick.rotateX(90));
		edges.add(stick.rotateX(180));
		edges.add(stick.rotateX(270));
		cube.add(edges);
		cube.add(edges.rotateZ(90));
		cube.add(edges.rotateY(90));
		
		truss = new frameworx.framework();

		// Copy the basic building block along
		var iterations = levels[i];
		for( var j=0; j<iterations; j++) {
			truss.add(cube.translate(trussLength*j,0,0));
		}

		trussLength = trussLength * (iterations-1);

		// Replace the stick with the entire truss - ready to go round again
		stick = truss;

		console.log('Finished iteration: ',i+1);
	}

	// Merge nearby points - not very important in this particular instance but good practice before calling mergeSticks
	// If the proximity is set too close to stickLength then there is a risk that the ends of individual sticks will be merged onto each other
	console.log('Merging points');
	stick.mergePoints(stickLength/2);
	console.log('Merging sticks');
	stick.mergeSticks(stickLength/2,0.1);

	// Write the data out to the stl file
	var stlFile = new frameworx.stlFile(outputFilename);
	console.log('Writing geometry data to ',outputFilename);
	stlFile.render(stick,stickRadius,stickResolution);
	stlFile.close();

	// Now run command something like this...
	// node squareFractalTruss.js && meshlab squareFractalTruss.stl


### examples/cubicFractalChain.js ###

![Output from simple example](https://raw.githubusercontent.com/skwirrel/frameworx/master/examples/output/cubicFractalChain.jpg)

The code to generate this is very similar to that used to generate the cubic fractal truss and so is not included here. The code can be found in the examples directory.

### examples/octahedralFractalChain.js ###

![Output from simple example](https://raw.githubusercontent.com/skwirrel/frameworx/master/examples/output/octahedralFractalChain.jpg)

Once again the code required to generate this can be found in the examples directory.

Objects
=======

stlFile(filename)
-----------------

This creates an .STL file for writing a framework out to. The file is created as soon as this stlFile object is instantiated. Things to note:

* Any existing file with the same name will be removed.
* More than one framework can be written to a single stlFile.
* You must close the stl file by calling the .close() method when you are finished with it.

#### example ####

	var frameworx = require('frameworx');

	... code to generate some frameworks ...
	
	var stlFile = new frameworx.stlFile('output.stl');
	framework1.renderStl(stlFile);
	framework2.renderStl(stlFile);
	
	stlFile.close();

### stlFile.render( framework, radius, resolution, printVolume ) ####

This is the corollary of framework.renderStl() (see below). Calling stlFile.render(framework) and framework.renderStl(stlFile) will have exactly the same result.

#### example ####

	var frameworx = require('frameworx');

	... code to generate some frameworks ...
	
	var stlFile = new frameworx.stlFile('output.stl');
	stlFile.render(framework1);
	stlFile.render(framework2);
	
	stlFile.close();


stick(start, end, [thickness=1])
--------------------------------

This creates a single new stick. The start and end are specified as three element arrays defining X,Y and Z coordinate in Cartesian space. The thickness specified is multiplied by the radius provided when the whole framework is finally written to the .STL file (see framework.renderStl()).

Sticks can't be sent to an STL file on their own - they must be added to a framework. 
Sticks have translate, rotate and scale methods which are identical to frameworks as detailed below.

#### example ####

	var frameworx = require('frameworx');

	var theFrame = new frameworx.framework();

	// ================ CREATE THE STICK ================ //
	var theStick = new frameworx.stick([0,0,0],[10,10,10]);
	// ================================================== //
	
	theFrame.add(theStick);

	var stlFile = new frameworx.stlFile('output.stl');
	
	theFrame.renderStl(stlFile,1,8);
	
	// Close off the .STL file
	stlFile.close();

### stick.length() ###

Returns the length of the stick.

#### example ####

	var frameworx = require('frameworx');

	var theStick = new frameworx.stick([0,0,0],[10,10,10]);

	// The following outputs 17.320508075688775 i.e. the square root of 300
	console.log( theStick.length() );
	
### stick.translate() ###

Same as framework.translate() - see below.
 
### stick.rotateX() ###

Same as framework.rotateX() - see below.

### stick.rotateY() ###

Same as framework.rotateY() - see below.

### stick.rotateZ() ###

Same as framework.rotateZ() - see below.

### stick.scale() ###

Same as framework.scale() - see below.


framework()
-----------

A framework is a collection of sticks which can be manipulated as a single entity.

### framework.add( stick ) ###
### framework.add( framework ) ###

You can add either individual sticks or whole frameworks to a framework. All of the examples below involve a call to framework.add().

### framework.copy( ) ###

This returns a copy of the framework - in fact all it does internally is call translate (see below) with a zero offset.

### framework.translate( offset ) ###
### framework.translate( offsetX, offsetY, offsetZ ) ###

This moves all the emelements by the offset specified. Offset can be specified either as three separate arguments or as a single three-element array specifying x, y and z offsets. The original framework remains unchanged. The new translated framework is returned.

#### example ####

	var frameworx = require('frameworx');

	var theFrame = new frameworx.framework();

	var theStick = new frameworx.stick([0,0,0],[10,10,10]);

	// ================== TRANSLATE THE STICK ================== //
	theStick = theStick.translate( 10,10,10 );
	// theStick will now starts at [10,10,10] and ends at [20,20,20]
	
	theFrame.add(theStick);

	// ================== TRANSLATE THE FRAME ================== //
	// This time we pass the offset as array
	theFrame = theFrame.translate( [10,10,10] );
	// theFrame now contains one stick stretching from [30,30,30] to [40,40,40]
	
	var stlFile = new frameworx.stlFile('output.stl');
	
	theFrame.renderStl(stlFile,1,8);
	
	// Close off the .STL file
	stlFile.close();

 
### framework.rotateX( degrees ) ###

Rotate the framework around the X axis by the specified number of degrees. The original framework remains unchanged. The new translated framework is returned.

#### example ####

	var frameworx = require('frameworx');

	var theFrame = new frameworx.framework();

	var theStick = new frameworx.stick([0,0,0],[0,10,0]);

	// ================== ROTATE THE STICK ================== //
	// Before rotation theStick points along the Y axis
	theStick = theStick.rotateX( 90 );
	// theStick will now lie on the Z axis
		
	theFrame.add(theStick);

	// ================== ROTATE THE FRAME ================== //
	// Rotate the framework - this is a bit pointless since it just rotates the stick back where it was
	theFrame = theFrame.rotateX( -90 );
	// theFrame now contains one stick stretching from [0,0,0] to [0,10,0]
	
	var stlFile = new frameworx.stlFile('output.stl');
	
	theFrame.renderStl(stlFile,1,8);
	
	// Close off the .STL file
	stlFile.close();


### framework.rotateY() ###

Same as framework.rotateX but just rotates around the Y axis


### framework.rotateZ() ###

Same as framework.rotateX but just rotates around the Z axis


### framework.scale( factor ) ###
### framework.scale( xFactor, yFactor, zFactor ) ###
### framework.scale( [xFactor, yFactor, zFactor] ) ###

Scale's the framework out from the origin (0,0,0) i.e multiplies the x,y and z coordinates by the resepctive factor. If just a single number is passed then x, y and z coordinates are all scaled by the same amount. The original framework remains unchanged. The new translated framework is returned.

**Don't forget that to keep the shape the same in any given dimension you should use a scale factor of 1 not 0.** If any of the scale factors are zero this will flatten the shape onto one of the axis. If 2 are zero you will just flatten everything down to a line and if all three are zero you will just end up with a dot at the origin.

#### example ####

	var frameworx = require('frameworx');

	var theFrame = new frameworx.framework();

	var theStick = new frameworx.stick([0,0,0],[1,1,1]);

	// ================== SCALE THE STICK ================== //
	theStick = theStick.scale( 10 );
	// theStick will now lie from [0,0,0] to [10,10,10]
		
	theFrame.add(theStick);

	// ================== SCALE THE FRAME ================== //
	// This time we will scale different axis by different amounts
	theFrame = theFrame.scale( [ 1, 2, 3 ] );
	// theFrame now contains one stick stretching from [0,0,0] to [10,20,30]
	
	var stlFile = new frameworx.stlFile('output.stl');
	
	theFrame.renderStl(stlFile,1,8);
	
	// Close off the .STL file
	stlFile.close();

### framework.scaleX( factor ) ###
### framework.scaleY( factor ) ###
### framework.scaleZ( factor ) ###

Similar to framework.scale() above except that the framework is scaled in only one direction - basically this just sets the scale factor for the other 2 axis to 1.


### framework.split( [numSegments=2] ) ###

This splits every stick in the framework into a number of equal length sticks. If numSegments is ommitted then all sticks are split in half (segments=2).

This method can be useful prior to calling framework.mergePoints() to allow sticks to "bend" when points are merged.

**Unlike other method calls, in this case, the original framework IS changed.** This method call returns the object itself (not a new copy of it).

#### example ####

	var frameworx = require('frameworx');

	var theFrame = new frameworx.framework();

	var theStick = new frameworx.stick([0,0,0],[30,30,30]);		

	theFrame.add(theStick);

	// ================== SPLIT THE FRAME ================== //
	theFrame.split( 3 );
	// theFrame now contains 3 stick: one from [0,0,0] to [10,10,10], one from [10,10,10] to [20,20,20] and one from from [20,20,20] to [30,30,30],  
	
	var stlFile = new frameworx.stlFile('output.stl');
	
	theFrame.renderStl(stlFile,1,8);
	
	// Close off the .STL file
	stlFile.close();


### framework.mergePoints( proximity ) ###

This analyzes the framework and moves stick ends which are close, but not on top of each other, so that they end up on top of each other. This can be used to tidy up a framework which has been generated programatically but looks messy because there are lines which almost meet but don't quite.

The proximity parameter defines how close points have to be before they are merged. When merging takes place, all points which are close to each other are moved to the average location of all the nearby points.

**Unlike other method calls, in this case, the original framework IS changed.** This method call returns the object itself (not a new copy of it).

#### example ####

	var frameworx = require('frameworx');

	var theFrame = new frameworx.framework();

	var theStick = new frameworx.stick([0,0,0],[10,10,10]);		

	theFrame.add(theStick);
	// add a translated copy of the stick such that the ends don't quite match
	theFrame.add(theStick.translate(12,12,12));

	// ================== MERGE NEARBY POINTS ================== //
	// Don't forget that distance is on the diagonal
	// so in this case we need to set the proximity to at least the square root of 6
	theFrame.mergePoints( 3 );
	// theFrame now contains 2 sticks: one from [0,0,0] to [11,11,11] and one from [11,11,11] to [22,22,22]

	var stlFile = new frameworx.stlFile('output.stl');
	
	theFrame.renderStl(stlFile,1,8);
	
	// Close off the .STL file
	stlFile.close();


### framework.mergeSticks( proximity, [tolerance=0.1], [repeat=2] ) ###

This method analyzes the framework and looks for short sticks which are joined end on end which can be merged into a single longer stick. This is the opposite of framework.split(). For some shapes generate programmatically this can dramatically reduce the number of triangles in the resulting .STL file.

This method should really be called after mergePoints() has been called. The proximity parameter defines how close the ends of sticks need to be to be considered to be touching. The tolerance parameter is an angular tolerance expressed in degrees - if two sticks are less than this many degrees away from being colinear then they are merged. If there are more than 2 sticks in a line then the process used may not join all of the elements on the first pass - the repeat count defines how many times the process is run to look for sticks to merge.

#### example ####

	var frameworx = require('frameworx');

	var theFrame = new frameworx.framework();

	var theStick = new frameworx.stick([0,0,0],[10,10,10]);		

	theFrame.add(theStick);
	// add a translated copy of the stick
	theFrame.add(theStick.translate(10.1,10,10));
	// and another on
	theFrame.add(theStick.translate(20,20.1,20));

	// ================== MERGE STICKS ================== //
	// Start by merging points
	theFrame.mergePoints( 1 );
	// Then merge the sticks
	theFrame.mergeSticks( 1 );
	// theFrame now contains just 1 stick from [0,0,0] to [20,20.1,20]

	var stlFile = new frameworx.stlFile('output.stl');
	
	theFrame.renderStl(stlFile,1,8);
	
	// Close off the .STL file
	stlFile.close();

### framework.renderStl( stlFile, [stickRadius=0.5], [resolution=8], [printVolume] ) ###

This method writes the framework to the stlFile. In this process each stick (which up to this point have just been pure lines without thickness) is replaced by a cylinder with rounded ends. As mentioned above, no attempt is made to compute the union of sticks where they intersect - they are just exported on top of each other. Where more than one stick ends at the same point, to reduce the number of triangles in the final file, only one of the ends is given a rounded top - all other ends that meet at that point are finished with flat disks. This should make no difference to the resulting shape but requires less facets in the final .STL file.

The stlFile parameter should be an instance of an stlFile object (see above). The stick radius defines the radius for sticks when they are rendered - this is multiplied by the thickness of the sticks (if no thickness is specified for a stick then this defaults to 1). STL files do not support curves so the cylinders are actually rendered as prisms - the resolution parameter determines how many sides the prisms have. Higher values for resolution will result is rounder looking sticks but a much larger .STL file with many more facets.

The printVolume parameter allows for the output to be cropped. This should be passed as an array of three min,max pairs i.e. [ [minX,maxX], [minY,maxY], [minZ,maxZ] ] . Any stick for which either end lies outside these bounds is not rendered in the .STL file. If printVolume is ommitted then the entire framework will be rendered.

Multiple frameworks can be written to the same stlFile. STL files cannot contain any negative points so as each framework is rendered, it is checked to see if any of the points are negative. If there are any negative points then the whole framework is translated  . This also takes into account the thickness of the sticks - so even if the start and end coordinates are not negative it might be shifted a bit if the thickness would cause vertices in the resulting cylinder to be negative) .  shifted

#### example ####

	var frameworx = require('frameworx');

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

	// Create a new .STL to write the framework out to
	var stlFile = new frameworx.stlFile('cubes.stl');
	
	// ================== WRITE TO THE STL FILE ================== //
	// N.B. When this first cube is rendered some of its points are negative, so it is translated automatically when it is rendered
	cube.renderStl(stlFile,0.5,4);

	// This second cube actually ends up being pretty much in the same place as the first cube because the first cube was automatically translated
	cube = cube.translate(5,5,5);
	cube.renderStl(stlFile,0.5,4);
	
	cube = cube.translate(5,5,5);
	// The third and fourth cubes don't get translated on rendering becuase the points are all now positive
	cube.renderStl(stlFile,1,4);
	
	cube = cube.translate(5,5,5);
	cube.renderStl(stlFile,1.5,12);
	
	// Close off the .STL file
	stlFile.close();

	// Now run command something like this...
	// node cube.js && meshlab cubes.stl
