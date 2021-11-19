import * as THREE from "./jsm/three.module.js";
import Stats from "./jsm/libs/stats.module.js";

//tween
import { TWEEN } from "./jsm/libs/tween.module.min.js"; 

//Collada Loader
import { ColladaLoader } from "./jsm/loaders/ColladaLoader.js";

//////PostProcessing
import { EffectComposer } from "./jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "./jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "./jsm/postprocessing/ShaderPass.js";
import { CopyShader } from "./jsm/shaders/CopyShader.js";
import { BrightnessContrastShader } from "./jsm/shaders/BrightnessContrastShader.js";

import { ColorCorrectionShader } from "./jsm/shaders/ColorCorrectionShader.js";

import { RoomEnvironment } from './jsm/environments/RoomEnvironment.js';
//FXAA Antialiasing
import { FXAAShader } from "./jsm/shaders/FXAAShader.js";  

import { GLTFLoader } from './jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from './jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from './jsm/libs/meshopt_decoder.module.js';


import { RGBELoader } from './jsm/loaders/RGBELoader.js';
import { RoughnessMipmapper } from './jsm/utils/RoughnessMipmapper.js';

let container;
let scene, renderer, composer;
let stats, guimixer;
let swissKnife;
let skyboxGeo, skybox;
const clock = new THREE.Clock();
let mixer;
let camera;
let effectFXAA,
    brightnessContrastPass,
    colorCorrectionPass;

//button action
let POSITION;
let SELECTED;
let PRESSED;

//Hamburger menu 
const sideNav = document.querySelector(".sideNav")
const overlay = document.querySelector(".overlay")
const ham = document.querySelector(".ham")
const menuX = document.querySelector(".menuX")
const menuItems = document.querySelectorAll(".menuLink")

menuItems.forEach(menuItem => {
  menuItem.addEventListener("click", toggleHamburger)
})

ham.addEventListener("click", toggleHamburger)
menuX.addEventListener("click", toggleHamburger)
overlay.addEventListener("click", toggleHamburger)

function toggleHamburger() {
  overlay.classList.toggle("showOverlay")
  sideNav.classList.toggle("showNav")
}

init();
animate();

function init() {
    container = document.getElementById("threecontainer");
  //  document.body.appendChild(threecontainer);

    scene = new THREE.Scene();
   // scene.background = new THREE.Color(0xffffff);
    scene.add(new THREE.AmbientLight(0x2e2e2e, 0.5));
   
    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444, 0.25 );
    hemiLight.position.set( 0, 100, 0 );
    scene.add( hemiLight );

    const dirLight = new THREE.DirectionalLight( 0xffffff, 1.25 );
    dirLight.position.set( 0, 100, 100 );
    dirLight.castShadow = true;
    scene.add( dirLight );

    const light2 = new THREE.SpotLight(0xffffff, 1, 10000);
    light2.position.set(-1255, -1000, -1200);
    //light.angle = Math.PI / 9;
    light2.castShadow = true;
    light2.shadow.radius = 135;
    light2.shadow.camera.near = 85;
    light2.shadow.camera.far = 1000;
    light2.shadow.mapSize.width = 2048;
    light2.shadow.mapSize.height = 2048;
    light2.shadow.bias = 0.0001;
    scene.add(light2);

    const light3 = new THREE.SpotLight(0xffffff, 1, 10000);
    light3.position.set(150, 1300, 525 );
    //light.angle = Math.PI / 9;
    light3.castShadow = true;
    light3.shadow.radius = 135;
    light3.shadow.camera.near = 85;
    light3.shadow.camera.far = 1000;
    light3.shadow.mapSize.width = 2048;
    light3.shadow.mapSize.height = 2048;
    light3.shadow.bias = 0.0001;
    scene.add(light3);

    
    //Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, precision: 'mediump' });
    //specify render window size
    renderer.setSize(window.innerWidth , window.innerHeight);
    // renderer.setSize(w, h);

    container.appendChild(renderer.domElement);
    //renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
   // renderer.physicallyCorrectLights = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.75; 
    renderer.shadowMap.enabled = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    //renderer.autoClear = false;

//     const environment = new RoomEnvironment();
//     const pmremGenerator = new THREE.PMREMGenerator( renderer );
//  scene.environment = pmremGenerator.fromScene( environment ).texture;

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 10000);
    camera.position.set(0, 150, 325);
    camera.lookAt(new THREE.Vector3(0, -25, 0));

    // Postprocessing

    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    brightnessContrastPass = new ShaderPass(BrightnessContrastShader);
    brightnessContrastPass.uniforms["brightness"].value = 0.02;
    brightnessContrastPass.uniforms["contrast"].value = 0.025;
    composer.addPass(brightnessContrastPass);

    colorCorrectionPass = new ShaderPass(ColorCorrectionShader);
    //colorCorrectionPass.renderToScreen = true;
    colorCorrectionPass.uniforms["powRGB"].value = new THREE.Vector3(
        1.25,
        1.25,
        1.25
    );
    colorCorrectionPass.uniforms["mulRGB"].value = new THREE.Vector3(
        2.5,
        2.5,
        2.5
    );
    composer.addPass(colorCorrectionPass);

    effectFXAA = new ShaderPass(FXAAShader);
    const pixelRatio = renderer.getPixelRatio();
    effectFXAA.material.uniforms[ 'resolution' ].value.x = 1 / ( container.offsetWidth * pixelRatio );
    effectFXAA.material.uniforms[ 'resolution' ].value.y = 1 / ( container.offsetHeight * pixelRatio );
    composer.addPass(effectFXAA);

    stats = new Stats();
    //container.appendChild(stats.dom);
    window.addEventListener("resize", onWindowResize) ;
    }


                    //cubemap
    const path = 'https://threejs.org/examples/textures/cube/pisa/';
    const format = '.png';

    const urls = [
        path + 'px' + format, path + 'nx' + format,
        path + 'py' + format, path + 'ny' + format,
        path + 'pz' + format, path + 'nz' + format
    ];

    const reflectionCube = new THREE.CubeTextureLoader().load( urls );
    const refractionCube = new THREE.CubeTextureLoader().load( urls );
    refractionCube.mapping = THREE.CubeRefractionMapping;	

    

                // loading manager
const loadingManager = new THREE.LoadingManager(function () {});

                //hrd environment

            new RGBELoader()
					.setPath( './src/textures/equirectangular/' )
					.load( 'royal_esplanade_1k.hdr', function ( texture ) {

						texture.mapping = THREE.EquirectangularReflectionMapping;
						//scene.background = texture;
                        scene.environment = texture;
                        scene.background = new THREE.Color(0xffffff);
                        // scene.add(new THREE.AmbientLight(0x2e2e2e, 0.5));
                    });

                        
    const ktx2Loader = new KTX2Loader()
    .setTranscoderPath( 'js/libs/basis/' )
    .detectSupport( renderer );

    const loader = new GLTFLoader().setPath( 'src/models/' );
    loader.setKTX2Loader( ktx2Loader );
    loader.setMeshoptDecoder( MeshoptDecoder );
    loader.load( 'Website_SwissarmyToGLTF1.glb', function ( gltf ) {
        swissKnife = gltf.scene;
        swissKnife.traverse( function ( child ) {

        if ( child.isMesh ) {
            // let mat = new THREE.MeshPhongMaterial;
            // let color = new THREE.Color(0xaa5511);
            // mat.color = color;
            // mat.wireframe = true;
            //roughnessMipmapper.generateMipmaps( child.material );
            //child.material = mat;
            child.receiveShadow = true;
            child.castShadow = true;
        }

  

    swissKnife.scale.x = gltf.scene.scale.y = gltf.scene.scale.z = 10;
    swissKnife.position.y = 30;
    scene.add( swissKnife );

    render();

} );

// collada
// const loader1 = new ColladaLoader(loadingManager);
// loader1.load("./src/Assets/Model/swissarmy1.dae", function (collada) {
//     swissKnife = collada.scene;
//     swissKnife.position.y = 30;
//     // swissKnife.position.x = -150;
//     swissKnife.scale.x = swissKnife.scale.y = swissKnife.scale.z =0.1
//     scene.add(swissKnife);


//    // swissKnife.matrixAutoUpdate = false;
    //swissKnife.updatematrix();
    //swissKnife.sortFacesByMaterialIndex();
   
    // Load Textures
    let logoMat = new THREE.TextureLoader().load("./src/Assets/Image/symbol.png");
    let rubberMat = new THREE.TextureLoader().load("./src/Assets/Image/rubber.jpg");
    let rulerMat = new THREE.TextureLoader().load("./src/Assets/Image/ruler1.jpg");
    let fileMat = new THREE.TextureLoader().load("./src/Assets/Image/fileUV.png");
    //let lightMat = new THREE.TextureLoader().load("Assets/Image/pwatch.jpg");
    //Bump
    let brushedmetalbmap = new THREE.TextureLoader().load("./src/Assets/Image/brushedmetal.jpg");
    let rubberbmap = new THREE.TextureLoader().load("./src/Assets/Image/rubberb.jpg");
    let bmap = new THREE.TextureLoader().load("./src/Assets/Image/BMAPB.jpg");
    let plasticbmap = new THREE.TextureLoader().load("./src/Assets/Image/plastic.jpg");

    // set Materials
    let logomaterial = new THREE.MeshPhongMaterial({
        map: logoMat,
        combine: THREE.MixOperation,
        emissive: 0x000000,
        specular: 0x909090,
        shininess: 65,
    });

    var plasticmaterial = new THREE.MeshPhongMaterial({
        //map: chromemap,
        //emissive: 0xFF1000,
        //emissiveScale: 15,
        color: 0xfe2e2e,
        //ambient: 0x404040,
        //combine: THREE.MixOperation,
        specular: 0x424242,
        shininess: 85,
        bumpMap: plasticbmap,
        bumpScale: 0.0075,
        envMap: reflectionCube,
        refractionRatio: 400.95,
        reflectivity: 0.25,
    });

    var chromematerial = new THREE.MeshPhongMaterial({
        //map: framemap,
        //emissive: 0x2E2E2E,
        color: 0x707070,
        //	ambient: 0x000000,
        //combine: THREE.MixOperation,
        specular: 0x424242,
        shininess: 275,
        bumpMap: bmap,
        bumpScale: 0.010,
        envMap: reflectionCube,
        refractionRatio: 400.95,
        reflectivity: 1,
    });

    var glassmaterial = new THREE.MeshPhongMaterial({
        //ambient: 0x000000,
        combine: THREE.MixOperation,
        specular: 0xffffff,
        shininess: 65,
        //	bumpMap: bmap,
        bumpScale: 0.8,
        transparent: true,
        opacity: 0.75,
        alphaTest: 0.3,
        //alpha: true,
        envMap: reflectionCube,
        refractionRatio: 0.885,
        reflectivity: 0.65,
    });

    var rubbermaterial2 = new THREE.MeshPhongMaterial({
        map: rubberMat,
        combine: THREE.MixOperation,
        specular: 0x424242,
        shininess: 25,
        bumpMap: rubberbmap,
        bumpScale: -0.5,
        envMap: reflectionCube,
        refractionRatio: 400.95,
        reflectivity: 0.15,
        color: 0x2e2e2e,
    });

    var bgmaterial = new THREE.MeshPhongMaterial({
        //map: planemap ,
        emissive: 0x909090,
        //emissiveScale: 15,
        color: 0xff0080,
        //color: 0xF10000,
        //ambient: 0x000000,
        combine: THREE.MixOperation,
        //specular: 0x505050,
        //envMap: watchmirrorCamera,
        refractionRatio: 400.95,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.5,
        //alphaTest: 0.5,
        //alpha: true,
        reflectivity: 0,
    });

    var filematerial = new THREE.MeshPhongMaterial({
        map: fileMat,
        //emissive: 0xFF1000,
        //emissiveScale: 15,
        
        color: 0x101010,
        //ambient: 0x000000,
        combine: THREE.MixOperation,
        specular: 0xffffff,
        //combine: THREE.MixOperation,
        //specular: 0x909090,
        shininess: 135,
        bumpMap: fileMat,
        bumpScale: 3.25,
        envMap: reflectionCube,
        refractionRatio: 400.95,
        reflectivity: 0.55,
    });

    var rulermaterial = new THREE.MeshPhongMaterial({
        //map: rulermap,
        //emissive: 0xFF1000,
        //emissiveScale: 15,
        
        color: 0x101010,
        ///ambient: 0x000000,
        combine: THREE.MixOperation,
        specular: 0xffffff,
        //combine: THREE.MixOperation,
        //specular: 0x909090,
        shininess: 335,
        //bumpMap: rulermap,
        bumpScale: 1.25,
        envMap: reflectionCube,
        refractionRatio: 400.95,
        reflectivity: 0.55,
    });
    
    swissKnife.traverse(function (node) {
        if (node instanceof THREE.Mesh) {
            node.castShadow = true;
        }
        {
            node.receiveShadow = true;
        }
    });


    //find objects to apply materials
    let logo = swissKnife.getObjectByName("logo", true);
    let chrome = swissKnife.getObjectByName("group1", true);
    let plastic = swissKnife.getObjectByName("pCube39", true);
    let rubber = swissKnife.getObjectByName("rbr", true);
    let rubber2 = swissKnife.getObjectByName("rbr3", true);
    let bg = swissKnife.getObjectByName("bg", true);
    let rlr = swissKnife.getObjectByName("ruler", true);
    let fle = swissKnife.getObjectByName("file", true);
    let glass = swissKnife.getObjectByName("magnifyglass1", true);

    // Set  Material Function
    let setMaterial = function (node, material) {
        node.material = material;
        if (node.children) {
            for (let i = 0; i < node.children.length; i++) {
                setMaterial(node.children[i], material);
            }
        }
    };

    // Set the material on each object
    setMaterial(chrome, chromematerial);
    setMaterial(plastic, plasticmaterial);
    setMaterial(logo, logomaterial);
    setMaterial(rubber2, rubbermaterial2);
    setMaterial(rlr, rulermaterial);
    setMaterial(fle, filematerial);
    setMaterial(glass, glassmaterial);    

    //swissKnife.sortFacesByMaterialIndex();
});

window.addEventListener("load", onLoadFunction);
function onLoadFunction(e){
   
if (window.innerWidth <810 ) {
    camera.position.set(0, 250, 650);
    swissKnife.position.y = 75;
 }
// if  (window.innerWidth < 825) {
//     camera.position.set(0, 200, 400);
//     swissKnife.position.y = 65;
//  }
// else if (window.innerHeight <= 600) {
//     camera.position.set(0, 150, 400);
//  }
 else {
swissKnife.position.y = 30;
camera.position.set(0, 150, 350);
 }
}

function onWindowResize() {        
    
    camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);    
        const pixelRatio = renderer.getPixelRatio();
        effectFXAA.material.uniforms[ 'resolution' ].value.x = 1 / ( container.offsetWidth * pixelRatio );
        effectFXAA.material.uniforms[ 'resolution' ].value.y = 1 / ( container.offsetHeight * pixelRatio );
    
        if (window.innerWidth < 810) {
        //getElementById('#')
        camera.position.set(0, 250, 600);
        swissKnife.position.y = 75;
     }
    // else if (window.innerWidth <= 825) {
    //     swissKnife.position.y = 65; 
    //  }
    // else if (window.innerHeight <= 600) {
    //     camera.position.set(0, 150, 400);
    //     swissKnife.position.y = 30;
    //  }
     else {
        //keep normal camera position
    swissKnife.position.y = 30;
    camera.position.set(0, 150, 350);
   //FXAA antialiasing
     }
 }

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    render();
    composer.render();
    TWEEN.update();
   
    //rotate Dae
    if (swissKnife !== undefined) {
        
        swissKnife.rotation.y += delta * 0.25;
    }
}
function render() {
    //composer.render();   
    
    renderer.render(scene, camera);
  
}










// Javascript functions
//change color of mesh
document.getElementById("blue").onclick = function () {

    SELECTED = swissKnife.getObjectByName("pCube39", true);
    SELECTED.material.color.setHex(SELECTED.currentHex);
    SELECTED.currentHex = SELECTED.material.color.getHex();
    SELECTED.material.color.setHex(0x0431b4);
    document.getElementById("blue").style.opacity = 1;
    document.getElementById("red").style.opacity = 0.6;
    document.getElementById("green").style.opacity = 0.6;
    document.getElementById("grey").style.opacity = 0.6;	
}

document.getElementById("red").onclick = function () {

    SELECTED = swissKnife.getObjectByName("pCube39", true);
    SELECTED.material.color.setHex(SELECTED.currentHex);
    SELECTED.currentHex = SELECTED.material.color.getHex();
    SELECTED.material.color.setHex(0xff0000);
    document.getElementById("blue").style.opacity = 0.6;
    document.getElementById("red").style.opacity = 1;
    document.getElementById("green").style.opacity = 0.6;
    document.getElementById("grey").style.opacity = 0.6;
}
document.getElementById("green").onclick = function () {

    SELECTED = swissKnife.getObjectByName("pCube39", true);
    SELECTED.material.color.setHex(SELECTED.currentHex);
    SELECTED.currentHex = SELECTED.material.color.getHex();
    SELECTED.material.color.setHex(0x04b404);
    document.getElementById("blue").style.opacity = 0.6;
    document.getElementById("red").style.opacity = 0.6;
    document.getElementById("green").style.opacity = 1;
    document.getElementById("grey").style.opacity = 0.6;
}
document.getElementById("grey").onclick = function () {

    SELECTED = swissKnife.getObjectByName("pCube39", true);
    SELECTED.material.color.setHex(SELECTED.currentHex);
    SELECTED.currentHex = SELECTED.material.color.getHex();
    SELECTED.material.color.setHex(0xbdbdbd);
    document.getElementById("blue").style.opacity = 0.6;
    document.getElementById("red").style.opacity = 0.6;
    document.getElementById("green").style.opacity = 0.6;
    document.getElementById("grey").style.opacity = 1;	
}

//TWEEN pieces
document.getElementById("btlopn2Img").onclick = function () {
var btlopnr2 = swissKnife.getObjectByName ('btlopn2', true)	
if ( btlopnr2.rotation.y > 0.5 ) {
    document.getElementById("btlopn2Img").style.backgroundColor = "#FFFFFF";
    new TWEEN.Tween( btlopnr2.rotation ).to( {		  
    y:  0,		
    }, 500 )
    .easing( TWEEN.Easing.Elastic.Out).start()
   } else { 
    document.getElementById("btlopn2Img").style.backgroundColor = "#F54531";
  new TWEEN.Tween( btlopnr2.rotation ).to( {
    y:  2.85,
    }, 1500 )
  .easing( TWEEN.Easing.Elastic.Out).start()}}



  document.getElementById("btlopn1Img").onclick = function () {
var btlopnr2 = swissKnife.getObjectByName ('btlopn1', true)	
//twz.scale.x = -1;

//	twz.applyMatrix4( new THREE.Matrix4().makeRotationY( -1 ) );
if ( btlopnr2.rotation.y < -0.5 ) {
document.getElementById("btlopn1Img").style.backgroundColor = "#FFFFFF";
new TWEEN.Tween(btlopnr2.rotation ).to( {		  
y:  0,		
}, 500 )
.easing( TWEEN.Easing.Elastic.Out).start()
new TWEEN.Tween( btlopnr2.position ).to( {
    x:  0,
    //y:  -12,
    z: 0
    }, 500 )
    .easing( TWEEN.Easing.Elastic.Out).start()}
else { 
document.getElementById("btlopn1Img").style.backgroundColor = "#F54531";
document.getElementById("btlopn1Img").style.opacity = "1";
new TWEEN.Tween(btlopnr2.rotation ).to( {
y:  -1,
}, 500 )
.easing( TWEEN.Easing.Elastic.Out).start()	
new TWEEN.Tween( btlopnr2.position ).to( {
      x:  -25,
    //y:  Math.PI /  12,
        z:  -10
        }, 500 )
    .easing( TWEEN.Easing.Elastic.Out).start()}}	





document.getElementById("blade1img").onclick = function () {	
var bla1 = swissKnife.getObjectByName ('bld1', true)	
if ( bla1.rotation.y > 0.5 ) {
    document.getElementById("blade1img").style.backgroundColor = "#FFFFFF";
    // document.getElementById("Tbtlopn1").style.backgroundColor = "#ffffff";
    // document.getElementById("Tbtlopn1").style.opacity = "0.7";
    new TWEEN.Tween( bla1.rotation ).to( {		  
    y:  0,		
    }, 500 )
    .easing( TWEEN.Easing.Elastic.Out).start()
   } else { 
    document.getElementById("blade1img").style.backgroundColor = "#F54531";
    // document.getElementById("Tbtlopn1").style.backgroundColor = "#F54531";
    // document.getElementById("Tbtlopn1").style.opacity = "1";
  new TWEEN.Tween( bla1.rotation ).to( {
    y:  2.85,
    }, 1500 )
  .easing( TWEEN.Easing.Elastic.Out).start()}}



  document.getElementById("blade2img").onclick = function () {
var bla2 = swissKnife.getObjectByName ('bld2', true)	
//twz.scale.x = -1;

//	twz.applyMatrix4( new THREE.Matrix4().makeRotationY( -1 ) );
if ( bla2.rotation.y > 0.5 ) {
document.getElementById("blade2img").style.backgroundColor = "#FFFFFF";
new TWEEN.Tween(bla2.rotation ).to( {		  
y:  0,		
}, 500 )
.easing( TWEEN.Easing.Elastic.Out).start()
new TWEEN.Tween( bla2.position ).to( {
    x:  -45,
    //y:  -12,
    z: -55
    }, 500 )
    .easing( TWEEN.Easing.Elastic.Out).start()}
else { 
document.getElementById("blade2img").style.backgroundColor = "#F54531";
document.getElementById("blade2img").style.opacity = "1";
new TWEEN.Tween(bla2.rotation ).to( {
y:  1,
}, 500 )
.easing( TWEEN.Easing.Elastic.Out).start()	
new TWEEN.Tween( bla2.position ).to( {
      x:  -2.5,
    //y:  Math.PI /  12,
        z:  -81
        }, 500 )
    .easing( TWEEN.Easing.Elastic.Out).start()}}


    document.getElementById("blade3img").onclick = function () {
var bla3 = swissKnife.getObjectByName ('bld3', true)	
//twz.scale.x = -1;

//	twz.applyMatrix4( new THREE.Matrix4().makeRotationY( -1 ) );
if ( bla3.rotation.y > 0.5 ) {
document.getElementById("blade3img").style.backgroundColor = "#FFFFFF";
new TWEEN.Tween(bla3.rotation ).to( {		  
y:  0,		
}, 500 )
.easing( TWEEN.Easing.Elastic.Out).start()
}
else { 
document.getElementById("blade3img").style.backgroundColor = "#F54531";
document.getElementById("blade3img").style.opacity = "1";
new TWEEN.Tween(bla3.rotation ).to( {
y:  1.75,
}, 500 )
.easing( TWEEN.Easing.Elastic.Out).start()	
}}


    document.getElementById("blade5img").onclick = function () {
var bla5 = swissKnife.getObjectByName ('bld5', true)	
//twz.scale.x = -1;

//	twz.applyMatrix4( new THREE.Matrix4().makeRotationY( -1 ) );
if ( bla5.rotation.y > 0.5 ) {
document.getElementById("blade5img").style.backgroundColor = "#FFFFFF";
new TWEEN.Tween(bla5.rotation ).to( {		  
y:  0,		
}, 500 )
.easing( TWEEN.Easing.Elastic.Out).start()
new TWEEN.Tween( bla5.position ).to( {
    x:  -25,
    //y:  -12,
    z: -45
    }, 500 )
    .easing( TWEEN.Easing.Elastic.Out).start()}
else { 
document.getElementById("blade5img").style.backgroundColor = "#F54531";
document.getElementById("blade5img").style.opacity = "1";
new TWEEN.Tween(bla5.rotation ).to( {
y:  1,
}, 500 )
.easing( TWEEN.Easing.Elastic.Out).start()	
new TWEEN.Tween( bla5.position ).to( {
      x:  0,
    //y:  Math.PI /  12,
        z:  -59
        }, 500 )
    .easing( TWEEN.Easing.Elastic.Out).start()}}





  document.getElementById("bladeseratedimg").onclick = function () {
var blse = swissKnife.getObjectByName ('bldser', true)	
//twz.scale.x = -1;

//	twz.applyMatrix4( new THREE.Matrix4().makeRotationY( -1 ) );
if ( blse.rotation.y < -0.5 ) {
document.getElementById("bladeseratedimg").style.backgroundColor = "#FFFFFF";
new TWEEN.Tween(blse.rotation ).to( {		  
y:  0,		
}, 500 )
.easing( TWEEN.Easing.Elastic.Out).start()
new TWEEN.Tween( blse.position ).to( {
    x:  0,
    //y:  -12,
    z: 0
    }, 500 )
    .easing( TWEEN.Easing.Elastic.Out).start()}
else { 
document.getElementById("bladeseratedimg").style.backgroundColor = "#F54531";
document.getElementById("bladeseratedimg").style.opacity = "1";
new TWEEN.Tween(blse.rotation ).to( {
y:  -2.5,
}, 500 )
.easing( TWEEN.Easing.Elastic.Out).start()	
new TWEEN.Tween( blse.position ).to( {
      x:  -20,
    //y:  Math.PI /  12,
        z:  -47
        }, 500 )
    .easing( TWEEN.Easing.Elastic.Out).start()}}


document.getElementById("tweezerImg").onclick = function () {
var twz = swissKnife.getObjectByName ('tweezer', true)	
//twz.scale.x = -1;

//	twz.applyMatrix4( new THREE.Matrix4().makeRotationY( -1 ) );
if ( twz.rotation.y < -0.5 ) {
document.getElementById("tweezerImg").style.backgroundColor = "#FFFFFF";
new TWEEN.Tween(twz.rotation ).to( {		  
y:  0,		
}, 25 )
.easing( TWEEN.Easing.Elastic.Out).start()
new TWEEN.Tween( twz.position ).to( {
    x:  0,
    //y:  -12,
    z: 0
    }, 25 )
    .easing( TWEEN.Easing.Elastic.Out).start()}
else { 
document.getElementById("tweezerImg").style.backgroundColor = "#F54531";
document.getElementById("tweezerImg").style.opacity = "1";
new TWEEN.Tween(twz.rotation ).to( {
y:  -2.5,
}, 200 )
.easing( TWEEN.Easing.Elastic.Out).start()	
new TWEEN.Tween( twz.position ).to( {
      x:  -20,
    //y:  Math.PI /  12,
        z:  -50
        }, 200 )
    .easing( TWEEN.Easing.Elastic.Out).start()}}


    document.getElementById("fileImg").onclick = function () {
    var fl1 = swissKnife.getObjectByName ('file', true)
    //fl1.scale.x = -1;
    // fl1.applyMatrix4( new THREE.Matrix4().makeRotationY( 0 ) );
    //fl1 = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 155), Math.PI / 6.0);
     if ( fl1.rotation.y > 0.5 ) {
        // if ( bladeserrated.position.x > -0.5 ) {
    document.getElementById("fileImg").style.backgroundColor = "#ffffff";		 
    new TWEEN.Tween(fl1.rotation).to( {		  
    y:  0,		
    }, 500 )
    .easing( TWEEN.Easing.Elastic.Out).start()
    new TWEEN.Tween( fl1.position ).to( {
      x:  -2,
    //y:  Math.PI /  12,
        z:  -18
        }, 500 )
    .easing( TWEEN.Easing.Elastic.Out).start() }

else { 
document.getElementById("fileImg").style.backgroundColor = "#F54531";	
document.getElementById("fileImg").style.opacity = "1";
    new TWEEN.Tween( fl1.rotation ).to( {
            //x:  -30,
            y:   1.75,
            //z:  225
            }, 500 )
    .easing( TWEEN.Easing.Elastic.Out).start()
    //ZoomLeisure.disabled = true;
    new TWEEN.Tween( fl1.position ).to( {
      x:  -8,
    //y:  Math.PI /  12,
        z:  -30
        }, 500 )
    .easing( TWEEN.Easing.Elastic.Out).start()}
}

document.getElementById("rulerImg").onclick = function () {
    var rul = swissKnife.getObjectByName ('ruler', true)
    //fl1.scale.x = -1;
    // fl1.applyMatrix4( new THREE.Matrix4().makeRotationY( 0 ) );
    //fl1 = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 155), Math.PI / 6.0);
     if ( rul.rotation.y > 0.5 ) {
        // if ( bladeserrated.position.x > -0.5 ) {
    document.getElementById("rulerImg").style.backgroundColor = "#ffffff";		 
    new TWEEN.Tween(rul.rotation).to( {		  
    y:  0,		
    }, 500 )
    .easing( TWEEN.Easing.Elastic.Out).start()
    new TWEEN.Tween( rul.position ).to( {
      x:  -2,
    //y:  Math.PI /  12,
        z:  -18
        }, 500 )
    .easing( TWEEN.Easing.Elastic.Out).start() }

else { 
document.getElementById("rulerImg").style.backgroundColor = "#F54531";	
document.getElementById("rulerImg").style.opacity = "1";
    new TWEEN.Tween( rul.rotation ).to( {
            //x:  -30,
            y:   1.75,
            //z:  225
            }, 500 )
    .easing( TWEEN.Easing.Elastic.Out).start()
    //ZoomLeisure.disabled = true;
    new TWEEN.Tween( rul.position ).to( {
      x:  -8,
    //y:  Math.PI /  12,
        z:  -30
        }, 500 )
    .easing( TWEEN.Easing.Elastic.Out).start()}
} 




document.getElementById("corkScrewImg").onclick = function () {
var cork = swissKnife.getObjectByName ('pHelix5', true)	
if ( cork.rotation.y > 0.5 ) {
document.getElementById("corkScrewImg").style.backgroundColor = "#FFFFFF";
new TWEEN.Tween( cork.rotation ).to( {		  
y:  0,		
}, 500 )
.easing( TWEEN.Easing.Elastic.Out).start()
} else { 
document.getElementById("corkScrewImg").style.backgroundColor = "#F54531";
document.getElementById("corkScrewImg").style.opacity = "1";
new TWEEN.Tween(  cork.rotation ).to( {
y:  1.75,
}, 1500 )
.easing( TWEEN.Easing.Elastic.Out).start()}
    }


    document.getElementById("pliersImg").onclick = function () {
    var pli = swissKnife.getObjectByName ('Pliers', true)
     if ( pli.rotation.y > 2 ) {
document.getElementById("pliersImg").style.backgroundColor = "#ffffff";		 
new TWEEN.Tween(pli.rotation).to( {		  
y:  0,		
}, 500 )
.easing( TWEEN.Easing.Elastic.Out).start()

} else { 
document.getElementById("pliersImg").style.backgroundColor = "#F54531";
document.getElementById("pliersImg").style.opacity = "1";	
    new TWEEN.Tween( pli.rotation ).to( {
            //x:  -30,
            y:   2.25,
            //z:  225
            }, 1500 )
    .easing( TWEEN.Easing.Elastic.Out).start()}}






                                                
    document.getElementById("saw").onclick = function () {

    var sw = swissKnife.getObjectByName ('saw', true)

     if ( sw.rotation.y > 0.5 ) {
        // if ( bladeserrated.position.x > -0.5 ) {
document.getElementById("saw").style.backgroundColor = "#ffffff";		 
new TWEEN.Tween(sw.rotation).to( {		  
y:  0,		
}, 500 )
.easing( TWEEN.Easing.Elastic.Out).start()

} else { 
document.getElementById("saw").style.backgroundColor = "#F54531";	
document.getElementById("saw").style.opacity = "1";
    new TWEEN.Tween( sw.rotation ).to( {
            //x:  -30,
            y:   0.85,
            //z:  225
            }, 1000 )
    .easing( TWEEN.Easing.Elastic.Out).start()}}												

    
    
    document.getElementById("magnifImg").onclick = function () {
    var mag = swissKnife.getObjectByName ('magnify', true)	

if ( mag.rotation.y > 0.5 ) {
    document.getElementById("magnifImg").style.backgroundColor = "#ffffff";	

new TWEEN.Tween( mag.rotation ).to( {		  
y:  0,		
}, 500 )
.easing( TWEEN.Easing.Elastic.Out).start()
} else { 
document.getElementById("magnifImg").style.backgroundColor = "#F54531";	
document.getElementById("magnifImg").style.opacity = "1";
new TWEEN.Tween(  mag.rotation ).to( {
y:  1.4,
}, 1000 )
.easing( TWEEN.Easing.Elastic.Out).start()}
    }



    document.getElementById("scissorsImg").onclick = function () {
    var sci = swissKnife.getObjectByName ('scissors2', true)	

if ( sci.rotation.y > 0.5 ) {
    document.getElementById("scissorsImg").style.backgroundColor = "#ffffff";	

new TWEEN.Tween( sci.rotation ).to( {		  
y:  0,		
}, 500 )
.easing( TWEEN.Easing.Elastic.Out).start()
} else { 
document.getElementById("scissorsImg").style.backgroundColor = "#F54531";	
document.getElementById("scissorsImg").style.opacity = "1";
new TWEEN.Tween(  sci.rotation ).to( {
y:  2.75,
}, 1000 )
.easing( TWEEN.Easing.Elastic.Out).start()}
    }



    document.getElementById("hexImg").onclick = function () {
    var hex = swissKnife.getObjectByName ('hexm', true)	

if ( hex.rotation.y > 0.5 ) {
    document.getElementById("hexImg").style.backgroundColor = "#ffffff";	

new TWEEN.Tween( hex.rotation ).to( {		  
y:  0,		
}, 500 )
.easing( TWEEN.Easing.Elastic.Out).start()
} else { 
document.getElementById("hexImg").style.backgroundColor = "#F54531";	
document.getElementById("hexImg").style.opacity = "1";
new TWEEN.Tween(  hex.rotation ).to( {
y:  1.75,
}, 1000 )
.easing( TWEEN.Easing.Elastic.Out).start()}
    }



