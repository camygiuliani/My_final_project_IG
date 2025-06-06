function make_homo_matrix( s,tx,ty,tz )
{
    var t = [ 
                s, 0, 0, 0,
                0, s, 0, 0,
                0, 0, s, 0,
                tx, ty, tz, 1
                ];

    return t;
}

function makeScaleMatrix(sx, sy, sz) {
  return [
    sx, 0,  0,  0,
    0,  sy, 0,  0,
    0,  0,  sz, 0,
    0,  0,  0,  1
  ];
}

// Multiplies two matrices and returns the result A*B.
// The arguments A and B are arrays, representing column-major matrices.
function MatrixMult( A, B )
{
	var C = [];
	for ( var i=0; i<4; ++i ) {
		for ( var j=0; j<4; ++j ) {
			var v = 0;
			for ( var k=0; k<4; ++k ) {
				v += A[j+4*k] * B[k+4*i];
			}
			C.push(v);
		}
	}
	return C;
}

// Salva i valori iniziali in variabili dedicate
const initial_rotX = 0;
const initial_rotY = 0;
const initial_transZ = 3;
const initial_autorot = 0;

function resetCamera() {
  rotX = initial_rotX;
  rotY = initial_rotY;
  transZ = initial_transZ;
  autorot = initial_autorot;

  UpdateProjectionMatrix();
  DrawScene();
}


