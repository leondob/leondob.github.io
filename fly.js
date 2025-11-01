// fly.js

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('flyCanvas');
    const ctx = canvas.getContext('2d');
    
    // --- Configuración General ---
    const FLY_SIZE = 5; // Radio del punto de la mosca en píxeles
    const MOVEMENT_SPEED = 3; 
    const SCARE_DISTANCE = 150; 
    const DEBUG_MODE_ENABLED = true; // Si es true, la tecla 'M' funciona
    const MAX_FLIES = 5; 
    
    let mouseX = -1000; 
    let mouseY = -1000;
    let flies = []; // Array para todas las instancias de moscas
    let primaryFly = null;
    
    // --- 1. Clase/Constructor de la Mosca ---
    class Fly {
        constructor(isPrimary = false) {
            this.x;
            this.y;
            this.direction = Math.random() * 360; 
            this.isStationary = false;
            // 'toggleMovementState' debe estar ligado al objeto para que funcione correctamente con setTimeout
            this.toggleMovementState = this.toggleMovementState.bind(this); 
            this.isPrimary = isPrimary;
            this.color = isPrimary ? '#333' : '#000'; // Color ligeramente diferente para la principal
            this.initPosition();
        }

        // Define la posición inicial para simular que ENTRA desde un borde aleatorio
        initPosition() {
            const side = Math.floor(Math.random() * 4); // 0:arriba, 1:derecha, 2:abajo, 3:izquierda

            // Aseguramos que el canvas tenga dimensiones antes de usarlas
            if (canvas.width === 0 || canvas.height === 0) {
                 this.x = 0;
                 this.y = 0;
                 return;
            }

            switch(side) {
                case 0: // Entra desde arriba
                    this.x = Math.random() * canvas.width;
                    this.y = -FLY_SIZE * 2;
                    this.direction = Math.random() * 60 + 120; // Dirección abajo
                    break;
                case 1: // Entra desde la derecha
                    this.x = canvas.width + FLY_SIZE * 2;
                    this.y = Math.random() * canvas.height;
                    this.direction = Math.random() * 60 + 210; // Dirección izquierda
                    break;
                case 2: // Entra desde abajo
                    this.x = Math.random() * canvas.width;
                    this.y = canvas.height + FLY_SIZE * 2;
                    this.direction = Math.random() * 60 + 300; // Dirección arriba
                    break;
                case 3: // Entra desde la izquierda
                    this.x = -FLY_SIZE * 2;
                    this.y = Math.random() * canvas.height;
                    this.direction = Math.random() * 60 + 30; // Dirección derecha
                    break;
            }
        }

        // Lógica de quietud
        toggleMovementState() {
            this.isStationary = !this.isStationary;
            
            const minDuration = this.isStationary ? 1000 : 5000;
            const maxDuration = this.isStationary ? 5000 : 15000;
            const duration = Math.floor(Math.random() * (maxDuration - minDuration + 1)) + minDuration;
            
            setTimeout(this.toggleMovementState, duration);
        }

        // Lógica de movimiento, evasión y límites
        update() {
            const rad = this.direction * (Math.PI / 180);
            
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            let isFleeing = false;

            if (distance < SCARE_DISTANCE) {
                // ¡Huir!
                this.isStationary = false; 
                this.direction = Math.atan2(dy, dx) * (180 / Math.PI) + 180;
                this.direction += (Math.random() - 0.5) * 45; 
                isFleeing = true;
            } else if (!this.isStationary) {
                // Movimiento normal (cambio de dirección aleatorio)
                if (Math.random() < 0.05) { 
                    this.direction += (Math.random() - 0.5) * 60;
                }
            }
            
            // Movimiento: Se mueve si no está quieta O si está huyendo
            if (!this.isStationary || isFleeing) {
                this.x += MOVEMENT_SPEED * Math.cos(rad);
                this.y += MOVEMENT_SPEED * Math.sin(rad);
            }

            // Corrección para forzar el regreso si está demasiado lejos (más allá del buffer)
            const buffer = 100; 
            if (this.x < -buffer || this.x > canvas.width + buffer || this.y < -buffer || this.y > canvas.height + buffer) {
                 const centerDirection = Math.atan2(canvas.height / 2 - this.y, canvas.width / 2 - this.x) * (180 / Math.PI);
                 this.direction = (this.direction * 0.9 + centerDirection * 0.1); 
            }
        }

        // Dibujo de la mosca en el canvas
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            // Rotar para que la "antena" (línea) apunte en la dirección de movimiento
            ctx.rotate(this.direction * (Math.PI / 180));

            // Cuerpo (Círculo)
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.arc(0, 0, FLY_SIZE, 0, Math.PI * 2);
            ctx.fill();

            // Antena (Línea para indicar dirección/rotación)
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.moveTo(0, 0);
            ctx.lineTo(FLY_SIZE + 4, 0);
            ctx.stroke();

            ctx.restore();
        }
    }

    // --- 2. Lógica de Ciclo de Vida de la Mosca Principal ---

    function spawnFly(isPrimary = false) {
        const newFly = new Fly(isPrimary);
        flies.push(newFly);
        newFly.toggleMovementState();
        return newFly;
    }

    function scheduleNextAppearance(isFirstTime = false) {
        // Retraso de aparición: 
        const minDelay = isFirstTime ? 5000 : 15000;
        const maxDelay = isFirstTime ? 15000 : 45000;
        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        
        setTimeout(startPrimaryFlyCycle, delay);
    }
    
    function startPrimaryFlyCycle() {
        if (primaryFly) {
            removeFly(primaryFly); 
        }
        
        primaryFly = spawnFly(true); 
        canvas.classList.add('visible'); // El canvas se hace visible

        // Tiempo de actividad: 30 segundos a 2 minutos
        const minTime = 30000;
        const maxTime = 120000;
        const activeTime = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;

        // Programar la desaparición y reaparición
        setTimeout(stopPrimaryFlyCycle, activeTime);
    }
    
    function stopPrimaryFlyCycle() {
        removeFly(primaryFly);
        primaryFly = null; 
        canvas.classList.remove('visible'); // Ocultar el canvas (suavemente)
        scheduleNextAppearance(); 
    }

    function removeFly(flyToRemove) {
        const index = flies.indexOf(flyToRemove);
        if (index !== -1) {
            flies.splice(index, 1);
        }
    }
    
    // --- 3. BUCLE PRINCIPAL DE ANIMACIÓN ---
    function gameLoop() {
        // 1. Limpiar el canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 2. Actualizar y dibujar cada mosca
        for (let i = flies.length - 1; i >= 0; i--) {
            const fly = flies[i];
            fly.update();
            fly.draw();
        }

        requestAnimationFrame(gameLoop);
    }

    // --- 4. Funciones Auxiliares y Eventos ---
    
    // LA FUNCIÓN SOLICITADA POR EL USUARIO
    window.DONDE_HAY_UNA_MOSCA = () => {
        if (!DEBUG_MODE_ENABLED) {
            console.log("La función DONDE_HAY_UNA_MOSCA está deshabilitada (DEBUG_MODE_ENABLED es false).");
            return;
        }

        // Contar solo las moscas adicionales (no la principal)
        const additionalCount = flies.filter(f => !f.isPrimary).length;
        
        if (additionalCount < MAX_FLIES) {
            const newFly = spawnFly(false);
            console.log("¡Una mosca adicional ha aparecido!");

            // Desaparecer moscas adicionales después de un tiempo corto
            setTimeout(() => {
                removeFly(newFly);
            }, Math.floor(Math.random() * (60000 - 30000 + 1)) + 30000); 

        } else {
            console.log(`Ya hay el máximo de moscas (${MAX_FLIES}).`);
        }
    };
    
    // Redimensionar el canvas para cubrir toda la ventana
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // Detección de Ratón (Mousemove)
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    // Escuchar la tecla 'M'
    window.addEventListener('keydown', (e) => {
        if (e.key === 'M' || e.key === 'm') {
            window.DONDE_HAY_UNA_MOSCA();
        }
    });

    window.addEventListener('resize', resizeCanvas);

    // --- 5. Inicialización ---
    resizeCanvas();
    scheduleNextAppearance(true); // Programa la primera aparición
    gameLoop(); // Inicia el bucle de animación
});
