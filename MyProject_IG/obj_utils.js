function obj_loader(url)
{
    var result = null;
    var xmlhttp = new XMLHttpRequest();

	xmlhttp.onreadystatechange = function() 
    {
		if (this.readyState == 4 && this.status == 200) 
            {
                result = xmlhttp.responseText;
            }
    }

    xmlhttp.open("GET", url, false);
    xmlhttp.send();
    return result;
}



function obj_loader(url)
{
    var result = null;
    var xmlhttp = new XMLHttpRequest();

	xmlhttp.onreadystatechange = function() 
    {
		if (this.readyState == 4 && this.status == 200) 
            {
                result = xmlhttp.responseText;
            }
    }

    xmlhttp.open("GET", url, false);
    xmlhttp.send();
    return result;
}

function obj_parser(objdata) 
{
    var vpos = [];
    var tpos = [];
    var norm = [];
    var face = [];
    var tfac = [];
    var nfac = [];

    var lines = objdata.split('\n');

    lines.forEach(function(line) {
        var trimmedLine = line.trim();
        if (trimmedLine.startsWith('v ')) {
            var elements = trimmedLine.split(/\s+/);
            vpos.push([parseFloat(elements[1]), parseFloat(elements[2]), parseFloat(elements[3])]);
        } else if (trimmedLine.startsWith('vt ')) {
            var elements = trimmedLine.split(/\s+/);
            tpos.push([parseFloat(elements[1]), parseFloat(elements[2])]);
        } else if (trimmedLine.startsWith('vn ')) {
            var elements = trimmedLine.split(/\s+/);
            norm.push([parseFloat(elements[1]), parseFloat(elements[2]), parseFloat(elements[3])]);
        } else if (trimmedLine.startsWith('f ')) {
            var elements = trimmedLine.split(/\s+/);
            var f = [];
            var tf = [];
            var nf = [];
            for (var i = 1; i < elements.length; ++i) {
                var ids = elements[i].split('/');
                var vid = parseInt(ids[0]);
                if (vid < 0) vid = vpos.length + vid + 1;
                f.push(vid - 1);
                if (ids.length > 1 && ids[1] !== "") {
                    var tid = parseInt(ids[1]);
                    if (tid < 0) tid = tpos.length + tid + 1;
                    tf.push(tid - 1);
                }
                if (ids.length > 2 && ids[2] !== "") {
                    var nid = parseInt(ids[2]);
                    if (nid < 0) nid = norm.length + nid + 1;
                    nf.push(nid - 1);
                }
            }
            face.push(f);
            if (tf.length) tfac.push(tf);
            if (nf.length) nfac.push(nf);
        }
    });

    function addTriangleToBuffers(vBuffer, tBuffer, nBuffer, fi, i, j, k) {
        var f = face[fi];
        var tf = tfac[fi];
        var nf = nfac[fi];
        addTriangleToBuffer(vBuffer, vpos, f, i, j, k, addVertToBuffer3);
        if (tf) {
            addTriangleToBuffer(tBuffer, tpos, tf, i, j, k, addVertToBuffer2);
        }
        if (nf) {
            addTriangleToBuffer(nBuffer, norm, nf, i, j, k, addVertToBuffer3);
        }
    }

    function addTriangleToBuffer(buffer, v, f, i, j, k, addVert) {
        addVert(buffer, v, f, i);
        addVert(buffer, v, f, j);
        addVert(buffer, v, f, k);
    }

    function addVertToBuffer3(buffer, v, f, i) {
        buffer.push(v[f[i]][0]);
        buffer.push(v[f[i]][1]);
        buffer.push(v[f[i]][2]);
    }

    function addVertToBuffer2(buffer, v, f, i) {
        buffer.push(v[f[i]][0]);
        buffer.push(1 - v[f[i]][1]); //invert y-axis becouse of blender uv system
    }

    var vBuffer = [];
    var tBuffer = [];
    var nBuffer = [];

    for (var i = 0; i < face.length; ++i) {
        if (face[i].length < 3) continue;
        addTriangleToBuffers(vBuffer, tBuffer, nBuffer, i, 0, 1, 2);
        for (var j = 3; j < face[i].length; ++j) {
            addTriangleToBuffers(vBuffer, tBuffer, nBuffer, i, 0, j - 1, j);
        }
    }

    return {
        vertex_buffer: vBuffer,
        texture_buffer: tBuffer,
        normal_buffer: nBuffer
    };
}

