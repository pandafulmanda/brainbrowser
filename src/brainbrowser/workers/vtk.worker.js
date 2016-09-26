/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011
* The Royal Institution for the Advancement of Learning
* McGill University
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
* @author: Tarek Sherif
*/

(function() {
  "use strict";

  var stack;
  var stack_index;

      
  self.addEventListener("message", function(e) {
    var input = e.data;

    var result = parse(input.data, input.options) || {
      error: true,
      error_message: "Error parsing data."
    };

    // var data = {
    //   type: result.type,
    //   vertices: result.vertices,
    //   normals: result.normals,
    //   colors: result.colors,
    //   surface_properties: result.surface_properties,
    //   split: result.split,
    //   error: result.error,
    //   error_message: result.error_message
    // };

    var transfer = [
      result.vertices.buffer,
      result.shapes[0].indices.buffer
    ];

    self.postMessage(result, transfer);
  });
  
  function parse(data) {
    stack = data.trim().split(/\n+/);
    stack_index = 0;
    // stack_index = stack.length - 1;

    // console.info(getFormat())

    // parseASCII();


    // var meta = String.fromCharCode.apply( null, new Uint8Array( data, 0, 250 ) ).split( '\n' );
    // console.info(meta)
    var vertices, indices;
    var counts;
    var vertex_count;
    var face_count;
    var line;
    var i, ci;
    
    var result = {};

    data = data.split("\n");

    // indicates start of vertex data section
    var patPOINTS = /^POINTS[ ]+(\d+)/;

    // indicates start of polygon connectivity section
    var patPOLYGONS = /^POLYGONS[ ]+(\d+)/;

    vertex_count = parseInt(patPOINTS.exec(data[4])[1], 10);
    face_count = parseInt(patPOLYGONS.exec(data[5 + vertex_count])[1], 10);

    vertices = new Float32Array(vertex_count * 3);
    indices = new Uint32Array(face_count * 3);

    for (i = 0; i < vertex_count; i++) {
      line = data[i+5].trim().split(/\s+/);

      ci = i * 3;
      vertices[ci]     = parseFloat(line[0]);
      vertices[ci + 1] = parseFloat(line[1]);
      vertices[ci + 2] = parseFloat(line[2]);
    }
    
    for (i = 0; i < face_count; i++) {
      line = data[i + vertex_count + 6].trim().split(/\s+/);
      
      ci = i * 3;
      indices[ci]     = parseInt(line[1], 10);
      indices[ci + 1] = parseInt(line[2], 10);
      indices[ci + 2] = parseInt(line[3], 10);
    }
    
    result.type = "polygon";
    result.vertices = vertices;
    result.shapes = [
      {
        indices: indices
      }
    ];

    return result;
  }

  function parseASCII(){

    // connectivity of the triangles
    var indices = [];

    // triangles vertices
    var positions = [];

    // red, green, blue colors in the range 0 to 1
    var colors = [];

    // normal vector, one per vertex
    var normals = [];

    var result;

    // pattern for reading vertices, 3 floats or integers
    var pat3Floats = /(\-?\d+\.?[\d\-\+e]*)\s+(\-?\d+\.?[\d\-\+e]*)\s+(\-?\d+\.?[\d\-\+e]*)/g;

    // pattern for connectivity, an integer followed by any number of ints
    // the first integer is the number of polygon nodes
    var patConnectivity = /^(\d+)\s+([\s\d]*)/;

    // indicates start of vertex data section
    var patPOINTS = /^POINTS /;

    // indicates start of polygon connectivity section
    var patPOLYGONS = /^POLYGONS /;

    // indicates start of triangle strips section
    var patTRIANGLE_STRIPS = /^TRIANGLE_STRIPS /;

    // POINT_DATA number_of_values
    var patPOINT_DATA = /^POINT_DATA[ ]+(\d+)/;

    // CELL_DATA number_of_polys
    var patCELL_DATA = /^CELL_DATA[ ]+(\d+)/;

    // Start of color section
    var patCOLOR_SCALARS = /^COLOR_SCALARS[ ]+(\w+)[ ]+3/;

    // NORMALS Normals float
    var patNORMALS = /^NORMALS[ ]+(\w+)[ ]+(\w+)/;

    var inPointsSection = false;
    var inPolygonsSection = false;
    var inTriangleStripSection = false;
    var inPointDataSection = false;
    var inCellDataSection = false;
    var inColorSection = false;
    var inNormalsSection = false;

    for ( var i in stack ) {

      var line = stack[ i ];

      if ( inPointsSection ) {

        // get the vertices
        while ( ( result = pat3Floats.exec( line ) ) !== null ) {

          var x = parseFloat( result[ 1 ] );
          var y = parseFloat( result[ 2 ] );
          var z = parseFloat( result[ 3 ] );
          positions.push( x, y, z );

        }

      } else if ( inPolygonsSection ) {

        if ( ( result = patConnectivity.exec( line ) ) !== null ) {

          // numVertices i0 i1 i2 ...
          var numVertices = parseInt( result[ 1 ] );
          var inds = result[ 2 ].split( /\s+/ );

          if ( numVertices >= 3 ) {

            var i0 = parseInt( inds[ 0 ] );
            var i1, i2;
            var k = 1;
            // split the polygon in numVertices - 2 triangles
            for ( var j = 0; j < numVertices - 2; ++ j ) {

              i1 = parseInt( inds[ k ] );
              i2 = parseInt( inds[ k + 1 ] );
              indices.push( i0, i1, i2 );
              k ++;

            }

          }

        }

      } else if ( inTriangleStripSection ) {

        if ( ( result = patConnectivity.exec( line ) ) !== null ) {

          // numVertices i0 i1 i2 ...
          var numVertices = parseInt( result[ 1 ] );
          var inds = result[ 2 ].split( /\s+/ );

          if ( numVertices >= 3 ) {

            var i0, i1, i2;
            // split the polygon in numVertices - 2 triangles
            for ( var j = 0; j < numVertices - 2; j ++ ) {

              if ( j % 2 === 1 ) {

                i0 = parseInt( inds[ j ] );
                i1 = parseInt( inds[ j + 2 ] );
                i2 = parseInt( inds[ j + 1 ] );
                indices.push( i0, i1, i2 );

              } else {

                i0 = parseInt( inds[ j ] );
                i1 = parseInt( inds[ j + 1 ] );
                i2 = parseInt( inds[ j + 2 ] );
                indices.push( i0, i1, i2 );

              }

            }

          }

        }

      } else if ( inPointDataSection || inCellDataSection ) {

        if ( inColorSection ) {

          // Get the colors

          while ( ( result = pat3Floats.exec( line ) ) !== null ) {

            var r = parseFloat( result[ 1 ] );
            var g = parseFloat( result[ 2 ] );
            var b = parseFloat( result[ 3 ] );
            colors.push( r, g, b );

          }

        } else if ( inNormalsSection ) {

          // Get the normal vectors

          while ( ( result = pat3Floats.exec( line ) ) !== null ) {

            var nx = parseFloat( result[ 1 ] );
            var ny = parseFloat( result[ 2 ] );
            var nz = parseFloat( result[ 3 ] );
            normals.push( nx, ny, nz );

          }

        }

      }

      if ( patPOLYGONS.exec( line ) !== null ) {

        inPolygonsSection = true;
        inPointsSection = false;
        inTriangleStripSection = false;

      } else if ( patPOINTS.exec( line ) !== null ) {
        console.info('POINTS', patPOINTS.exec( line ), 'hello', line)
        inPolygonsSection = false;
        inPointsSection = true;
        inTriangleStripSection = false;

      } else if ( patTRIANGLE_STRIPS.exec( line ) !== null ) {

        inPolygonsSection = false;
        inPointsSection = false;
        inTriangleStripSection = true;

      } else if ( patPOINT_DATA.exec( line ) !== null ) {
        console.info('POINT_DATA', patPOINT_DATA.exec( line ), 'hello', line)
        inPointDataSection = true;
        inPointsSection = false;
        inPolygonsSection = false;
        inTriangleStripSection = false;

      } else if ( patCELL_DATA.exec( line ) !== null ) {

        inCellDataSection = true;
        inPointsSection = false;
        inPolygonsSection = false;
        inTriangleStripSection = false;

      } else if ( patCOLOR_SCALARS.exec( line ) !== null ) {

        inColorSection = true;
        inNormalsSection = false;
        inPointsSection = false;
        inPolygonsSection = false;
        inTriangleStripSection = false;

      } else if ( patNORMALS.exec( line ) !== null ) {

        inNormalsSection = true;
        inColorSection = false;
        inPointsSection = false;
        inPolygonsSection = false;
        inTriangleStripSection = false;

      }

    }

      console.info('indices', indices.length, indices);
      console.info('positions', positions.length, positions);
      console.info('colors', colors.length, colors);
      console.info('normals', normals.length, normals);

    return {
      vertices: positions,
      shapes: {
        indices: indices
      }
    };

  }

  function getFormat(){
    if ( stack[ getIndex(0) ].indexOf( 'xml' ) !== - 1 ) {
      return 'xml';
    } else if ( stack[ getIndex(2) ].includes( 'ASCII' ) ) {
      return 'ASCII';
    } else {
      return 'binary';
    }
  }

  function unshiftStack() {
    return stack[stack_index++];
  }

  function getIndex(index){
    // return stack.length - 1 - index;
    return index;
  }

})();

