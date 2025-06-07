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

function IdentityMatrix() {
    return [
        1, 0, 0, 0,  // colonna 0
        0, 1, 0, 0,  // colonna 1
        0, 0, 1, 0,  // colonna 2
        0, 0, 0, 1   // colonna 3
    ];
}

function transposeMatrix(matrix){
	let output = []; 
	for(let col = 0; col < 4; col++){
		for(let row = 0; row < 4; row++){
			output.push(matrix[col + (row * 4)])
		}
	}
	return output;
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

function program_init(vertex_shader_text , fragment_shader_text)
{
    virtualS = gl.createShader(gl.VERTEX_SHADER);
    fragmentS = gl.createShader(gl.FRAGMENT_SHADER);
            
    gl.shaderSource(virtualS, vertex_shader_text);
    gl.shaderSource(fragmentS, fragment_shader_text);
    
    gl.compileShader(virtualS);
    gl.compileShader(fragmentS);
    
    if(!gl.getShaderParameter(virtualS, gl.COMPILE_STATUS)){
        console.error('Error compiling shader', gl.getShaderInfoLog(virtualS));
        }
    if(!gl.getShaderParameter(fragmentS, gl.COMPILE_STATUS)){
        console.error('Error compiling shader', gl.getShaderInfoLog(fragmentS));
        return;
        }
            
    prog = gl.createProgram();
    gl.attachShader(prog, virtualS);
    gl.attachShader(prog, fragmentS);
    
    gl.linkProgram(prog);        
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error('ERROR linking program!', gl.getProgramInfoLog(this.prog));
        return;
    }

    gl.validateProgram(prog);
    if(!gl.getProgramParameter(prog, gl.VALIDATE_STATUS)) {
        console.error('ERROR validating program!', gl.getProgramInfoLog(this.prog));
    }
    return prog;
}