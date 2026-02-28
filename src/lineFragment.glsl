        varying float vAlpha;
        varying vec3 vColor;
        void main() {
            // Filaments plus visibles et contrastés
            gl_FragColor = vec4(vColor * 1.5, vAlpha * 0.5);
        }
    </script>

    <script>
        let scene, camera, renderer, clock, nodeMat, lineMat, particles, meshLines;
        let mouseX = 0, mouseY = 0, cycle = 0;
