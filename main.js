'use strict';

let gl;
let surface;
let shProgram;
let spaceball;
let sphere;
let userPointCoord;
let userRotAngle;
let surface2;
let video, track, texture1, texture2, camera;

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.iTextureBuffer = gl.createBuffer();
    this.count = 0;
    this.textureCount = 0;

    this.BufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.NormalBufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.TextureBufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.textureCount = vertices.length / 2;
    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexture, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexture);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count);
    }

    this.DrawSphere = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.drawArrays(gl.LINE_STRIP, 0, this.count);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    this.iAttribNormal = -1;
    this.iAttribTexture = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;
    this.iNormalMatrix = -1;
    this.iLight = -1;

    this.iUserPoint = -1;
    this.irotAngle = 0;
    this.iUP = -1;
    this.iTMU = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}



function draw() {
    camera.getParams();
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let prj = 5
    let projection = m4.orthographic(-prj, prj, -prj, prj, 0, prj ** 2)

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();
    let surf2View = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

    let rotateToPointZeroSurf1 = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let rotateToPointZeroSurf2 = m4.axisRotation([0.707, 0.707, 0], 0.0);
    let translateToPointZero = m4.translation(0, 0, -10);
    let translateToPointZeroSurf2 = m4.translation(-0.5, -0.5, -10);

    let matAccum0 = m4.multiply(rotateToPointZeroSurf1, modelView);
    let matAccum02 = m4.multiply(rotateToPointZeroSurf2, surf2View);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);
    let matAccum12 = m4.multiply(translateToPointZeroSurf2, matAccum02);
    let matAccum2 = m4.multiply(m4.scaling(10, 10, 1), matAccum12);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);


    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum2);
    gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, projection);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        video
    );
    surface2.Draw();
    gl.clear(gl.DEPTH_BUFFER_BIT);
    camera.ApplyLeftFrustum();
    let projectionLeft = camera.mProjectionMatrix
    camera.ApplyRightFrustum();
    let projectionRight = camera.mProjectionMatrix;

    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, m4.multiply(matAccum1, getRotationMatrix(alpha, beta, gamma)));
    gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, projectionRight);

    let modelViewI = new Float32Array(16);
    let normalM = new Float32Array(16);
    mat4Invert(modelViewProjection, modelViewI)
    mat4Transpose(modelViewI, normalM)

    gl.uniformMatrix4fv(shProgram.iNormalMatrix, false, normalM)

    /* Draw the six faces of a cube, with different colors. */
    gl.uniform4fv(shProgram.iColor, [1, 1, 0, 1]);

    // gl.uniform3fv(shProgram.iLight, [0, 10 * Math.sin(Date.now() * 0.001), 0])

    gl.uniform1i(shProgram.iTMU, 0);
    gl.enable(gl.TEXTURE_2D);
    // gl.uniform2fv(shProgram.iUserPoint, [0.0, 0.0]);

    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.colorMask(false, true, true, false);
    surface.Draw();
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.colorMask(true, false, false, false);
    gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, projectionLeft);
    surface.Draw();
    gl.colorMask(true, true, true, true);


    // gl.uniform1f(shProgram.irotAngle, userRotAngle);
    // gl.uniform2fv(shProgram.iUserPoint, [userPointCoord.x, userPointCoord.y]);
    // let t = parabolaSurf(map(userPointCoord.x, 0, 1, 0, Math.PI * 2), userPointCoord.y)
    // gl.uniform3fv(shProgram.iUP, [t.x, t.y, t.z]);
    // sphere.DrawSphere();
}

function animate() {
    draw()
    window.requestAnimationFrame(animate);
}

function map(val, f1, t1, f2, t2) {
    let m;
    m = (val - f1) * (t2 - f2) / (t1 - f1) + f2
    return Math.min(Math.max(m, f2), t2);
}

function CreateTextureData() {
    let textureList = [];
    let i = 0;
    let j = 0;
    let step = 0.05
    while (i < Math.PI * 2) {
        while (j < 1) {
            let tx = map(i, 0, Math.PI * 2, 0, 1);
            let ty = j
            textureList.push(tx, ty)
            tx = map(i + step, 0, Math.PI * 2, 0, 1);
            textureList.push(tx, ty)
            tx = map(i, 0, Math.PI * 2, 0, 1);
            ty = j + step;
            textureList.push(tx, ty)
            tx = map(i + step, 0, Math.PI * 2, 0, 1);
            ty = j;
            textureList.push(tx, ty)
            tx = map(i + step, 0, Math.PI * 2, 0, 1);
            ty = j + step;
            textureList.push(tx, ty)
            tx = map(i, 0, Math.PI * 2, 0, 1);
            ty = j + step;
            textureList.push(tx, ty)
            j += step;
        }
        j = 0;
        i += step;
    }
    return textureList;
}

function CreateNormalData() {
    let normalsList = [];

    let i = 0;
    let j = 0;
    let step = 0.05
    while (i < Math.PI * 2) {
        while (j < 1) {
            let v1 = parabolaSurf(i, j)
            let v2 = parabolaSurf(i + step, j)
            let v3 = parabolaSurf(i, j + step)
            let v4 = parabolaSurf(i + step, j + step)
            let v21 = { x: v2.x - v1.x, y: v2.y - v1.y, z: v2.z - v1.z }
            let v31 = { x: v3.x - v1.x, y: v3.y - v1.y, z: v3.z - v1.z }
            let n1 = vec3Cross(v21, v31);
            vec3Normalize(n1);
            normalsList.push(n1.x, n1.y, n1.z);
            normalsList.push(n1.x, n1.y, n1.z);
            normalsList.push(n1.x, n1.y, n1.z);
            let v42 = { x: v4.x - v2.x, y: v4.y - v2.y, z: v4.z - v2.z };
            let v32 = { x: v3.x - v2.x, y: v3.y - v2.y, z: v3.z - v2.z };
            let n2 = vec3Cross(v42, v32);
            vec3Normalize(n2);
            normalsList.push(n2.x, n2.y, n2.z);
            normalsList.push(n2.x, n2.y, n2.z);
            normalsList.push(n2.x, n2.y, n2.z);
            j += step
        }
        j = 0
        i += step
    }

    return normalsList;
}

function CreateSurfaceData() {
    let vertexList = [];

    let i = 0;
    let j = 0;
    let step = 0.05
    while (i < Math.PI * 2) {
        while (j < 1) {
            let v1 = parabolaSurf(i, j)
            let v2 = parabolaSurf(i + step, j)
            let v3 = parabolaSurf(i, j + step)
            vertexList.push(v1.x, v1.y, v1.z)
            vertexList.push(v2.x, v2.y, v2.z)
            vertexList.push(v3.x, v3.y, v3.z)
            let v4 = parabolaSurf(i + step, j + step)
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v4.x, v4.y, v4.z);
            vertexList.push(v3.x, v3.y, v3.z);
            j += step
        }
        j = 0
        i += step
    }

    return vertexList;
}

function parabolaSurf(u, t) {
    let a = 0.8
    let c = 2
    let theta = Math.PI * 0.2
    let x = (a + t * Math.cos(theta) + c * t ** 2 * Math.sin(theta)) * Math.cos(u)
    let y = (a + t * Math.cos(theta) + c * t ** 2 * Math.sin(theta)) * Math.sin(u)
    let z = -t * Math.sin(theta) + c * t ** 2 * Math.cos(theta)
    return { x: x, y: y, z: z }
}

function CreateSphereSurface(r = 0.1) {
    let vertexList = [];
    let lon = -Math.PI;
    let lat = -Math.PI * 0.5;
    while (lon < Math.PI) {
        while (lat < Math.PI * 0.5) {
            let v1 = sphereSurfaceDate(r, lon, lat);
            vertexList.push(v1.x, v1.y, v1.z);
            lat += 0.05;
        }
        lat = -Math.PI * 0.5
        lon += 0.05;
    }
    return vertexList;
}

function sphereSurfaceDate(r, u, v) {
    let x = r * Math.sin(u) * Math.cos(v);
    let y = r * Math.sin(u) * Math.sin(v);
    let z = r * Math.cos(u);
    return { x: x, y: y, z: z };
}

function StereoCamera(
    Convergence,
    EyeSeparation,
    AspectRatio,
    FOV,
    NearClippingDistance,
    FarClippingDistance
) {
    this.mConvergence = Convergence;
    this.mEyeSeparation = EyeSeparation;
    this.mAspectRatio = AspectRatio;
    this.mFOV = FOV;
    this.mNearClippingDistance = NearClippingDistance;
    this.mFarClippingDistance = FarClippingDistance;

    this.mProjectionMatrix = null;
    this.mModelViewMatrix = null;

    this.ApplyLeftFrustum = function () {
        let top, bottom, left, right;
        top = this.mNearClippingDistance * Math.tan(this.mFOV / 2);
        bottom = -top;

        let a = this.mAspectRatio * Math.tan(this.mFOV / 2) * this.mConvergence;
        let b = a - this.mEyeSeparation / 2;
        let c = a + this.mEyeSeparation / 2;

        left = (-b * this.mNearClippingDistance) / this.mConvergence;
        right = (c * this.mNearClippingDistance) / this.mConvergence;

        // Set the Projection Matrix
        this.mProjectionMatrix = m4.orthographic(
            left,
            right,
            bottom,
            top,
            this.mNearClippingDistance,
            this.mFarClippingDistance
        );

        // Displace the world to right
        this.mModelViewMatrix = m4.translation(
            this.mEyeSeparation / 2,
            0.0,
            0.0
        );
    };

    this.ApplyRightFrustum = function () {
        let top, bottom, left, right;
        top = this.mNearClippingDistance * Math.tan(this.mFOV / 2);
        bottom = -top;

        let a = this.mAspectRatio * Math.tan(this.mFOV / 2) * this.mConvergence;
        let b = a - this.mEyeSeparation / 2;
        let c = a + this.mEyeSeparation / 2;

        left = (-c * this.mNearClippingDistance) / this.mConvergence;
        right = (b * this.mNearClippingDistance) / this.mConvergence;

        // Set the Projection Matrix
        this.mProjectionMatrix = m4.orthographic(
            left,
            right,
            bottom,
            top,
            this.mNearClippingDistance,
            this.mFarClippingDistance
        );

        // Displace the world to left
        this.mModelViewMatrix = m4.translation(
            -this.mEyeSeparation / 2,
            0.0,
            0.0
        );
    };

    this.getParams = function () {
        let values = document.getElementsByClassName("paramSpan");
        let eyeSep = 70.0;
        eyeSep = document.getElementById("ES").value;
        values[0].innerHTML = eyeSep;
        this.mEyeSeparation = eyeSep;
        let ratio = 1.0;
        let fov = 0.8;
        fov = document.getElementById("FOV").value;
        values[1].innerHTML = fov;
        this.mFOV = fov;
        let nearClip = 5.0;
        nearClip = document.getElementById("NCD").value - 0.0;
        values[2].innerHTML = nearClip;
        this.mNearClippingDistance = nearClip
        let convergence = 2000.0;
        convergence = document.getElementById("C").value;
        values[3].innerHTML = convergence;
        this.mConvergence = convergence
    }
}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iAttribTexture = gl.getAttribLocation(prog, "texture");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iModelViewMatrix = gl.getUniformLocation(prog, "ModelViewMatrix");
    shProgram.iProjectionMatrix = gl.getUniformLocation(prog, "ProjectionMatrix");
    shProgram.iNormalMatrix = gl.getUniformLocation(prog, "NormalMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iLight = gl.getUniformLocation(prog, "light");
    shProgram.iTMU = gl.getUniformLocation(prog, 'tmu');
    shProgram.iUserPoint = gl.getUniformLocation(prog, 'userPoint');
    shProgram.irotAngle = gl.getUniformLocation(prog, 'rotA');
    shProgram.iUP = gl.getUniformLocation(prog, 'translateUP');

    camera = new StereoCamera(500, 30.0, 1, 1.4, 5, 100);


    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData());
    surface.NormalBufferData(CreateNormalData());
    LoadTexture();
    surface.TextureBufferData(CreateTextureData());
    sphere = new Model('Sphere');
    sphere.BufferData(CreateSphereSurface())
    surface2 = new Model('Surface2');
    surface2.BufferData([0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0])
    surface2.TextureBufferData([1, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1]);
    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
let alpha = 0,
    beta = 0,
    gamma = 0;
function init() {
    window.addEventListener('deviceorientation', e => {
        alpha = e.alpha / 180 * Math.PI;
        beta = e.beta / 180 * Math.PI;
        gamma = e.gamma / 180 * Math.PI;
    }, true);
    userPointCoord = { x: 0.5, y: 0.5 }
    userRotAngle = 0.0;
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
        else {
            video = document.createElement('video');
            video.setAttribute('autoplay', true);
            window.vid = video;
            getWebcam();
            texture2 = CreateWebCamTexture();
        }

    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    window.requestAnimationFrame(animate);
}


function mat4Transpose(a, transposed) {
    var t = 0;
    for (var i = 0; i < 4; ++i) {
        for (var j = 0; j < 4; ++j) {
            transposed[t++] = a[j * 4 + i];
        }
    }
}

function mat4Invert(m, inverse) {
    var inv = new Float32Array(16);
    inv[0] = m[5] * m[10] * m[15] - m[5] * m[11] * m[14] - m[9] * m[6] * m[15] +
        m[9] * m[7] * m[14] + m[13] * m[6] * m[11] - m[13] * m[7] * m[10];
    inv[4] = -m[4] * m[10] * m[15] + m[4] * m[11] * m[14] + m[8] * m[6] * m[15] -
        m[8] * m[7] * m[14] - m[12] * m[6] * m[11] + m[12] * m[7] * m[10];
    inv[8] = m[4] * m[9] * m[15] - m[4] * m[11] * m[13] - m[8] * m[5] * m[15] +
        m[8] * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
    inv[12] = -m[4] * m[9] * m[14] + m[4] * m[10] * m[13] + m[8] * m[5] * m[14] -
        m[8] * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];
    inv[1] = -m[1] * m[10] * m[15] + m[1] * m[11] * m[14] + m[9] * m[2] * m[15] -
        m[9] * m[3] * m[14] - m[13] * m[2] * m[11] + m[13] * m[3] * m[10];
    inv[5] = m[0] * m[10] * m[15] - m[0] * m[11] * m[14] - m[8] * m[2] * m[15] +
        m[8] * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
    inv[9] = -m[0] * m[9] * m[15] + m[0] * m[11] * m[13] + m[8] * m[1] * m[15] -
        m[8] * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
    inv[13] = m[0] * m[9] * m[14] - m[0] * m[10] * m[13] - m[8] * m[1] * m[14] +
        m[8] * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];
    inv[2] = m[1] * m[6] * m[15] - m[1] * m[7] * m[14] - m[5] * m[2] * m[15] +
        m[5] * m[3] * m[14] + m[13] * m[2] * m[7] - m[13] * m[3] * m[6];
    inv[6] = -m[0] * m[6] * m[15] + m[0] * m[7] * m[14] + m[4] * m[2] * m[15] -
        m[4] * m[3] * m[14] - m[12] * m[2] * m[7] + m[12] * m[3] * m[6];
    inv[10] = m[0] * m[5] * m[15] - m[0] * m[7] * m[13] - m[4] * m[1] * m[15] +
        m[4] * m[3] * m[13] + m[12] * m[1] * m[7] - m[12] * m[3] * m[5];
    inv[14] = -m[0] * m[5] * m[14] + m[0] * m[6] * m[13] + m[4] * m[1] * m[14] -
        m[4] * m[2] * m[13] - m[12] * m[1] * m[6] + m[12] * m[2] * m[5];
    inv[3] = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11] -
        m[5] * m[3] * m[10] - m[9] * m[2] * m[7] + m[9] * m[3] * m[6];
    inv[7] = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11] +
        m[4] * m[3] * m[10] + m[8] * m[2] * m[7] - m[8] * m[3] * m[6];
    inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11] -
        m[4] * m[3] * m[9] - m[8] * m[1] * m[7] + m[8] * m[3] * m[5];
    inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10] +
        m[4] * m[2] * m[9] + m[8] * m[1] * m[6] - m[8] * m[2] * m[5];

    var det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
    if (det == 0) return false;
    det = 1.0 / det;
    for (var i = 0; i < 16; i++) inverse[i] = inv[i] * det;
    return true;
}

function vec3Cross(a, b) {
    let x = a.y * b.z - b.y * a.z;
    let y = a.z * b.x - b.z * a.x;
    let z = a.x * b.y - b.x * a.y;
    return { x: x, y: y, z: z }
}

function vec3Normalize(a) {
    var mag = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
    a[0] /= mag; a[1] /= mag; a[2] /= mag;
}

function LoadTexture() {
    texture1 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, );

    const image = new Image();
    image.crossOrigin = 'anonymus';
    image.src = "https://raw.githubusercontent.com/IGSystemI/VGGI/CGW/txtr.png";
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture1);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        draw()
    }
}

window.onkeydown = (e) => {
    // console.log(e.keyCode)
    switch (e.keyCode) {
        case 87:
            userPointCoord.y -= 0.01;
            break;
        case 83:
            userPointCoord.y += 0.01;
            break;
        case 65:
            userPointCoord.x += 0.01;
            break;
        case 68:
            userPointCoord.x -= 0.01;
            break;
    }
    userPointCoord.x = Math.max(0.001, Math.min(userPointCoord.x, 0.999))
    userPointCoord.y = Math.max(0.001, Math.min(userPointCoord.y, 0.999))
    // console.log(userPointCoord);
    draw();
}
onmousemove = (e) => {
    userRotAngle = map(e.clientX, 0, window.outerWidth, 0, Math.PI)
    // console.log(e.clientX)
    draw()
};

function getWebcam() {
    navigator.getUserMedia({ video: true, audio: false }, function (stream) {
        video.srcObject = stream;
        track = stream.getTracks()[0];
    }, function (e) {
        console.error('Rejected!', e);
    });
}

function CreateWebCamTexture() {
    let textureID = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureID);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return textureID;
}

function CreateWebCamTexture() {
    let textureID = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureID);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return textureID;
}

function getRotationMatrix() {
    var _x = -beta;
    var _y = -gamma;
    var _z = -alpha;

    var cX = Math.cos(_x);
    var cY = Math.cos(_y);
    var cZ = Math.cos(_z);
    var sX = Math.sin(_x);
    var sY = Math.sin(_y);
    var sZ = Math.sin(_z);

    //
    // ZXY rotation matrix construction.
    //

    var m11 = cZ * cY - sZ * sX * sY;
    var m12 = - cX * sZ;
    var m13 = cY * sZ * sX + cZ * sY;

    var m21 = cY * sZ + cZ * sX * sY;
    var m22 = cZ * cX;
    var m23 = sZ * sY - cZ * cY * sX;

    var m31 = - cX * sY;
    var m32 = sX;
    var m33 = cX * cY;

    return [
        m11, m12, m13, 0,
        m21, m22, m23, 0,
        m31, m32, m33, 0,
        0, 0, 0, 1
    ];

};