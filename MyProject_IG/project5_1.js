// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix(translationX, translationY, translationZ, rotationX, rotationY, scale = 1.0)
{
    // Matrice di traslazione (colonna-major)
    const trans = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translationX, translationY, translationZ, 1
    ];

    // Rotazione X
    const cosx = Math.cos(rotationX);
    const sinx = Math.sin(rotationX);
    const Rx = [
        1,    0,     0, 0,
        0, cosx, sinx, 0,
        0, -sinx, cosx, 0,
        0,    0,     0, 1
    ];

    // Rotazione Y
    const cosy = Math.cos(rotationY);
    const siny = Math.sin(rotationY);
    const Ry = [
        cosy, 0, -siny, 0,
          0,  1,     0, 0,
        siny, 0,  cosy, 0,
          0,  0,     0, 1
    ];

    // 🔸 Aggiungiamo una matrice di scala uniforme
    const S = [
        scale,    0,    0, 0,
           0, scale,    0, 0,
           0,    0, scale, 0,
           0,    0,    0, 1
    ];

    // Trasformazione completa: T * R * S (ordine: Scala → Rotazioni → Traslazione)
    var mv = MatrixMult(S, Rx);
    mv = MatrixMult(Rx, Ry);
    mv = MatrixMult(trans, mv);  // traslazione per ultima

    return mv;
}






// [TO-DO] Complete the implementation of the following class.

class MeshDrawerTennis
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
		const VertexShaderText = /* glsl */  `			
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

			void main(){

				v_tc = tc;
				v_normal=normalize(normalMV*mat3(swap_yz)*normal);

				v_frag_pos= vec3(mv*swap_yz* vec4(pos,1.0));

				gl_Position = mvp * swap_yz* vec4(pos, 1.0);
			
			}
			` ;
		//vtc- intrerpolated texture coodinates from the vertex shader
		const fragmentShaderText = /* glsl */  `
			precision mediump float;

			uniform bool show;

			//sampler2D-> is a special type inGLSL to represent a 2D texture
			
			uniform sampler2D tex;
			uniform int hasTex;
			uniform vec4 uColor;  // 0 = usa solo colore, 1 = usa la texture

			varying vec2 v_tc;
			varying vec3 v_normal;
			varying vec3 v_frag_pos;

			//light components

			uniform vec3 light_dir;
			uniform vec3 light_color;
			uniform vec3 specu_color;	
			uniform float light_int;
			uniform float phong_expo;	

			//shadows part 
			uniform bool mix_set;
			uniform bool shadow_set;
			uniform float bias;
			

			// I want a Blinn-Phong shading
			
			void main(){
                //      //////////////////////////////////////      /
                //           I want to implement Blinn shading     /
                // /////////////////////////////////////////////////
			    
                //Kd coefficient for diffuse lambertian material
                // before thinking about texture let's put total white color
				vec4 Kd=vec4(1.0); 
				
                // in case of texture present and want to show it do:
                
				
				//normalizing input vectors

				vec3 light_dir_n= normalize(light_dir);
				vec3 v_normal_n= normalize(v_normal);
				vec3 viewDir=normalize(-v_frag_pos);   //camera direction

				
				//geometry term
				//float cos_theta =  abs(dot(v_normal_n, light_dir_n));   // forzo a 0 se la luce arriva "da  dietro"

                float cos_theta =  dot(v_normal_n, light_dir_n);
				
				//"luce diretta"
				vec4 lightning_col=light_int*vec4(light_color,1.0);

				//"luce ambientale"---> we put vec4(0.1,0.1,0.1,1.0) which is a dark grey for darker areas not enlighted
				vec4 ambient_col= light_int*vec4(0.1,0.1,0.1,1.0);


				/* if(hasTexture && show ){
					vec4 texcolor = texture2D(tex,v_tc);
					Kd=texcolor;
				}
					*/
				  
				Kd = (hasTex == 1) ? texture2D(tex, v_tc) : uColor;

				if(Kd.a<0.2){
					cos_theta=abs(cos_theta);
				}

				cos_theta=max(cos_theta,0.0);
				// "luce diffusa totale" =" colore diffuso"+ "luce ambientale"
				vec4 diffuse_lighting=Kd*cos_theta;

				
				vec4 ambient=vec4(0.001*Kd.rgb,Kd.a);


                // vector h
				vec3 h_dir=normalize(light_dir+viewDir);

                //cos angle phi
                float cos_phi=  max(0.0,dot(v_normal_n, h_dir));


				// specular coefficient Ks
				vec4 Ks= vec4(1.0);
				vec4 specu_lighting=Ks*pow(cos_phi,phong_expo);

					
					
				gl_FragColor= 1.0*(diffuse_lighting+ specu_lighting )+ambient;// +ambient_col ;

					
				
				

			
			}
			` ;

		
		// creating buffers
		this.virtualS=gl.createShader(gl.VERTEX_SHADER);
		this.fragmentS=gl.createShader(gl.FRAGMENT_SHADER);

		gl.shaderSource(this.virtualS, V_ShaderText_main);
		gl.shaderSource(this.fragmentS,F_ShaderText_main);
		
		gl.compileShader(this.virtualS);
		gl.compileShader(this.fragmentS);

		if(!gl.getShaderParameter(this.virtualS, gl.COMPILE_STATUS)){
			console.error('Error compiling shader', gl.getShaderInfoLog(this.virtualS));
			}
		if(!gl.getShaderParameter(this.fragmentS, gl.COMPILE_STATUS)){
			console.error('Error compiling shader', gl.getShaderInfoLog(this.fragmentS));
			}

		this.prog = gl.createProgram();
		gl.attachShader(this.prog, this.virtualS);
		gl.attachShader(this.prog, this.fragmentS);

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
		this.mix_set = gl.getUniformLocation(this.prog, "mix_set");
		this.bias = gl.getUniformLocation(this.prog, 'bias');
		this.shadows_set = gl.getUniformLocation(this.prog, 'shadows_set');
		this.LightP = gl.getUniformLocation(this.prog, 'LightP');
		this.light_set = gl.getUniformLocation(this.prog, 'light_set');




		
		this.hasTexLoc = gl.getUniformLocation(this.prog, 'hasTex');
		gl.uniform1i(this.hasTexLoc,  0);
		
		this.locUseTexture = this.hasTexLoc;
		this.locColor      = gl.getUniformLocation(this.prog, "uColor");
		gl.uniform1i(this.hasTexLoc, 0);          // 0 = usa colore
		gl.uniform4f(this.locColor, 0.8, 0.8, 0.8, 1); // default Kd se non carichi nulla

		

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

		this.texture0=null;

		this.use_shadows=0;
		gl.uniform1i(this.shadows_set, false);
		gl.uniform1i(this.light_set, false);


		






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
	draw( matrixMVP, matrixMV, matrixNormal,plp=null )
	{
		// TODO Complete the WebGL initializations before drawing
		gl.useProgram( this.prog );

		//! Shadows part
		gl.uniform1i(this.shadows_set, this.use_shadows);
		if(this.use_shadows)
            {
                gl.uniform1i(this.depth_sampler, 0);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadow_texture);
            }


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
		
		if (this.texture0) {
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.texture0);  // la texture del campo
			gl.uniform1i(this.samplerLoc, 0);
		}



		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{

		// as in the previous work///
		// TODO Bind the texture
		gl.useProgram(this.prog);

		if (!img) {                     // nessuna immagine -> colore
			gl.uniform1i(this.hasTexLoc, 0);
			DrawScene();
        return;
    	}

		this.texture1 = gl.createTexture(); 
		gl.bindTexture(gl.TEXTURE_2D, this.texture1);


		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img );

		//now we set the texture params
		gl.generateMipmap(gl.TEXTURE_2D); 

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		

		//I activate the texture slot
		gl.activeTexture(gl.TEXTURE1); 
		//Binding the texture in the tecture slot above
		gl.bindTexture(gl.TEXTURE_2D, this.texture1); 
		//using slot 0 (beacuse I activate texture0)
		
		

		//taking loaction of 'tex' in the program
		const samplerLoc = gl.getUniformLocation(this.prog, 'tex'); 
		//specification about which slot is the one to use(0)
		gl.uniform1i(samplerLoc, 1);

		 gl.uniform1i(this.hasTexLoc, 1);   // ← adesso usa la texture
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

	setDiffuseColor(r,g,b,a){
		
		gl.useProgram(this.prog);
		gl.uniform4f(this.locColor, r, g, b, a);
		gl.uniform1i(this.locUseTexture, 0);
		gl.uniform1i(this.hasTexLoc, 0);   // forza uso colore
	}

	 set_shadowmap_bias(b){
        gl.uniform1f(this.bias, b);
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
/* **********************************************************************************************
 * ! MESH DRAWER PER LA TEAPOT
 * 
 * ///////////////////////////////////////////////////////////////////////////////////////// */
class MeshDrawer
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

			void main(){

				v_tc = tc;
				v_normal=normalize(normalMV*mat3(swap_yz)*normal);

				v_frag_pos= vec3(mv*swap_yz* vec4(pos,1.0));

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

			//shadows part
			uniform bool mix_set;
			uniform float bias;
			uniform bool shadow_set;
			

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

					
				
				

			
			}
			` ;

		
		// creating buffers
		this.virtualS_tea =gl.createShader(gl.VERTEX_SHADER);
		this.fragmentS_tea =gl.createShader(gl.FRAGMENT_SHADER);

		gl.shaderSource(this.virtualS_tea, V_ShaderText_main);
		gl.shaderSource(this.fragmentS_tea, F_ShaderText_main);
		
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
		this.mix_set = gl.getUniformLocation(this.prog, "mix_set");
		this.bias = gl.getUniformLocation(this.prog, 'bias');
		this.shadows_set = gl.getUniformLocation(this.prog, 'shadows_set');
		this.LightP = gl.getUniformLocation(this.prog, 'LightP');
		this.light_set = gl.getUniformLocation(this.prog, 'light_set');




		gl.uniform1i(this.hasTexLoc,  0);


		

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

		this.use_shadows=0;
		gl.uniform1i(this.shadows_set, false);
		gl.uniform1i(this.light_set, false);

		


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
	draw( matrixMVP, matrixMV, matrixNormal,plp=null )
	{
		// TODO Complete the WebGL initializations before drawing
		gl.useProgram( this.prog );
		//! Shadows part
		gl.uniform1i(this.shadows_set, this.use_shadows);

		if(this.use_shadows)
            {
                gl.uniform1i(this.depth_sampler, 0);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadow_texture);
            }

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

		if (this.texture2 && !this.use_shadows) {
			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, this.texture2);  // la texture della teapot
			gl.uniform1i(this.samplerLoc, 2);
		}
		



		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
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

		this.texture2 = gl.createTexture(); 
		gl.bindTexture(gl.TEXTURE_2D, this.texture2);


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
		gl.activeTexture(gl.TEXTURE2); 
		//Binding the texture in the tecture slot above
		gl.bindTexture(gl.TEXTURE_2D, this.texture2); 
		//using slot 0 (beacuse I activate texture0)
		
		gl.useProgram(this.prog);

		//taking loaction of 'tex' in the program
		const samplerLoc = gl.getUniformLocation(this.prog, 'tex2'); 
		//specification about which slot is the one to use(0)
		gl.uniform1i(samplerLoc, 2);


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
	setShininess( shininess ){	
		// TODO set the uniform parameter(s) of the fragment shader to specify the shininess.
		gl.useProgram(this.prog);
		gl.uniform1f(this.phong_expoLoc, shininess);
	}

	set_shadowmap_bias(b){
        gl.uniform1f(this.bias, b);
    }
}

/****************************************************************************************************************
 * 
 * MESH DRASWER PER PALLINA
 * 
 */////////////////////////////////////////////////////////////////////////////////////////////////////////////


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

			void main(){

				v_tc = tc;
				v_normal=normalize(normalMV*mat3(swap_yz)*normal);

				v_frag_pos= vec3(mv*swap_yz* vec4(pos,1.0));

				gl_Position = mvp * swap_yz* vec4(pos, 1.0);
			
			}
			` ;
		//vtc- intrerpolated texture coodinates from the vertex shader
		const fragmentShaderText_tea = /* glsl */  `
			precision mediump float;

			uniform bool show;

			//sampler2D-> is a special type inGLSL to represent a 2D texture
			
			uniform sampler2D tex3;
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

			//shadows part
			uniform bool mix_set;
			uniform float bias;
			uniform bool shadow_set;

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
					vec4 texcolor = texture2D(tex3,v_tc);
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

					
				
				

			
			}
			` ;

		
		// creating buffers
		this.virtualS_tea =gl.createShader(gl.VERTEX_SHADER);
		this.fragmentS_tea =gl.createShader(gl.FRAGMENT_SHADER);

		gl.shaderSource(this.virtualS_tea, V_ShaderText_main);
		gl.shaderSource(this.fragmentS_tea, F_ShaderText_main);
		
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
		this.mix_set = gl.getUniformLocation(this.prog, "mix_set");
		this.bias = gl.getUniformLocation(this.prog, 'bias');
		this.shadows_set = gl.getUniformLocation(this.prog, 'shadows_set');
		this.LightP = gl.getUniformLocation(this.prog, 'LightP');
		this.light_set = gl.getUniformLocation(this.prog, 'light_set');

		gl.uniform1i(this.hasTexLoc,  0);


		

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

		this.use_shadows=0;
		gl.uniform1i(this.shadows_set, false);
		gl.uniform1i(this.light_set, false);

		


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
	draw( matrixMVP, matrixMV, matrixNormal,plp=null )
	{
		// TODO Complete the WebGL initializations before drawing
		gl.useProgram( this.prog );
		//! Shadows part
		gl.uniform1i(this.shadows_set, this.use_shadows);
		if(this.use_shadows)
            {
                gl.uniform1i(this.depth_sampler, 0);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadow_texture);
            }

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

		if (this.texture3 && !this.use_shadows) {
			gl.activeTexture(gl.TEXTURE3);
			gl.bindTexture(gl.TEXTURE_2D, this.texture3);  // la texture della teapot
			gl.uniform1i(this.samplerLoc, 3);
		}
		



		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
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

		this.texture3 = gl.createTexture(); 
		gl.bindTexture(gl.TEXTURE_2D, this.texture3);


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
		gl.activeTexture(gl.TEXTURE3); 
		//Binding the texture in the tecture slot above
		gl.bindTexture(gl.TEXTURE_2D, this.texture3); 
		//using slot 0 (beacuse I activate texture0)
		
		gl.useProgram(this.prog);

		//taking loaction of 'tex' in the program
		const samplerLoc = gl.getUniformLocation(this.prog, 'tex3'); 
		//specification about which slot is the one to use(0)
		gl.uniform1i(samplerLoc, 3);


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
	setShininess( shininess ){
		// TODO set the uniform parameter(s) of the fragment shader to specify the shininess.
		gl.useProgram(this.prog);
		gl.uniform1f(this.phong_expoLoc, shininess);
	}

	set_shadowmap_bias(b){
        gl.uniform1f(this.bias, b);
    }
}




