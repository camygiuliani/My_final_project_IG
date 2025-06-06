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
		if(meshDrawer && meshDrawer2 &&meshDrawer3){
		this.updateLightDir();
		}
		
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
		if (meshDrawer)  meshDrawer.setLightDir( -sy, cy*sx, -cy*cx );
		if (meshDrawer2) meshDrawer2.setLightDir( -sy, cy*sx, -cy*cx );
		if (meshDrawer3) meshDrawer3.setLightDir( -sy, cy*sx, -cy*cx );

		DrawScene();
	}
	
	draw()
	{
		this.gl.useProgram( this.prog );

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

	getViewMatrix()
	{
		return GetModelViewMatrix(0, 0, this.posZ, this.rotX, this.rotY);
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


/**
 * 
 * 
 * 
 * 
 */
class MeshDrawer3
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// TODO initializations

		//same as previous project
		// swap - in the vertex shader I want the option to apply a rotation matrix which swaps y-axis with z-axis so I use a boolean
		// pos - 3D position of the vertex
		//tc -texture coordinate of the vertex
		//vtc - this is varying because I use it to pass tc to the fragment shader
		//mvp - is the Model-View-Proj matrix used to transform pos
		const VertexShaderText_tea = /* glsl */  `			
			// uniform matrices
			uniform mat4 mvp;
			uniform mat4 mv;
			uniform mat3 normalMV;
			uniform mat4 swap_yz;
			
			attribute vec3 pos;

			attribute vec2 tc;
			varying vec2 v_tc;

			attribute vec3 normal;
			varying vec3 v_normal;

			varying vec3 v_frag_pos;

			//for shadow mapping
			uniform mat4 u_lightMVP;
			varying vec4 v_shadowCoord;


			void main(){

				v_tc = tc;
				v_normal=normalize(normalMV*mat3(swap_yz)*normal);

				v_frag_pos= vec3(mv*swap_yz* vec4(pos,1.0));
				
				v_shadowCoord = u_lightMVP * vec4(pos, 1.0);


				gl_Position = mvp * swap_yz* vec4(pos, 1.0);
			
			}
			` ;
		//vtc- intrerpolated texture coodinates from the vertex shader
		const fragmentShaderText_tea = /* glsl */  `
			precision mediump float;

			uniform bool show;

			//sampler2D-> is a special type inGLSL to represent a 2D texture
			
			uniform sampler2D tex2;
			uniform bool hasTexture;

			varying vec2 v_tc;
			varying vec3 v_normal;
			varying vec3 v_frag_pos;

			//light components

			uniform vec3 light_dir;
			uniform vec3 light_color;
			uniform vec3 specu_color;	
			uniform float light_int;
			uniform float phong_expo;	

			//for shadow mapping
			uniform sampler2D u_shadowMap;
			varying vec4 v_shadowCoord; 


			float shadowCalculation(vec4 shadowCoord) {
				vec3 proj = shadowCoord.xyz / shadowCoord.w;
				proj = proj * 0.5 + 0.5;

				float closestDepth = texture2D(u_shadowMap, proj.xy).r;
				float currentDepth = proj.z;

				float bias = 0.005;  // per evitare acne
				return currentDepth - bias > closestDepth ? 0.3 : 1.0;
			}
 
			

			// I want a Blinn-Phong shading
			
			void main(){
                //      //////////////////////////////////////      /
                //           I want to implement Blinn shading     /
                // /////////////////////////////////////////////////
			    
                //Kd coefficient for diffuse lambertian material
                // before thinking about texture let's put total white color
				vec4 Kd=vec4(1.0);//,0,0,1); 
				
                // in case of texture present and want to show it do:
                
				
				//normalizing input vectors

				vec3 light_dir_n= normalize(light_dir);
				vec3 v_normal_n= normalize(v_normal);
				vec3 viewDir=normalize(-v_frag_pos);   //camera direction

				
				//geometry term
				float cos_theta =  max(0.0,dot(v_normal_n, light_dir_n));   // forzo a 0 se la luce arriva "da  dietro"

                
				
				//"luce diretta"
				vec4 lightning_col=light_int*vec4(light_color,1.0);

				//"luce ambientale"---> we put vec4(0.1,0.1,0.1,1.0) which is a dark grey for darker areas not enlighted
				//vec4 ambient_col= light_int*vec4(0.1,0.1,0.1,1.0);


				if(hasTexture && show ){
					vec4 texcolor = texture2D(tex2,v_tc);
					Kd=texcolor;
				}
				// "luce diffusa totale" =" colore diffuso"+ "luce ambientale"
				vec4 diffuse_lighting=Kd*cos_theta;

				
				


                // vector h
				vec3 h_dir=normalize(light_dir+viewDir);

                //cos angle phi
                float cos_phi=  max(0.0,dot(v_normal_n, h_dir));


				// specular coefficient Ks
				vec4 Ks= vec4(1.0);
				vec4 specu_lighting=Ks*pow(cos_phi,phong_expo);

					
					
				gl_FragColor= 1.0*(diffuse_lighting+ specu_lighting );// +ambient_col ;

					
				float shadow = shadowCalculation(v_shadowCoord);
				vec3 finalColor = vec3(gl_FragColor) * shadow;
				gl_FragColor = vec4(finalColor, 1.0);
 
				

			
			}
			` ;

		
		// creating buffers
		this.virtualS_tea =gl.createShader(gl.VERTEX_SHADER);
		this.fragmentS_tea =gl.createShader(gl.FRAGMENT_SHADER);

		gl.shaderSource(this.virtualS_tea, VertexShaderText_tea);
		gl.shaderSource(this.fragmentS_tea, fragmentShaderText_tea);
		
		gl.compileShader(this.virtualS_tea);
		gl.compileShader(this.fragmentS_tea);

		if(!gl.getShaderParameter(this.virtualS_tea, gl.COMPILE_STATUS)){
			console.error('Error compiling vertex shader', gl.getShaderInfoLog(this.virtualS_tea));
			}
		if(!gl.getShaderParameter(this.fragmentS_tea, gl.COMPILE_STATUS)){
			console.error('Error compiling frag shader', gl.getShaderInfoLog(this.fragmentS_tea));
			}

		this.prog = gl.createProgram();
		gl.attachShader(this.prog, this.virtualS_tea);
		gl.attachShader(this.prog, this.fragmentS_tea);

		gl.linkProgram(this.prog);

		if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
			console.error('ERROR linking program!', gl.getProgramInfoLog(this.prog));
			return;
		}
		gl.validateProgram(this.prog);
		if (!gl.getProgramParameter(this.prog, gl.VALIDATE_STATUS)) {
			console.error('ERROR validating program!', gl.getProgramInfoLog(this.prog));
			return;
		}

		gl.useProgram( this.prog );

		//----- attribute locations getting

		this.posLoc= gl.getAttribLocation(this.prog, 'pos');
		this.tcLoc = gl.getAttribLocation(this.prog, 'tc');
		this.normalLoc= gl.getAttribLocation(this.prog, 'normal');

		//------ uniform locations getting---- vertex shader
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.normalMVLoc= gl.getUniformLocation(this.prog, 'normalMV');
		this.mvLoc= gl.getUniformLocation(this.prog, 'mv');
		this.swap_yzLoc= gl.getUniformLocation(this.prog, 'swap_yz');
		

		//-----fragment shader
		this.showLoc= gl.getUniformLocation(this.prog, 'show');
		this.light_dirLoc= gl.getUniformLocation(this.prog, 'light_dir');
		this.light_colorLoc= gl.getUniformLocation(this.prog, 'light_color');
		this.specu_colorLoc= gl.getUniformLocation(this.prog, 'specu_color');
		this.light_intLoc=gl.getUniformLocation(this.prog, 'light_int');
		this.phong_expoLoc = gl.getUniformLocation(this.prog, 'phong_expo');
		this.hasTexLoc = gl.getUniformLocation(this.prog, 'hasTexture');
		gl.uniform1i(this.hasTexLoc,  0);
		this.shadowMapLoc = gl.getUniformLocation(this.prog, "u_shadowMap");
		this.lightMVPLoc  = gl.getUniformLocation(this.prog, "u_lightMVP");


		

		gl.uniform1i(this.showLoc, 1); // set 'show' a true
		//gl.uniform1i( this.show, 1 ); 
	
		const lightColorLoc = gl.getUniformLocation(this.prog, "light_color");
		gl.uniform3f(lightColorLoc, 1.0, 1.0, 1.0);

		const specuColorLoc = gl.getUniformLocation(this.prog, "specu_color");
		gl.uniform3f(specuColorLoc, 1.0, 1.0, 1.0);

		const lightIntensityLoc = gl.getUniformLocation(this.prog, "light_int");
		gl.uniform1f(lightIntensityLoc, 1.0);


		//gl.uniform1i( this.show, 1 );
				
		

		
		//creating array buffer
		this.TriangleBuf = gl.createBuffer();
		this.TextureBuf = gl.createBuffer();
		this.NormalBuf=gl.createBuffer();

		this.swap_yzMatrix = [
			1,0,0,0,
			0,1,0,0,
			0,0,1,0,
			0,0,0,1
		];

		this.numTriangles=0;

		this.texture2=null;
		


	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		//TODO Update the contents of the vertex buffer objects.
		

		//every vertex has 3 params
		this.numTriangles = vertPos.length / 3;
		
		gl.useProgram(this.prog);
		
		//loading vertex pos in every buffer
		gl.bindBuffer( gl.ARRAY_BUFFER, this.TriangleBuf );
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW );

		//loading textcoord in every buffer 
		gl.bindBuffer( gl.ARRAY_BUFFER, this.TextureBuf );
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW );
	
		//loading vertex normals in the vertex shader
		gl.bindBuffer(gl.ARRAY_BUFFER,this.NormalBuf)
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW );

		
	
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		 // TODO Set the uniform parameter(s) of the vertex shader
		
		//as in the prevoius hmw
		gl.useProgram(this.prog);
		if (swap){
			this.swap_yzMatrix = MatrixMult(
				[
					1,0,0,0,
					0,-1,0,0,
					0,0,1,0,
					0,0,0,1
				],
				[
					1,0,0,0,
					0,Math.cos(Math.PI/2),Math.sin(Math.PI/2),0,
					0,-Math.sin(Math.PI/2),Math.cos(Math.PI/2),0,
					0,0,0,1,
				]
			); 
			/* this.swap_yzMatrix = [1.0, 0.0, 0.0, 0.0,
								0.0, 0.0, -1.0, 0.0,
								0.0, 1.0, 0.0, 0.0,
								0.0, 0.0, 0.0, 1.0]; */
		}else{
			this.swap_yzMatrix = [
				1,0,0,0,
				0,1,0,0,
				0,0,1,0,
				0,0,0,1
			];
		}

		 
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal, lightMVP = null, shadowMap = null )
	{
		// TODO Complete the WebGL initializations before drawing
		gl.useProgram( this.prog );

		


		//----------- setting uniform params

		//passing transformation matrix uMPV
		gl.uniformMatrix4fv( this.mvpLoc, false, matrixMVP );

		// Pass the 4x4 model-view matrix ,to transform the pos in camera space
		gl.uniformMatrix4fv(this.mvLoc, false, matrixMV);


		// Pass the 3x3 normal matrix ,to transform normals in camera space
		gl.uniformMatrix3fv(this.normalMVLoc, false, matrixNormal);

		//setting swap matrix as identity
		gl.uniformMatrix4fv(this.swap_yzLoc, false, this.swap_yzMatrix);


		//----------------setting vertex attributes

		//positions part
		gl.bindBuffer( gl.ARRAY_BUFFER, this.TriangleBuf );
		gl.vertexAttribPointer( this.posLoc, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.posLoc );

		//texcoord part
		gl.bindBuffer( gl.ARRAY_BUFFER, this.TextureBuf);
		gl.vertexAttribPointer( this.tcLoc, 2, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.tcLoc );

		//normals part
		gl.bindBuffer(gl.ARRAY_BUFFER, this.NormalBuf);
		gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.normalLoc);

		if (this.texture4) {
			gl.activeTexture(gl.TEXTURE4);
			gl.bindTexture(gl.TEXTURE_2D, this.texture4);  // la texture della teapot
			gl.uniform1i(this.samplerLoc, 4);
		}
		



		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );


		if (lightMVP && this.lightMVPLoc)
			gl.uniformMatrix4fv(this.lightMVPLoc, false, lightMVP);

		if (shadowMap && this.shadowMapLoc) {
			gl.activeTexture(gl.TEXTURE3);
			gl.bindTexture(gl.TEXTURE_2D, shadowMap);
			gl.uniform1i(this.shadowMapLoc, 3);
		}
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{

		// as in the previous work///
		// TODO Bind the texture
		gl.useProgram(this.prog);

		let hasTexture = img ? 1 : 0;
		gl.uniform1i(this.hasTexLoc, hasTexture);

		this.texture4 = gl.createTexture(); 
		gl.bindTexture(gl.TEXTURE_2D, this.texture4);


		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );

		//now we set the texture params
		gl.generateMipmap(gl.TEXTURE_2D); 

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		
		gl.useProgram(this.prog);
		//I activate the texture slot
		gl.activeTexture(gl.TEXTURE4); 
		//Binding the texture in the tecture slot above
		gl.bindTexture(gl.TEXTURE_2D, this.texture4); 
		//using slot 0 (beacuse I activate texture0)
		
		gl.useProgram(this.prog);

		//taking loaction of 'tex' in the program
		const samplerLoc = gl.getUniformLocation(this.prog, 'tex2'); 
		//specification about which slot is the one to use(0)
		gl.uniform1i(samplerLoc, 4);


		/* this.texture_exist = true;
		gl.uniform1i( this.show, this.checkbox_show && this.texture_exist ) */;
	
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// as in the prevoius work
		// TODO set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
		
		gl.useProgram( this.prog );
		gl.uniform1i( this.showLoc, show);
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		// TODO set the uniform parameter(s) of the fragment shader to specify the light direction.
		gl.useProgram(this.prog);
		gl.uniform3f(this.light_dirLoc,x,y,z);
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		// TODO set the uniform parameter(s) of the fragment shader to specify the shininess.
		gl.useProgram(this.prog);
		gl.uniform1f(this.phong_expoLoc, shininess);
	}
	
	setShadowMap(shadowTex) {
	this.shadowTex = shadowTex;
	}

	setLightMVP(m) {
	this.lightMVP = m;
	}
	
	drawDepth(lightMVP) {
	gl.useProgram(this.prog);

	// Usiamo il MVP della luce
	if (this.lightMVPLoc) {
		gl.uniformMatrix4fv(this.lightMVPLoc, false, lightMVP);
	}

	// Nessuna texture, nessuno shading
	gl.uniform1i(this.hasTexLoc, 0);
	gl.uniform1i(this.showLoc, 0); // evita il colore

	gl.uniformMatrix4fv(this.mvpLoc, false, lightMVP);
	gl.uniformMatrix4fv(this.mvLoc, false, lightMVP);
	gl.uniformMatrix3fv(this.normalMVLoc, false, [1,0,0, 0,1,0, 0,0,1]);
	gl.uniformMatrix4fv(this.swap_yzLoc, false, this.swap_yzMatrix);

	// Attributi (solo pos basta, ma servono anche gli altri se non rimuovi)
	gl.bindBuffer(gl.ARRAY_BUFFER, this.TriangleBuf);
	gl.vertexAttribPointer(this.posLoc, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(this.posLoc);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.TextureBuf);
	gl.vertexAttribPointer(this.tcLoc, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(this.tcLoc);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.NormalBuf);
	gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(this.normalLoc);

	gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}



}

class MeshDrawer1
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// TODO initializations

		//same as previous project
		// swap - in the vertex shader I want the option to apply a rotation matrix which swaps y-axis with z-axis so I use a boolean
		// pos - 3D position of the vertex
		//tc -texture coordinate of the vertex
		//vtc - this is varying because I use it to pass tc to the fragment shader
		//mvp - is the Model-View-Proj matrix used to transform pos
		const VertexShaderText_tea = /* glsl */  `			
			// uniform matrices
			uniform mat4 mvp;
			uniform mat4 mv;
			uniform mat3 normalMV;
			uniform mat4 swap_yz;
			
			attribute vec3 pos;

			attribute vec2 tc;
			varying vec2 v_tc;

			attribute vec3 normal;
			varying vec3 v_normal;

			varying vec3 v_frag_pos;

			//for shadow mapping
			uniform mat4 u_lightMVP;
			varying vec4 v_shadowCoord;


			void main(){

				v_tc = tc;
				v_normal=normalize(normalMV*mat3(swap_yz)*normal);

				v_frag_pos= vec3(mv*swap_yz* vec4(pos,1.0));
				
				v_shadowCoord = u_lightMVP * vec4(pos, 1.0);


				gl_Position = mvp * swap_yz* vec4(pos, 1.0);
			
			}
			` ;
		//vtc- intrerpolated texture coodinates from the vertex shader
		const fragmentShaderText_tea = /* glsl */  `
			precision mediump float;

			uniform bool show;

			//sampler2D-> is a special type inGLSL to represent a 2D texture
			
			uniform sampler2D tex2;
			uniform bool hasTexture;

			varying vec2 v_tc;
			varying vec3 v_normal;
			varying vec3 v_frag_pos;

			//light components

			uniform vec3 light_dir;
			uniform vec3 light_color;
			uniform vec3 specu_color;	
			uniform float light_int;
			uniform float phong_expo;	

			//for shadow mapping
			uniform sampler2D u_shadowMap;
			varying vec4 v_shadowCoord; 


			float shadowCalculation(vec4 shadowCoord) {
				vec3 proj = shadowCoord.xyz / shadowCoord.w;
				proj = proj * 0.5 + 0.5;

				float closestDepth = texture2D(u_shadowMap, proj.xy).r;
				float currentDepth = proj.z;

				float bias = 0.005;  // per evitare acne
				return currentDepth - bias > closestDepth ? 0.3 : 1.0;
			}
 
			

			// I want a Blinn-Phong shading
			
			void main(){
                //      //////////////////////////////////////      /
                //           I want to implement Blinn shading     /
                // /////////////////////////////////////////////////
			    
                //Kd coefficient for diffuse lambertian material
                // before thinking about texture let's put total white color
				vec4 Kd=vec4(1.0);//,0,0,1); 
				
                // in case of texture present and want to show it do:
                
				
				//normalizing input vectors

				vec3 light_dir_n= normalize(light_dir);
				vec3 v_normal_n= normalize(v_normal);
				vec3 viewDir=normalize(-v_frag_pos);   //camera direction

				
				//geometry term
				float cos_theta =  max(0.0,dot(v_normal_n, light_dir_n));   // forzo a 0 se la luce arriva "da  dietro"

                
				
				//"luce diretta"
				vec4 lightning_col=light_int*vec4(light_color,1.0);

				//"luce ambientale"---> we put vec4(0.1,0.1,0.1,1.0) which is a dark grey for darker areas not enlighted
				//vec4 ambient_col= light_int*vec4(0.1,0.1,0.1,1.0);


				if(hasTexture && show ){
					vec4 texcolor = texture2D(tex2,v_tc);
					Kd=texcolor;
				}
				// "luce diffusa totale" =" colore diffuso"+ "luce ambientale"
				vec4 diffuse_lighting=Kd*cos_theta;

				
				


                // vector h
				vec3 h_dir=normalize(light_dir+viewDir);

                //cos angle phi
                float cos_phi=  max(0.0,dot(v_normal_n, h_dir));


				// specular coefficient Ks
				vec4 Ks= vec4(1.0);
				vec4 specu_lighting=Ks*pow(cos_phi,phong_expo);

					
					
				gl_FragColor= 1.0*(diffuse_lighting+ specu_lighting );// +ambient_col ;

					
				float shadow = shadowCalculation(v_shadowCoord);
				vec3 finalColor = vec3(gl_FragColor) * shadow;
				gl_FragColor = vec4(finalColor, 1.0);
 
				

			
			}
			` ;

		
		// creating buffers
		this.virtualS_tea =gl.createShader(gl.VERTEX_SHADER);
		this.fragmentS_tea =gl.createShader(gl.FRAGMENT_SHADER);

		gl.shaderSource(this.virtualS_tea, VertexShaderText_tea);
		gl.shaderSource(this.fragmentS_tea, fragmentShaderText_tea);
		
		gl.compileShader(this.virtualS_tea);
		gl.compileShader(this.fragmentS_tea);

		if(!gl.getShaderParameter(this.virtualS_tea, gl.COMPILE_STATUS)){
			console.error('Error compiling vertex shader', gl.getShaderInfoLog(this.virtualS_tea));
			}
		if(!gl.getShaderParameter(this.fragmentS_tea, gl.COMPILE_STATUS)){
			console.error('Error compiling frag shader', gl.getShaderInfoLog(this.fragmentS_tea));
			}

		this.prog = gl.createProgram();
		gl.attachShader(this.prog, this.virtualS_tea);
		gl.attachShader(this.prog, this.fragmentS_tea);

		gl.linkProgram(this.prog);

		if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
			console.error('ERROR linking program!', gl.getProgramInfoLog(this.prog));
			return;
		}
		gl.validateProgram(this.prog);
		if (!gl.getProgramParameter(this.prog, gl.VALIDATE_STATUS)) {
			console.error('ERROR validating program!', gl.getProgramInfoLog(this.prog));
			return;
		}

		gl.useProgram( this.prog );

		//----- attribute locations getting

		this.posLoc= gl.getAttribLocation(this.prog, 'pos');
		this.tcLoc = gl.getAttribLocation(this.prog, 'tc');
		this.normalLoc= gl.getAttribLocation(this.prog, 'normal');

		//------ uniform locations getting---- vertex shader
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.normalMVLoc= gl.getUniformLocation(this.prog, 'normalMV');
		this.mvLoc= gl.getUniformLocation(this.prog, 'mv');
		this.swap_yzLoc= gl.getUniformLocation(this.prog, 'swap_yz');
		

		//-----fragment shader
		this.showLoc= gl.getUniformLocation(this.prog, 'show');
		this.light_dirLoc= gl.getUniformLocation(this.prog, 'light_dir');
		this.light_colorLoc= gl.getUniformLocation(this.prog, 'light_color');
		this.specu_colorLoc= gl.getUniformLocation(this.prog, 'specu_color');
		this.light_intLoc=gl.getUniformLocation(this.prog, 'light_int');
		this.phong_expoLoc = gl.getUniformLocation(this.prog, 'phong_expo');
		this.hasTexLoc = gl.getUniformLocation(this.prog, 'hasTexture');
		gl.uniform1i(this.hasTexLoc,  0);
		this.shadowMapLoc = gl.getUniformLocation(this.prog, "u_shadowMap");
		this.lightMVPLoc  = gl.getUniformLocation(this.prog, "u_lightMVP");


		

		gl.uniform1i(this.showLoc, 1); // set 'show' a true
		//gl.uniform1i( this.show, 1 ); 
	
		const lightColorLoc = gl.getUniformLocation(this.prog, "light_color");
		gl.uniform3f(lightColorLoc, 1.0, 1.0, 1.0);

		const specuColorLoc = gl.getUniformLocation(this.prog, "specu_color");
		gl.uniform3f(specuColorLoc, 1.0, 1.0, 1.0);

		const lightIntensityLoc = gl.getUniformLocation(this.prog, "light_int");
		gl.uniform1f(lightIntensityLoc, 1.0);


		//gl.uniform1i( this.show, 1 );
				
		

		
		//creating array buffer
		this.TriangleBuf = gl.createBuffer();
		this.TextureBuf = gl.createBuffer();
		this.NormalBuf=gl.createBuffer();

		this.swap_yzMatrix = [
			1,0,0,0,
			0,1,0,0,
			0,0,1,0,
			0,0,0,1
		];

		this.numTriangles=0;

		this.texture2=null;
		


	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		//TODO Update the contents of the vertex buffer objects.
		

		//every vertex has 3 params
		this.numTriangles = vertPos.length / 3;
		
		gl.useProgram(this.prog);
		
		//loading vertex pos in every buffer
		gl.bindBuffer( gl.ARRAY_BUFFER, this.TriangleBuf );
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW );

		//loading textcoord in every buffer 
		gl.bindBuffer( gl.ARRAY_BUFFER, this.TextureBuf );
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW );
	
		//loading vertex normals in the vertex shader
		gl.bindBuffer(gl.ARRAY_BUFFER,this.NormalBuf)
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW );

		
	
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		 // TODO Set the uniform parameter(s) of the vertex shader
		
		//as in the prevoius hmw
		gl.useProgram(this.prog);
		if (swap){
			this.swap_yzMatrix = MatrixMult(
				[
					1,0,0,0,
					0,-1,0,0,
					0,0,1,0,
					0,0,0,1
				],
				[
					1,0,0,0,
					0,Math.cos(Math.PI/2),Math.sin(Math.PI/2),0,
					0,-Math.sin(Math.PI/2),Math.cos(Math.PI/2),0,
					0,0,0,1,
				]
			); 
			/* this.swap_yzMatrix = [1.0, 0.0, 0.0, 0.0,
								0.0, 0.0, -1.0, 0.0,
								0.0, 1.0, 0.0, 0.0,
								0.0, 0.0, 0.0, 1.0]; */
		}else{
			this.swap_yzMatrix = [
				1,0,0,0,
				0,1,0,0,
				0,0,1,0,
				0,0,0,1
			];
		}

		 
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal, lightMVP = null, shadowMap = null )
	{
		// TODO Complete the WebGL initializations before drawing
		gl.useProgram( this.prog );

		


		//----------- setting uniform params

		//passing transformation matrix uMPV
		gl.uniformMatrix4fv( this.mvpLoc, false, matrixMVP );

		// Pass the 4x4 model-view matrix ,to transform the pos in camera space
		gl.uniformMatrix4fv(this.mvLoc, false, matrixMV);


		// Pass the 3x3 normal matrix ,to transform normals in camera space
		gl.uniformMatrix3fv(this.normalMVLoc, false, matrixNormal);

		//setting swap matrix as identity
		gl.uniformMatrix4fv(this.swap_yzLoc, false, this.swap_yzMatrix);


		//----------------setting vertex attributes

		//positions part
		gl.bindBuffer( gl.ARRAY_BUFFER, this.TriangleBuf );
		gl.vertexAttribPointer( this.posLoc, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.posLoc );

		//texcoord part
		gl.bindBuffer( gl.ARRAY_BUFFER, this.TextureBuf);
		gl.vertexAttribPointer( this.tcLoc, 2, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.tcLoc );

		//normals part
		gl.bindBuffer(gl.ARRAY_BUFFER, this.NormalBuf);
		gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.normalLoc);

		if (this.texture5) {
			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, this.texture5);  // la texture della teapot
			gl.uniform1i(this.samplerLoc, 5);
		}
		



		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );


		if (lightMVP && this.lightMVPLoc)
			gl.uniformMatrix4fv(this.lightMVPLoc, false, lightMVP);

		if (shadowMap && this.shadowMapLoc) {
			gl.activeTexture(gl.TEXTURE3);
			gl.bindTexture(gl.TEXTURE_2D, shadowMap);
			gl.uniform1i(this.shadowMapLoc, 3);
		}
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{

		// as in the previous work///
		// TODO Bind the texture
		gl.useProgram(this.prog);

		let hasTexture = img ? 1 : 0;
		gl.uniform1i(this.hasTexLoc, hasTexture);

		this.texture5 = gl.createTexture(); 
		gl.bindTexture(gl.TEXTURE_2D, this.texture5);


		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );

		//now we set the texture params
		gl.generateMipmap(gl.TEXTURE_2D); 

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		
		gl.useProgram(this.prog);
		//I activate the texture slot
		gl.activeTexture(gl.TEXTURE5); 
		//Binding the texture in the tecture slot above
		gl.bindTexture(gl.TEXTURE_2D, this.texture5); 
		//using slot 0 (beacuse I activate texture0)
		
		gl.useProgram(this.prog);

		//taking loaction of 'tex' in the program
		const samplerLoc = gl.getUniformLocation(this.prog, 'tex2'); 
		//specification about which slot is the one to use(0)
		gl.uniform1i(samplerLoc, 5);


		/* this.texture_exist = true;
		gl.uniform1i( this.show, this.checkbox_show && this.texture_exist ) */;
	
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// as in the prevoius work
		// TODO set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
		
		gl.useProgram( this.prog );
		gl.uniform1i( this.showLoc, show);
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		// TODO set the uniform parameter(s) of the fragment shader to specify the light direction.
		gl.useProgram(this.prog);
		gl.uniform3f(this.light_dirLoc,x,y,z);
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		// TODO set the uniform parameter(s) of the fragment shader to specify the shininess.
		gl.useProgram(this.prog);
		gl.uniform1f(this.phong_expoLoc, shininess);
	}
	
	setShadowMap(shadowTex) {
	this.shadowTex = shadowTex;
	}

	setLightMVP(m) {
	this.lightMVP = m;
	}
	
	drawDepth(lightMVP) {
	gl.useProgram(this.prog);

	// Usiamo il MVP della luce
	if (this.lightMVPLoc) {
		gl.uniformMatrix4fv(this.lightMVPLoc, false, lightMVP);
	}

	// Nessuna texture, nessuno shading
	gl.uniform1i(this.hasTexLoc, 0);
	gl.uniform1i(this.showLoc, 0); // evita il colore

	gl.uniformMatrix4fv(this.mvpLoc, false, lightMVP);
	gl.uniformMatrix4fv(this.mvLoc, false, lightMVP);
	gl.uniformMatrix3fv(this.normalMVLoc, false, [1,0,0, 0,1,0, 0,0,1]);
	gl.uniformMatrix4fv(this.swap_yzLoc, false, this.swap_yzMatrix);

	// Attributi (solo pos basta, ma servono anche gli altri se non rimuovi)
	gl.bindBuffer(gl.ARRAY_BUFFER, this.TriangleBuf);
	gl.vertexAttribPointer(this.posLoc, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(this.posLoc);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.TextureBuf);
	gl.vertexAttribPointer(this.tcLoc, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(this.tcLoc);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.NormalBuf);
	gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(this.normalLoc);

	gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}



}


