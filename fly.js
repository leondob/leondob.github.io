/* fly.js */

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('fly-container');
    const imagePath = 'imagenes/haloween/mosca.png';
    const flySize = 50; 
    const movementSpeed = 3; 
    const scareDistance = 150; 
    
    let x; 
    let y; 
    let direction = Math.random() * 360; 
    let mouseX = -1000; 
    let mouseY = -1000;
    
    // Almacenará la referencia a la imagen de la mosca principal
    let primaryFlyImageElement; 
    let primaryAnimationFrameId;
    let primaryIsStationary = false;

    // --- NUEVO: Opciones para controlar la mosca ---
    const DEBUG_MODE_ENABLED = true; // Establece a 'true' para que la tecla 'M' funcione
                                      // Establece a 'false' para deshabilitar la tecla 'M'
    const MAX_FLIES = 5; // Número máximo de moscas que pueden aparecer con 'M'
    
    // Almacena todas las moscas adicionales creadas por la tecla 'M'
    const additionalFlies = []; 

    // --- Lógica de aparición y desaparición cíclica (para la mosca principal) ---
    function scheduleNextAppearance(isFirstTime = false) {
        const minDelay = isFirstTime ? 5000 : 15000;
        const maxDelay = isFirstTime ? 15000 : 45000;
        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        
        console.log(`Próxima aparición en ${Math.round(delay / 1000)} segundos.`);
        
        setTimeout(startPrimaryFlyCycle, delay);
    }
    
    function startPrimaryFlyCycle() {
        // Crear la mosca principal
        createFly(true); // 'true' indica que es la mosca principal
        
        const minTime = 30000;
        const maxTime = 120000;
        const activeTime = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;

        setTimeout(stopPrimaryFlyCycle, activeTime);
    }
    
    function stopPrimaryFlyCycle() {
        if (primaryAnimationFrameId) {
            cancelAnimationFrame(primaryAnimationFrameId);
        }
        
        container.classList.remove('visible'); // La mosca principal usa el contenedor
        
        setTimeout(() => {
            if (primaryFlyImageElement && container.contains(primaryFlyImageElement)) {
                container.removeChild(primaryFlyImageElement);
                primaryFlyImageElement = null; // Limpiar la referencia
            }
            scheduleNextAppearance(); 
        }, 1500);
    }
    
    // --- Creación de una Mosca (generalizada para principal y adicionales) ---
    // 'isPrimary' nos permite diferenciar el comportamiento de la mosca principal
    function createFly(isPrimary = false) {
        let currentX, currentY, currentDirection;
        let currentImageElement;
        let currentAnimationFrameId;
        let currentIsStationary = false;
        
        // Define la posición inicial para que parezca que ENTRA desde un borde aleatorio.
        const side = Math.floor(Math.random() * 4); // 0:arriba, 1:derecha, 2:abajo, 3:izquierda

        switch(side) {
            case 0: // Entra desde arriba
                currentX = Math.random() * window.innerWidth;
                currentY = -flySize;
                currentDirection = Math.random() * 60 + 120; // Dirección abajo
                break;
            case 1: // Entra desde la derecha
                currentX = window.innerWidth + flySize;
                currentY = Math.random() * window.innerHeight;
                currentDirection = Math.random() * 60 + 210; // Dirección izquierda
                break;
            case 2: // Entra desde abajo
                currentX = Math.random() * window.innerWidth;
                currentY = window.innerHeight + flySize;
                currentDirection = Math.random() * 60 + 300; // Dirección arriba
                break;
            case 3: // Entra desde la izquierda
                currentX = -flySize;
                currentY = Math.random() * window.innerHeight;
                currentDirection = Math.random() * 60 + 30; // Dirección derecha
                break;
        }

        currentImageElement = document.createElement('img');
        currentImageElement.src = imagePath;
        currentImageElement.className = 'fly-image'; // Usar una clase para moscas adicionales
        currentImageElement.style.left = `${currentX - flySize / 2}px`;
        currentImageElement.style.top = `${currentY - flySize / 2}px`;
        currentImageElement.style.opacity = '0'; // Comienza invisible
        currentImageElement.style.transition = 'opacity 1s ease-in-out'; // Transición suave
        currentImageElement.style.position = 'fixed'; // Asegura que las adicionales también floten

        // Si es la mosca principal, usa el contenedor y su ID predefinido
        if (isPrimary) {
            primaryFlyImageElement = currentImageElement;
            primaryFlyImageElement.id = 'fly-image'; // Solo la mosca principal tiene este ID
            container.appendChild(primaryFlyImageElement);
        } else {
            // Para moscas adicionales, se añaden directamente al body
            document.body.appendChild(currentImageElement);
            // Hacerlas desaparecer después de un tiempo (opcional, para no saturar)
            setTimeout(() => {
                currentImageElement.style.opacity = '0';
                setTimeout(() => {
                    if (currentImageElement.parentNode) {
                        currentImageElement.parentNode.removeChild(currentImageElement);
                        // Remover de la lista de moscas adicionales
                        const index = additionalFlies.findIndex(f => f.imageElement === currentImageElement);
                        if (index !== -1) {
                            additionalFlies.splice(index, 1);
                        }
                    }
                }, 1500); // Esperar la transición de opacidad
            }, Math.floor(Math.random() * (60000 - 30000 + 1)) + 30000); // Desaparecen en 30s-1min
        }

        // Hacerla aparecer suavemente
        setTimeout(() => {
            currentImageElement.style.opacity = '1';
        }, 100);

        // Objeto para mantener el estado de esta mosca individual
        const flyState = {
            x: currentX,
            y: currentY,
            direction: currentDirection,
            imageElement: currentImageElement,
            animationFrameId: null,
            isStationary: false,
            // Referencia a su propio toggleMovementState para que cada mosca tenga su ciclo
            toggleMovementState: null 
        };
        
        // Asignar el ID de animación para poder cancelarlo
        flyState.animationFrameId = requestAnimationFrame(() => moveFly(flyState));

        // Iniciar su ciclo de quietud/movimiento
        flyState.toggleMovementState = () => toggleMovementState(flyState);
        flyState.toggleMovementState();

        // Si no es la principal, añadirla a la lista de moscas adicionales
        if (!isPrimary) {
            additionalFlies.push(flyState);
        }
        return flyState; // Devolvemos el estado de la mosca creada
    }
    
    // --- Lógica de Quietud (generalizada) ---
    function toggleMovementState(flyState) {
        flyState.isStationary = !flyState.isStationary;
        
        const minDuration = flyState.isStationary ? 1000 : 5000;
        const maxDuration = flyState.isStationary ? 5000 : 15000;
        const duration = Math.floor(Math.random() * (maxDuration - minDuration + 1)) + minDuration;
        
        setTimeout(flyState.toggleMovementState, duration);
    }
    
    // --- Lógica de Movimiento y Evasión (generalizada) ---
    function moveFly(flyState) {
        const rad = flyState.direction * (Math.PI / 180);
        
        const dx = mouseX - flyState.x;
        const dy = mouseY - flyState.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < scareDistance) {
            flyState.isStationary = false; 
            flyState.direction = Math.atan2(dy, dx) * (180 / Math.PI) + 180;
            flyState.direction += (Math.random() - 0.5) * 45; 
        } else if (!flyState.isStationary) {
            if (Math.random() < 0.05) { 
                flyState.direction += (Math.random() - 0.5) * 60;
            }
        }
        
        if (!flyState.isStationary || distance < scareDistance) {
            flyState.x += movementSpeed * Math.cos(rad);
            flyState.y += movementSpeed * Math.sin(rad);
        }

        flyState.imageElement.style.left = `${flyState.x - flySize / 2}px`;
        flyState.imageElement.style.top = `${flyState.y - flySize / 2}px`;
        flyState.imageElement.style.transform = `rotate(${flyState.direction}deg)`;
        
        const buffer = 100; // 100px fuera de la pantalla
        if (flyState.x < -buffer || flyState.x > window.innerWidth + buffer || flyState.y < -buffer || flyState.y > window.innerHeight + buffer) {
             const centerDirection = Math.atan2(window.innerHeight / 2 - flyState.y, window.innerWidth / 2 - flyState.x) * (180 / Math.PI);
             flyState.direction = (flyState.direction * 0.9 + centerDirection * 0.1); 
        }
        
        flyState.animationFrameId = requestAnimationFrame(() => moveFly(flyState));
    }
    
    // --- Detección de Ratón (Mousemove) ---
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // --- NUEVA FUNCIÓN: Generar una mosca al presionar 'M' ---
    window.DONDE_HAY_UNA_MOSCA = () => {
        if (!DEBUG_MODE_ENABLED) {
            console.log("La función DONDE_HAY_UNA_MOSCA está deshabilitada (DEBUG_MODE_ENABLED es false).");
            return;
        }

        if (additionalFlies.length < MAX_FLIES) {
            createFly(false); // 'false' indica que NO es la mosca principal
            console.log("¡Una mosca adicional ha aparecido!");
        } else {
            console.log(`Ya hay el máximo de moscas (${MAX_FLIES}).`);
        }
    };

    // --- NUEVO: Escuchar la tecla 'M' ---
    document.addEventListener('keydown', (e) => {
        if (e.key === 'M' || e.key === 'm') {
            window.DONDE_HAY_UNA_MOSCA();
        }
    });

    // --- Ejecución Inicial ---
    scheduleNextAppearance(true);
});