class BoxDrawer {
	constructor()
	{
		// Compile the shader program
		this.prog = InitShaderProgram( boxVS, boxFS );
		
		// Get the ids of the uniform variables in the shaders
		this.mvp = gl.getUniformLocation( this.prog, 'mvp' );
		
		// Get the ids of the vertex attributes in the shaders
		this.vertPos = gl.getAttribLocation( this.prog, 'pos' );
		
		// Create the buffer objects
		
		this.vertbuffer = gl.createBuffer();
		var pos = [
			-1, -1, -1,
			-1, -1,  1,
			-1,  1, -1,
			-1,  1,  1,
			 1, -1, -1,
			 1, -1,  1,
			 1,  1, -1,
			 1,  1,  1 ];
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);

		this.linebuffer = gl.createBuffer();
		var line = [
			0,1,   1,3,   3,2,   2,0,
			4,5,   5,7,   7,6,   6,4,
			0,4,   1,5,   3,7,   2,6 ];
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.linebuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(line), gl.STATIC_DRAW);
	}
	draw( trans )
	{
		// Draw the line segments
		gl.useProgram( this.prog );
		gl.uniformMatrix4fv( this.mvp, false, trans );
		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertbuffer );
		gl.vertexAttribPointer( this.vertPos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.vertPos );
		gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.linebuffer );
		gl.drawElements( gl.LINES, 24, gl.UNSIGNED_BYTE, 0 );
	}
}


/**
 * 
 * 
 * 
 * 
 * 
 * 
 */

class LightView
{
	constructor()
	{
		this.canvas = document.getElementById("lightcontrol");
		this.canvas.oncontextmenu = function() {return false;};
		this.gl = this.canvas.getContext("webgl", {antialias: false, depth: true});	// Initialize the GL context
		if (!this.gl) {
			alert("Unable to initialize WebGL. Your browser or machine may not support it.");
			return;
		}
		
		// Initialize settings
		this.gl.clearColor(0.33,0.33,0.33,0);
		this.gl.enable(gl.DEPTH_TEST);
		
		this.rotX = 0;
		this.rotY = 0;
		this.posZ = 5;
		
		this.resCircle = 32;
		this.resArrow = 16;
		this.buffer = this.gl.createBuffer();
		var data = [];
		for ( var i=0; i<=this.resCircle; ++i ) {
			var a = 2 * Math.PI * i / this.resCircle;
			var x = Math.cos(a);
			var y = Math.sin(a);
			data.push( x * .9 );
			data.push( y * .9 );
			data.push( 0 );
			data.push( x );
			data.push( y );
			data.push( 0 );
		}
		for ( var i=0; i<=this.resCircle; ++i ) {
			var a = 2 * Math.PI * i / this.resCircle;
			var x = Math.cos(a);
			var y = Math.sin(a);
			data.push( x );
			data.push( y );
			data.push( -.05 );
			data.push( x );
			data.push( y );
			data.push( 0.05 );
		}
		for ( var i=0; i<=this.resArrow; ++i ) {
			var a = 2 * Math.PI * i / this.resArrow;
			var x = Math.cos(a) * .07;
			var y = Math.sin(a) * .07;
			data.push( x );
			data.push( y );
			data.push( -1 );
			data.push( x );
			data.push( y );
			data.push( 0 );
		}
		data.push( 0 );
		data.push( 0 );
		data.push( -1.2 );
		for ( var i=0; i<=this.resArrow; ++i ) {
			var a = 2 * Math.PI * i / this.resArrow;
			var x = Math.cos(a) * .15;
			var y = Math.sin(a) * .15;
			data.push( x );
			data.push( y );
			data.push( -0.9 );
		}
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);
		
		// Set the viewport size
		this.canvas.style.width  = "";
		this.canvas.style.height = "";
		const pixelRatio = window.devicePixelRatio || 1;
		this.canvas.width  = pixelRatio * this.canvas.clientWidth;
		this.canvas.height = pixelRatio * this.canvas.clientHeight;
		const width  = (this.canvas.width  / pixelRatio);
		const height = (this.canvas.height / pixelRatio);
		this.canvas.style.width  = width  + 'px';
		this.canvas.style.height = height + 'px';
		this.gl.viewport( 0, 0, this.canvas.width, this.canvas.height );
		this.proj = ProjectionMatrix( this.canvas, this.posZ, 30 );
		
		// Compile the shader program
		this.prog = InitShaderProgram( lightViewVS, lightViewFS, this.gl );
		this.mvp = this.gl.getUniformLocation( this.prog, 'mvp' );
		this.clr1 = this.gl.getUniformLocation( this.prog, 'clr1' );
		this.clr2 = this.gl.getUniformLocation( this.prog, 'clr2' );
		this.vertPos = this.gl.getAttribLocation( this.prog, 'pos' );
		
		this.draw();
		this.updateLightDir();
		
		this.canvas.onmousedown = function() {
			var cx = event.clientX;
			var cy = event.clientY;
			lightView.canvas.onmousemove = function() {
				lightView.rotY += (cx - event.clientX)/lightView.canvas.width*5;
				lightView.rotX += (cy - event.clientY)/lightView.canvas.height*5;
				cx = event.clientX;
				cy = event.clientY;
				lightView.draw();
				lightView.updateLightDir();
			}
		}
		this.canvas.onmouseup = this.canvas.onmouseleave = function() {
			lightView.canvas.onmousemove = null;
		}
	}
	
	updateLightDir()
	{
		var cy = Math.cos( this.rotY );
		var sy = Math.sin( this.rotY );
		var cx = Math.cos( this.rotX );
		var sx = Math.sin( this.rotX );
		meshDrawer.setLightDir( -sy, cy*sx, -cy*cx );
		meshDrawer2.setLightDir( -sy, cy*sx, -cy*cx );
		meshDrawer3.setLightDir( -sy, cy*sx, -cy*cx );
		console.log("Light pos: ", this.getLightPosition());
		DrawScene();
	}
	
	draw()
	{
		// Clear the screen and the depth buffer.
		this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT );
		
		this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.buffer );
		this.gl.vertexAttribPointer( this.vertPos, 3, this.gl.FLOAT, false, 0, 0 );
		this.gl.enableVertexAttribArray( this.buffer );

		this.gl.useProgram( this.prog );
		var mvp = MatrixMult( this.proj, [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,this.posZ,1 ] );
		this.gl.uniformMatrix4fv( this.mvp, false, mvp );
		this.gl.uniform3f( this.clr1, 0.6,0.6,0.6 );
		this.gl.uniform3f( this.clr2, 0,0,0 );
		this.gl.drawArrays( this.gl.TRIANGLE_STRIP, 0, this.resCircle*2+2 );

		var mv  = GetModelViewMatrix( 0, 0, this.posZ, this.rotX, this.rotY );
		var mvp = MatrixMult( this.proj, mv );
		this.gl.uniformMatrix4fv( this.mvp, false, mvp );
		this.gl.uniform3f( this.clr1, 1,1,1 );
		this.gl.drawArrays( this.gl.TRIANGLE_STRIP, 0, this.resCircle*2+2 );
		this.gl.drawArrays( this.gl.TRIANGLE_STRIP, this.resCircle*2+2, this.resCircle*2+2 );
		this.gl.uniform3f( this.clr1, 0,0,0 );
		this.gl.uniform3f( this.clr2, 1,1,1 );
		this.gl.drawArrays( this.gl.TRIANGLE_STRIP, this.resCircle*4+4, this.resArrow*2+2 );
		this.gl.drawArrays( this.gl.TRIANGLE_FAN, this.resCircle*4+4 + this.resArrow*2+2, this.resArrow+2 );
	}

	getLightPosition(){

	const r = this.posZ; // distanza della "telecamera" nel view
	const cy = Math.cos(this.rotY);
	const sy = Math.sin(this.rotY);
	const cx = Math.cos(this.rotX);
	const sx = Math.sin(this.rotX);

	// luce posizionata su una sfera attorno all'origine
	const x = -sy * r;
	const y = cy * sx * r;
	const z = -cy * cx * r;

	return [x, y, z];
	}
}

/**
 * 
 * 
 * 
 * 
 * 
 * 
 */

/******************************************************************
 *  SkyBox  –  sfondo cubemap infinitamente lontano
 ******************************************************************/
class SkyBox {
    constructor(gl) {
        this.gl = gl;

        /* --- 1. geometria: un cubo unitario --- */
        const v = new Float32Array([
            -1,-1,-1,  1,-1,-1,  1, 1,-1, -1, 1,-1,   // back  z-
            -1,-1, 1,  1,-1, 1,  1, 1, 1, -1, 1, 1    // front z+
        ]);
        const i = new Uint16Array([
            0,1,2,  0,2,3,   // back
            4,6,5,  4,7,6,   // front
            0,3,7,  0,7,4,   // left
            1,5,6,  1,6,2,   // right
            0,4,5,  0,5,1,   // bottom
            3,2,6,  3,6,7    // top
        ]);
        this.vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);

        this.ebo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, i, gl.STATIC_DRAW);

        /* --- 2. shader molto leggero --- */
        const vsSrc = `
            attribute vec3 pos;
            varying   vec3 vDir;
            uniform   mat3 viewRot;   // sola rotazione della camera
            void main() {
                vDir = viewRot * pos;
                gl_Position = vec4(pos, 1.0);
            }`;
        const fsSrc = `
            precision mediump float;
            varying vec3 vDir;
            uniform samplerCube uSky;
            void main() {
                gl_FragColor = textureCube(uSky, normalize(vDir));
            }`;

        function compile(src, type) {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
                console.error(gl.getShaderInfoLog(s));
            return s;
        }
        const vs = compile(vsSrc, gl.VERTEX_SHADER);
        const fs = compile(fsSrc, gl.FRAGMENT_SHADER);

        this.prog = gl.createProgram();
        gl.attachShader(this.prog, vs);
        gl.attachShader(this.prog, fs);
        gl.linkProgram(this.prog);
        if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS))
            console.error(gl.getProgramInfoLog(this.prog));

        this.posLoc   = gl.getAttribLocation(this.prog, "pos");
        this.viewLoc  = gl.getUniformLocation(this.prog, "viewRot");
        this.texLoc   = gl.getUniformLocation(this.prog, "uSky");

        /* --- 3. texture cubemap vuota (verrà riempita da loadCubemap) --- */
        this.tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.tex);
        // placeholder 1×1 nero per ogni faccia
        for (let f = 0; f < 6; ++f)
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + f, 0,
                          gl.RGBA, 1, 1, 0, gl.RGBA,
                          gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,255]));
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    /* carica 6 immagini – order: +X,-X,+Y,-Y,+Z,-Z */
    loadCubemap(urls) {
        var loaded=0;
		urls.forEach((url, idx) => {
			const img = new Image();
			img.onload = () => {
				gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.tex);
				gl.texImage2D(
					gl.TEXTURE_CUBE_MAP_POSITIVE_X + idx,
					0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img
				);

				if (++loaded === 6) {             // quando arrivano tutte le 6 facce
					gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
					const err = gl.getError();
					console.log("generateMipmap status:", err === gl.NO_ERROR ? "OK" : err);


					/* se NON hai un render-loop già attivo, ridisegna ora */
					if (typeof DrawScene === "function") DrawScene();
				}
			};	
			img.src = url;                        // innesca il download
		});
    }

    /* disegna il cubo senza scrivere depth */
    draw(viewMatrix) {
       
		
        
		gl.disable(gl.CULL_FACE);
		gl.depthMask(false);
		gl.depthFunc(gl.ALWAYS); 

		 gl.useProgram(this.prog);

        /* estrai la parte 3×3 di rotazione (ignora traslazione) */
        const R = new Float32Array([
            viewMatrix[0], viewMatrix[1], viewMatrix[2],
            viewMatrix[4], viewMatrix[5], viewMatrix[6],
            viewMatrix[8], viewMatrix[9], viewMatrix[10]
        ]);
        gl.uniformMatrix3fv(this.viewLoc, false, R);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.enableVertexAttribArray(this.posLoc);
        gl.vertexAttribPointer(this.posLoc, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.tex);
        gl.uniform1i(this.texLoc, 3);

        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
        gl.depthMask(true);
    }
}
