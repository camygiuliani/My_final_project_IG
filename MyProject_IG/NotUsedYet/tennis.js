function initVariables()
{
	/* quaoar_pos = new vec3(-15,10, 50);
	kamillis_pos = new vec3(-60,-25,-40);
	pyrona_pos = new vec3(45.0,-axys,0.0);
	hagaton_pos = new vec3(60,40,-35);
	ophin_pos = new vec3(0,-axys,0);
	hal_pos = new vec3(15, 0, 0);
	spaceman_pos = new vec3(0, -0.27, 0);

	pyrona_rot1 = new vec3(0, 0, 0);
	pyrona_rot2 = new vec3(0, 0, 0);
	hal_rot1 = new vec3(0, 0, 0);
	hal_rot2 = new vec3(0, 0, 0);

	InitWorld();

	light_position = new vec3(-pyrona_pos.x, -pyrona_pos.y, -pyrona_pos.z);
	light_position_V = [pyrona_pos.x, pyrona_pos.y, pyrona_pos.z];

	animation_orizzontal = 0;
	animation_vertical = 0;  */
}

function initWebGL(){
    // inizializing the GL context
	gl = canvas.getContext("webgl", {antialias: false, depth: true});	
	if (!gl) 
        {
		    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
		    return;
	    }
}

function Init()
{

	// Initialize the WebGL canvas
	canvas = document.getElementById("glcanvas");

	 /* checkbox_shadowmap = document.getElementById("shadowmap");
	checkbox_shadowmap.checked = true;

	checkbox_mix = document.getElementById("mix");
	checkbox_mix.checked = true;

	slider_velocity = document.getElementById("slider_velocity");

	slider_value = document.getElementById("slider_value");
	*/

	initVariables();
	initWebGL();
	
	// Initialize settings
	gl.clearColor(0.9, 0.9, 0.9, 1);
	gl.enable(gl.DEPTH_TEST);
	
	// Initialize the programs and buffers for drawing
	cube1 = new cube_drawer();
	cube2 = new cube_drawer();
	//skybox = new skybox_drawer();

	spaceman = new spaceman_drawer()
	quaoar = new planet_drawer();
	kamillis = new planet_drawer();
	pyrona = new planet_drawer();
	hagaton = new planet_drawer();
	ophin = new planet_drawer();
	hal = new planet_drawer();

	objs = [quaoar, kamillis, hagaton, ophin, hal, spaceman];
	toggle_shadowmap(1);

	image_loader("http://0.0.0.0:8000/quaoar_texture.png", quaoar, 1);
	image_loader("http://0.0.0.0:8000/kamillis_texture.png", kamillis, 2);
	image_loader("http://0.0.0.0:8000/pyrona_texture.png", pyrona, 3);
	image_loader("http://0.0.0.0:8000/hagaton_texture.png", hagaton, 4);
	image_loader("http://0.0.0.0:8000/ophin_texture.png", ophin, 5);
	image_loader("http://0.0.0.0:8000/hal_texture.png", hal, 6);
	image_loader("http://0.0.0.0:8000/spaceman_texture.png", spaceman, 7);
	
	UpdateCanvasSize();
	UpdateTransformations();
	//ShadowMapInit();
	//requestAnimationFrame(animate); 
}

// Called every time the window size is changed.
//ensures that the WebGL canvas resizes correctly when the browser window changes size.
function UpdateCanvasSize()
{
	canvas.style.width  = "100%";
	canvas.style.height = "100%";
	const pixelRatio = window.devicePixelRatio || 1;
	canvas.width  = pixelRatio * canvas.clientWidth;
	canvas.height = pixelRatio * canvas.clientHeight;
	const width  = (canvas.width  / pixelRatio);
	const height = (canvas.height / pixelRatio);
	canvas.style.width  = width  + 'px';
	canvas.style.height = height + 'px';
	gl.viewport( 0, 0, canvas.width, canvas.height );
	UpdateViewMatrices();
}

function UpdateViewMatrices()
{
	/* light_position = new vec3(-pyrona_pos.x, -pyrona_pos.y, -pyrona_pos.z);
	light_position_V = [pyrona_pos.x, pyrona_pos.y, pyrona_pos.z];

	if(first_person == 0)
		{
			CV = trans(1, camera_angle, camera_position);
		}
	
	else if(first_person == 1)
		{
			CV = trans_(1, camera_angle, fp_camera_position);
		}
	
	var LV_positive_x = trans_(1.0, light_angles[0], light_position);
	var LV_negative_x = trans_(1.0, light_angles[1], light_position);
	var LV_positive_y = trans_(1.0, light_angles[2], light_position);
	var LV_negative_y = trans_(1.0, light_angles[3], light_position);
	var LV_positive_z = trans_(1.0, light_angles[4], light_position);
	var LV_negative_z = trans_(1.0, light_angles[5], light_position);

	LVs = [LV_positive_x, LV_negative_x, LV_positive_y, LV_negative_y, LV_positive_z, LV_negative_z];
	*/
} 

function UpdateTransformations()
{
	/* MV_spaceman = m_mult(CV, MW_spaceman);
	MV_quaoar = m_mult(CV, MW_quaoar);
	MV_kamillis = m_mult(CV, MW_kamillis);
	MV_pyrona = m_mult(CV, MW_pyrona);	
	MV_hagaton = m_mult(CV, MW_hagaton);
	MV_ophin = m_mult(CV, MW_ophin);
	MV_hal = m_mult(CV, MW_hal); */
}

function ProjectionMatrix(cw = canvas.width, ch = canvas.height, fov_angle=90 )
{
	var r = cw / ch;
	var n = 0.1;
	var f = 100;
	var fov = deg2rad * fov_angle;
	var tang = Math.tan( fov/2 );
	var s = 1 / tang;
	return [
		s/r, 0, 0, 0,
		0, s, 0, 0,
		0, 0, (n+f)/(n-f), -1,
		0, 0, 2*n*f/(n-f), 0
	];
}
