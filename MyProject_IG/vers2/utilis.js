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

function createSphere(radius = 1, latBands = 30, longBands = 30) {
	const positions = [];
	const normals = [];
	const texCoords = [];
	const indices = [];

	for (let lat = 0; lat <= latBands; ++lat) {
		const theta = lat * Math.PI / latBands;
		const sinTheta = Math.sin(theta);
		const cosTheta = Math.cos(theta);

		for (let lon = 0; lon <= longBands; ++lon) {
			const phi = lon * 2 * Math.PI / longBands;
			const sinPhi = Math.sin(phi);
			const cosPhi = Math.cos(phi);

			const x = cosPhi * sinTheta;
			const y = cosTheta;
			const z = sinPhi * sinTheta;

			const u = lon / longBands;
			const v = lat / latBands;

			positions.push(radius * x, radius * y, radius * z);
			normals.push(x, y, z);
			texCoords.push(u, v);
		}
	}

	for (let lat = 0; lat < latBands; ++lat) {
		for (let lon = 0; lon < longBands; ++lon) {
			const first = (lat * (longBands + 1)) + lon;
			const second = first + longBands + 1;

			indices.push(first, second, first + 1);
			indices.push(second, second + 1, first + 1);
		}
	}

	return {
		positions: new Float32Array(positions),
		normals: new Float32Array(normals),
		texCoords: new Float32Array(texCoords),
		indices: new Uint16Array(indices),
	};
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
