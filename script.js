// script.js

// --- 1. OBSŁUGA PRZEŁĄCZANIA JĘZYKÓW (PL / EN) ---
function setupLanguageSwitcher() {
    const btnPl = document.getElementById('btn-pl');
    const btnEn = document.getElementById('btn-en');
    const body = document.body;

    if (btnPl && btnEn) {
        btnPl.addEventListener('click', () => {
            body.classList.remove('lang-en');
            body.classList.add('lang-pl');
            btnEn.classList.remove('active');
            btnPl.classList.add('active');
        });

        btnEn.addEventListener('click', () => {
            body.classList.remove('lang-pl');
            body.classList.add('lang-en');
            btnPl.classList.remove('active');
            btnEn.classList.add('active');
        });
    }
}

// --- 2. MODEL 3D (THREE.JS) ---
function initRobot3D() {
    const container = document.getElementById('robot-3d-viewer');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Oświetlenie
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222222, 0.6);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 12, 8);
    scene.add(dirLight);

    const loader = new THREE.GLTFLoader();

    loader.load('ramie_robota.glb', function (gltf) {
        const model = gltf.scene;

        // Krawędzie CAD i materiał
        model.traverse((child) => {
            if (child.isMesh) {
                if (child.material) {
                    child.material.metalness = 0.1;
                    child.material.roughness = 0.4;
                }
                const edges = new THREE.EdgesGeometry(child.geometry, 25);
                const lineMaterial = new THREE.LineBasicMaterial({ color: 0x111111 });
                const wireframe = new THREE.LineSegments(edges, lineMaterial);
                child.add(wireframe);
            }
        });

        // Obrót początkowy
        model.rotation.y = -Math.PI / 4;

        // Wyśrodkowanie
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        model.position.x += (model.position.x - center.x);
        model.position.y += (model.position.y - center.y);
        model.position.z += (model.position.z - center.z);

        scene.add(model);

        // Ustawienie kamery
        const maxDim = Math.max(size.x, size.y, size.z);
        camera.position.set(maxDim * 1.2, maxDim * 0.4, maxDim * 1.0);
        controls.target.set(0, 0, 0);
        controls.update();

        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }
        animate();
    }, undefined, function (error) {
        console.error('Błąd ładowania pliku 3D:', error);
    });

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

// Uruchamiamy po załadowaniu drzewa DOM
window.addEventListener('DOMContentLoaded', () => {
    setupLanguageSwitcher();
    initRobot3D();
});