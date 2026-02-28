        varying vec3 vColor;
        varying float vAlpha;
        void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;

            // Glow exponentiel sur-activé (Intensifié)
            float core = 0.08 / d;
            core = pow(core, 1.3);

            // Couleur avec coeur blanc (Prime Materia) - Plus contrasté
            vec3 radiance = mix(vColor, vec3(1.0), pow(core * 0.5, 2.5));

            gl_FragColor = vec4(radiance * core * 1.2, vAlpha * core);
        }
    </script>
