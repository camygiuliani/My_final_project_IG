var V_ShaderText_main = /* glsl */  `			
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
/**
* 
* 
* 
*/
var F_ShaderText_main = /* glsl */  `
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
            uniform samplerCube depth_sampler;


			// I want a Blinn-Phong shading
			
			void main(){
                //      //////////////////////////////////////      /
                //           I want to implement Blinn shading     /
                // /////////////////////////////////////////////////
                float intensity = 1.0;
                float increment = 2.0;
                float shadowmap_value;
                float lightFragDist;
                vec3 color;

			    
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

					
					
				//gl_FragColor= 1.0*(diffuse_lighting+ specu_lighting );// +ambient_col ;

				if(shadows_set){
                     intensity = 0.05;
                     
                }
            {    
				
				

			
			}
			` ;