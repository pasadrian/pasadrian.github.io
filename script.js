// script.js

// --- KONFIGURACJA ---
// Lista plików HTML projektów w folderze /projects, które chcesz wczytać
const projectFiles = [
    'projects/projekt1.html',
    // 'projects/projekt2.html', // Odkomentuj, gdy dodasz kolejny plik
];

// --- FUNKCJA WCZYTUJĄCA PROJEKTY (Modułowość) ---
async function loadProjects() {
    const container = document.getElementById('projects-container');
    
    // Przechodzimy przez każdy plik na liście
    for (const file of projectFiles) {
        try {
            // Pobieramy zawartość pliku
            const response = await fetch(file);
            if (!response.ok) throw new Error(`Błąd wczytywania ${file}`);
            const htmlFragment = await response.text();
            
            // Wstrzykujemy kod HTML do kontenera
            container.innerHTML += htmlFragment;
        } catch (error) {
            console.error(error);
        }
    }

    // WAŻNE: Skrypt 3D (Three.js) musi się uruchomić DOPIERO, gdy HTML projektu zostanie wczytany!
    initialize3DModel();
}

// --- FUNKCJA PRZEŁĄCZANIA JĘZYKÓW (Logika PL/EN) ---
function setupLanguageSwitcher() {
    const btnPl = document.getElementById('btn-pl');
    const btnEn = document.getElementById('btn-en');
    const body = document.body;

    // Obsługa kliknięcia PL
    btnPl.addEventListener('click', () => {
        body.classList.remove('lang-en');
        body.classList.add('lang-pl');
        btnEn.classList.remove('active');
        btnPl.classList.add('active');
    });

    // Obsługa kliknięcia EN
    btnEn.addEventListener('click', () => {
        body.classList.remove('lang-pl');
        body.classList.add('lang-en');
        btnPl.classList.remove('active');
        btnEn.classList.add('active');
    });
}

// --- INICJALIZACJA STRONY ---
// Uruchom wczytywanie projektów i logikę języków po załadowaniu drzewa DOM
window.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    setupLanguageSwitcher();
});


// --- TWOJA FUNKCJA THREE.JS (Skopiowana z poprzednich kroków, tylko wywołanie przeniesione) ---
// Przeniosłem ją do osobnej funkcji, żeby uruchomić ją po wczytaniu HTML.
function initialize3DModel() {
    const container = document.getElementById('robot-3d-viewer');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // --- 1. NATURALNE ŚWIATŁO SŁONECZNE (Daje głębię zamiast plasteliny) ---
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222222, 0.6);
    scene.add(hemiLight);

    // Główne światło padające z góry pod kątem
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 12, 8);
    scene.add(dirLight);

    // Wypełniające, słabsze światło z tyłu
    const backLight = new THREE.DirectionalLight(0xffffff, 0.4);
    backLight.position.set(-5, -5, -5);
    scene.add(backLight);

    const loader = new THREE.GLTFLoader();
    
    loader.load('ramie_robota.glb', function (gltf) {
        const model = gltf.scene;

        // --- 2. DODANIE KONTURÓW CAD ORAZ POPRAWKA MATERIALU ---
        model.traverse((child) => {
            if (child.isMesh) {
                // Przywrócenie materiałowi lekkości (tworzy delikatne bliki na krawędziach)
                if (child.material) {
                    child.material.metalness = 0.1;
                    child.material.roughness = 0.4;
                }

                // Tworzenie obrysów/konturów krawędzi (CAD Edges)
                const edges = new THREE.EdgesGeometry(child.geometry, 25); // 25 deg = kąt zagniecenia krawędzi
                const lineMaterial = new THREE.LineBasicMaterial({ 
                    color: 0x111111, // Ciemne linie konturu
                    linewidth: 1 
                });
                const wireframe = new THREE.LineSegments(edges, lineMaterial);
                child.add(wireframe);
            }
        });

        // Obrót początkowy ze wskazówkami zegara
        model.rotation.y = -Math.PI / 4; 

        // Wyśrodkowanie
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        model.position.x += (model.position.x - center.x);
        model.position.y += (model.position.y - center.y);
        model.position.z += (model.position.z - center.z);

        scene.add(model);

        // Pozycja kamery
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