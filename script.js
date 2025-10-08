// Calcular la trayectoria
function calculateTrajectory() {
    // Obtener valores de entrada
    const velocity = parseFloat(document.getElementById('velocity').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const bc = parseFloat(document.getElementById('bc').value);
    const distance = parseFloat(document.getElementById('distance').value);
    const windSpeed = parseFloat(document.getElementById('windSpeed').value);
    const windAngle = parseFloat(document.getElementById('windAngle').value);
    const zeroDistance = parseFloat(document.getElementById('zeroDistance').value);
    
    // Validar entradas
    if (isNaN(velocity) || isNaN(weight) || isNaN(bc) || isNaN(distance) || 
        isNaN(windSpeed) || isNaN(windAngle) || isNaN(zeroDistance)) {
        alert('Por favor, ingrese valores válidos en todos los campos.');
        return;
    }
    
    // Mostrar carga
    document.body.classList.add('loading');
    
    // Simular cálculo (en una aplicación real, aquí irían los cálculos balísticos)
    setTimeout(() => {
        // Calcular resultados
        const results = calculateBallistics(velocity, weight, bc, distance, windSpeed, windAngle, zeroDistance);
        
        // Actualizar la interfaz
        updateResults(results);
        updateChart(results.trajectory, zeroDistance);
        
        // Ocultar carga
        document.body.classList.remove('loading');
    }, 500);
}

// Función para calcular la balística (simplificada)
function calculateBallistics(velocity, weight, bc, distance, windSpeed, windAngle, zeroDistance) {
    // Constantes
    const g = 9.81; // gravedad (m/s²)
    const airDensity = 1.225; // kg/m³ (a nivel del mar, 15°C)
    const dragCoefficient = 0.47; // Coeficiente de arrastre para una esfera
    const bulletDiameter = 0.0078; // Diámetro del proyectil en metros (7.8mm)
    const bulletArea = Math.PI * Math.pow(bulletDiameter / 2, 2); // Área transversal
    
    // Convertir ángulo del viento a radianes
    const windAngleRad = (windAngle * Math.PI) / 180;
    
    // Componentes del viento (efecto lateral)
    const crossWind = windSpeed * Math.sin(windAngleRad);
    const headTailWind = windSpeed * Math.cos(windAngleRad);
    
    // Ajustar velocities por viento de frente/cola
    const adjustedVelocity = velocity + (headTailWind * 0.1); // Efecto simplificado
    
    // Tiempo de vuelo hasta la distancia de cero (para ajuste de mira)
    const timeToZero = zeroDistance / adjustedVelocity;
    
    // Caída a la distancia de cero (sin ajuste de mira)
    const dropAtZero = 0.5 * g * Math.pow(timeToZero, 2) * 100; // Convertir a cm
    
    // Tiempo de vuelo hasta el objetivo
    const timeOfFlight = distance / adjustedVelocity;
    
    // Caída por gravedad (fórmula simplificada)
    // Si el objetivo está más lejos que la distancia de cero, la caída será positiva (hacia abajo)
    // Si el objetivo está más cerca que la distancia de cero, la caída será negativa (hacia arriba)
    let drop;
    if (distance >= zeroDistance) {
        // Objetivo más lejos que el cero: caída hacia abajo
        const timeToTarget = distance / adjustedVelocity;
        const dropAtTarget = 0.5 * g * Math.pow(timeToTarget, 2) * 100;
        drop = dropAtTarget - dropAtZero;
    } else {
        // Objetivo más cerca que el cero: caída hacia arriba (corrección negativa)
        const timeToTarget = distance / adjustedVelocity;
        const dropAtTarget = 0.5 * g * Math.pow(timeToTarget, 2) * 100;
        drop = dropAtTarget - dropAtZero;
    }
    
    // Deriva por viento (fórmula simplificada)
    const windDrift = (crossWind * timeOfFlight) * 100; // Convertir a cm
    
    // Velocidad al impacto (simplificado con pérdida de velocities lineal)
    const velocityLossPerMeter = 0.01 * (1 / bc); // Pérdida de velocities por metro
    const impactVelocity = Math.max(0, adjustedVelocity - (distance * velocityLossPerMeter));
    
    // Energía al impacto (en julios)
    const impactEnergy = 0.5 * (weight / 1000) * Math.pow(impactVelocity, 2);
    
    // Generar puntos de trayectoria para el gráfico
    const trajectory = [];
    const steps = 20;
    const step = Math.max(distance, zeroDistance) / steps;
    
    for (let d = 0; d <= Math.max(distance, zeroDistance); d += step) {
        const t = d / adjustedVelocity;
        const h = (0.5 * g * Math.pow(t, 2) * 100) - (d <= zeroDistance ? (d / zeroDistance) * dropAtZero : dropAtZero);
        trajectory.push({ x: d, y: -h });
    }
    
    return {
        drop: drop,
        windDrift: windDrift,
        impactVelocity: impactVelocity,
        impactEnergy: impactEnergy,
        timeOfFlight: timeOfFlight,
        trajectory: trajectory,
        zeroDrop: dropAtZero
    };
}

// Función para establecer la distancia de cero
function setZeroDistance(distance) {
    document.getElementById('zeroDistance').value = distance;
    // Recalcular automáticamente si ya hay datos
    const velocity = parseFloat(document.getElementById('velocity').value);
    if (!isNaN(velocity) && velocity > 0) {
        calculateTrajectory();
    }
}

// Función para recalcular automáticamente cuando cambie la distancia de cero
function onZeroDistanceChange() {
    const velocity = parseFloat(document.getElementById('velocity').value);
    if (!isNaN(velocity) && velocity > 0) {
        calculateTrajectory();
    }
}

// Actualizar los resultados en la interfaz
function updateResults(results) {
    document.getElementById('drop').textContent = results.drop.toFixed(1);
    document.getElementById('windDrift').textContent = results.windDrift.toFixed(1);
    document.getElementById('impactVelocity').textContent = results.impactVelocity.toFixed(1);
    document.getElementById('impactEnergy').textContent = results.impactEnergy.toFixed(0);
    document.getElementById('timeOfFlight').textContent = results.timeOfFlight.toFixed(3);
    
    // Mostrar información sobre el ajuste de cero
    const zeroDistance = parseFloat(document.getElementById('zeroDistance').value);
    const zeroInfo = document.getElementById('zeroInfo');
    const verticalCorrection = document.getElementById('verticalCorrection');
    
    if (zeroInfo) {
        zeroInfo.textContent = `Centro a ${zeroDistance}m`;
    }
    
    if (verticalCorrection) {
        // La corrección vertical es la diferencia entre la caída real y la caída ajustada por el cero
        const targetDistance = parseFloat(document.getElementById('distance').value);
        const correctionAtTarget = results.drop;
        verticalCorrection.textContent = `${correctionAtTarget.toFixed(1)} cm`;
    }
}

// Actualizar el gráfico con los nuevos datos
function updateChart(trajectory, zeroDistance) {
    // Preparar datos para el gráfico
    const distances = trajectory.map(point => point.x);
    const heights = trajectory.map(point => point.y);
    
    // Crear datos para la línea de mira (línea recta desde el origen hasta la distancia de cero)
    const sightLine = [
        { x: 0, y: 0 },
        { x: zeroDistance, y: 0 }
    ];
    
    // Actualizar el gráfico
    trajectoryChart.data.labels = distances.map(d => d.toFixed(0));
    trajectoryChart.data.datasets[0].data = trajectory;
    trajectoryChart.data.datasets[1].data = sightLine;
    trajectoryChart.data.datasets[1].label = `Línea de Mira (Cero a ${zeroDistance}m)`;
    
    // Actualizar el gráfico
    trajectoryChart.update();
}
