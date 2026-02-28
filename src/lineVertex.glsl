        varying float vAlpha;
        varying vec3 vColor;
        uniform float uTime;
        uniform float uMorph;
        uniform float uChaos;
        attribute vec3 targetPosition;
        attribute vec3 targetColor;

        void main() {
            vColor = mix(color, targetColor, uMorph);
            vec3 pos = mix(position, targetPosition, uMorph);

            // Ondulation des filaments
            float n = sin(pos.x * 0.01 + uTime) * cos(pos.z * 0.01 + uTime);
            pos.y += n * uChaos * 0.5;

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;

            vAlpha = smoothstep(12000.0, 50.0, length(pos)) * (0.2 + 0.15 * sin(uTime * 3.0));
        }
    </script>
