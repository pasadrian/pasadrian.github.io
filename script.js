// script.js

// Funkcja zmieniająca klasę języka w body
function setLang(lang) {
    document.body.className = 'lang-' + lang;
    
    const btnEn = document.getElementById('btn-en');
    const btnPl = document.getElementById('btn-pl');
    
    if (btnEn && btnPl) {
        btnEn.classList.toggle('active', lang === 'en');
        btnPl.classList.toggle('active', lang === 'pl');
    }
}

// Uruchamiamy model 3D dopiero gdy cały kod HTML się wczyta
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('robot-3d-viewer');
    if (!container) return;

    // --- podstawowa konfigURACJA SCENY I KAMERY ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Myszkowe sterowanie widokiem (obracanie, przybliżanie)
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Łagodne hamowanie ruchu kamery


    // =========================================================================
    // --- 💡 SEKCJA OŚWIETLENIA (TUTAJ ROZJAŚNIASZ MODEL) ---
    // =========================================================================

    // 1. Światło otoczenia/półsferyczne (Oświetla równomiernie całą scenę ze wszystkich stron)
    // Argumenty: (Kolor góry, Kolor dołu/cieni, Intensywność)
    // ➔ Zwiększ z 0.6 na np. 0.9 lub 1.1, aby ROZJAŚNIĆ czarne zakamarki!
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6); 
    scene.add(hemiLight);

    // 2. Główne światło kierunkowe (Działa jak słońce, rzuca cienie i tworzy odblaski)
    // Argumenty: (Kolor, Intensywność)
    // ➔ Zwiększ z 1.2 na np. 1.5 lub 1.8 dla mocniejszych błysków na krawędziach
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 12, 8); // Pozycja światła w przestrzeni (X, Y, Z)
    scene.add(dirLight);

    // 💡 WSKAZÓWKA: Możesz tu dodać drugie, słabsze światło z drugiej strony, np:
    // const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    // fillLight.position.set(-5, -5, -5);
    // scene.add(fillLight);


    // =========================================================================
    // --- ŁADOWANIE MODELU 3D I EDYCJA MATERIAŁÓW ---
    // =========================================================================

    const loader = new THREE.GLTFLoader();
    loader.load('ramie_robota.glb', function (gltf) {
        const model = gltf.scene;

        // Przechodzimy przez każdą część (mesh) wchodzącą w skład modelu 3D
        model.traverse((child) => {
            if (child.isMesh) {
                
                // ➔ WŁAŚCIWOŚCI TWORZYWA / PLASTIKU:
                if (child.material) {
                    // metalness: 0.0 = całkowity plastik/mat, 1.0 = czyste metaliczne lustro
                    child.material.metalness = 0.1; 
                    
                    // roughness: 0.0 = idealnie gładki/błyszczący, 1.0 = całkowicie matowy
                    // ➔ Zmniejszenie roughness (np. do 0.25) sprawi, że na ciemnych elementach pojawią się jasne odblaski światła!
                    child.material.roughness = 0.4; 
                }

                // ➔ KONTURY CAD (KRAWĘDZIE):
                // Wykrywanie ostrych krawędzi (kąt zagięcia > 25 stopni)
                const edges = new THREE.EdgesGeometry(child.geometry, 25); 
                
                // Kolor linii konturu (0x111111 to bardzo ciemny szary/czarny).
                // ➔ Jeśli czarne elementy się zlewają, zmień kolor konturów na jaśniejszy, np. 0x555555 lub 0x888888!
                const lineMaterial = new THREE.LineBasicMaterial({ color: 0x111111 }); 
                
                const wireframe = new THREE.LineSegments(edges, lineMaterial);
                child.add(wireframe); // Nakładamy linie na dany element
            }
        });

        // Kąt obrotu początkowego ze wskazówkami zegara z góry (-Math.PI / 4 = -45 stopni)
        model.rotation.y = -Math.PI / 4; 

        // Auto-wyśrodkowanie modelu w punkcie (0,0,0)
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        model.position.x += (model.position.x - center.x);
        model.position.y += (model.position.y - center.y);
        model.position.z += (model.position.z - center.z);

        scene.add(model);

        // Ustawienie odległości kamery w zależności od rozmiarów modelu
        const maxDim = Math.max(size.x, size.y, size.z);
        camera.position.set(maxDim * 1.2, maxDim * 0.4, maxDim * 1.0);
        controls.target.set(0, 0, 0);
        controls.update();

        // Pętla renderująca obraz (odświeżanie klatek/animacja)
        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }
        animate();
    });

    // Skalowanie widoku przy zmianie rozmiaru okna przeglądarki
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
});