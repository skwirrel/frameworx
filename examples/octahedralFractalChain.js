/*

    Octahedral Fractal Chain Generator - demonstrating use of Frameworx module (https://www.github.com/skwirrel/frameworx/)
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

*/

// ========== CONFIGURATION ==========

// This variable determines how deep the subdivision goes and how long the members are at each level
// The complexity goes up exponentially with the number of levels
//    any more than 3 levels is likely to take a long time and fail due to lack of RAM
var levels = [7,7];
//Other options are...
// var levels = [1]; // The fundamental building block
// var levels = [6]; // A non-fractal version of the chain
// var levels = [6,6,1]; // A cube made of fractal chains

// This is the file which the resulting stl data is written to
// This file will be silently overwritten if it already exists
var outputFilename =  'octahedralFractalChain.stl';

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

var root2 = Math.pow(2,0.5);
var trussLength = stickLength;

var stick = new frameworx.stick([0,0,0],[trussLength,0,0]);

for ( var i = 0; i<levels.length; i++ ) {

	// Create the basic building block of the chain (an octahedron in this case)

	var diagonal = Math.pow(Math.pow(trussLength,2)*2,0.5);

	var cube = new frameworx.framework();
	stick = stick.rotateZ(Math.acos((diagonal/2)/trussLength)/(2*Math.PI)*360);
	cube.add(stick);
	cube.add(stick.rotateX(90));
	cube.add(stick.rotateX(180));
	cube.add(stick.rotateX(270));
	cube.add(stick.rotateY(-90).translate([diagonal/2,0,diagonal/2]));
	cube.add(stick.rotateY(90).translate([diagonal/2,-diagonal/2,0]));
	cube.add(cube.rotateY(180).translate([diagonal,0,0]));

	chain = new frameworx.framework();

	// Copy the basic building block along
	var iterations = levels[i];

	for( var j=0; j<iterations; j++) {
		chain.add(cube.translate(diagonal/2*j,0,0).rotateX(j*45));
	}

	trussLength = diagonal/2 * (iterations + 1);

	// Replace the stick with the entire chain - ready to go round again
	stick = chain.rotateX(45);

	console.log('Finished iteration: ',i+1);
}

// Merge nearby points 
// If the proximity is set too close to stickLength then there is a risk that the ends of individual sticks will be merged onto each other
console.log('Merging points');
chain.mergePoints(stickLength/2);
console.log('Merging sticks');
chain.mergeSticks(stickLength/2,1);

// Write the data out to the stl file
var stlFile = new frameworx.stlFile(outputFilename);
console.log('Writing geometry data to ',outputFilename);
stlFile.render(stick,stickRadius,stickResolution);
stlFile.close();

// Now run command something like this...
// node octahedralFractalChain.js && meshlab octahedralFractalChain.stl
