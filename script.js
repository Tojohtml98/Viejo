// Variables globales
let trajectoryChart = null;

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar la aplicación
    initApp();
    
    // Configurar el evento del botón de cálculo
    const calculateBtn = document.getElementById('calculate');
    calculateBtn.addEventListener('click', calculateTrajectory);
});

// Inicializar la aplicación
function initApp() {
    // Configurar valores por defecto
    setDefaultValues();
    
    // Inicializar el gráfico
    initChart();
    
    // Calcular la trayectoria inicial
    calculateTrajectory();
}

// Establecer valores por defecto
function setDefaultValues() {
    // Valores por defecto ya están configurados en el HTML
}

// Inicializar el gráfico de trayectoria
function initChart() {
    const ctx = document.getElementById('trajectoryChart').getContext('2d');
    
    // Configuración del gráfico
    const config = {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Trayectoria',
                    data: [],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Línea de mira',
                    data: [],
                    borderColor: '#95a5a6',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Distancia (m)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Altura (cm)'
                    },
                    beginAtZero: false
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} cm`;
                        }
                    }
                }
            }
        }
    };
    
    // Crear el gráfico
    trajectoryChart = new Chart(ctx, config);
}

// Calcular la trayectoria
function calculateTrajectory() {
    // Obtener valores de entrada
    const velocity = parseFloat(document.getElementById('velocity').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const bc = parseFloat(document.getElementById('bc').value);
    const distance = parseFloat(document.getElementById('distance').value);
    const windSpeed = parseFloat(document.getElementById('windSpeed').value);
    const windAngle = parseFloat(document.getElementById('windAngle').value);
    
    // Validar entradas
    if (isNaN(velocity) || isNaN(weight) || isNaN(bc) || isNaN(distance) || 
        isNaN(windSpeed) || isNaN(windAngle)) {
        alert('Por favor, ingrese valores válidos en todos los campos.');
        return;
    }
    
    // Mostrar carga
    document.body.classList.add('loading');
    
    // Simular cálculo (en una aplicación real, aquí irían los cálculos balísticos)
    setTimeout(() => {
        // Calcular resultados
        const results = calculateBallistics(velocity, weight, bc, distance, windSpeed, windAngle);
        
        // Actualizar la interfaz
        updateResults(results);
        updateChart(results.trajectory);
        
        // Ocultar carga
        document.body.classList.remove('loading');
    }, 500);
}

// Función para calcular la balística (simplificada)
function calculateBallistics(velocity, weight, bc, distance, windSpeed, windAngle) {
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
    
    // Ajustar velocidad por viento de frente/cola
    const adjustedVelocity = velocity + (headTailWind * 0.1); // Efecto simplificado
    
    // Tiempo de vuelo (fórmula simplificada)
    const timeOfFlight = distance / adjustedVelocity;
    
    // Caída por gravedad (fórmula simplificada)
    const drop = 0.5 * g * Math.pow(timeOfFlight, 2) * 100; // Convertir a cm
    
    // Deriva por viento (fórmula simplificada)
    const windDrift = (crossWind * timeOfFlight) * 100; // Convertir a cm
    
    // Velocidad al impacto (simplificado con pérdida de velocidad lineal)
    const velocityLossPerMeter = 0.01 * (1 / bc); // Pérdida de velocidad por metro
    const impactVelocity = Math.max(0, adjustedVelocity - (distance * velocityLossPerMeter));
    
    // Energía al impacto (en julios)
    const impactEnergy = 0.5 * (weight / 1000) * Math.pow(impactVelocity, 2);
    
    // Generar puntos de trayectoria para el gráfico
    const trajectory = [];
    const steps = 20;
    const step = distance / steps;
    
    for (let d = 0; d <= distance; d += step) {
        const t = (d / distance) * timeOfFlight;
        const h = 0.5 * g * Math.pow(t, 2) * 100; // Altura en cm
        trajectory.push({ x: d, y: -h });
    }
    
    return {
        drop: drop,
        windDrift: windDrift,
        impactVelocity: impactVelocity,
        impactEnergy: impactEnergy,
        timeOfFlight: timeOfFlight,
        trajectory: trajectory
    };
}

// Actualizar los resultados en la interfaz
function updateResults(results) {
    document.getElementById('drop').textContent = results.drop.toFixed(1);
    document.getElementById('windDrift').textContent = results.windDrift.toFixed(1);
    document.getElementById('impactVelocity').textContent = results.impactVelocity.toFixed(1);
    document.getElementById('impactEnergy').textContent = results.impactEnergy.toFixed(0);
    document.getElementById('timeOfFlight').textContent = results.timeOfFlight.toFixed(3);
}

// Actualizar el gráfico con los nuevos datos
function updateChart(trajectory) {
    // Preparar datos para el gráfico
    const distances = trajectory.map(point => point.x);
    const heights = trajectory.map(point => point.y);
    
    // Línea de mira (eje x)
    const zeroLine = new Array(distances.length).fill(0);
    
    // Actualizar datos del gráfico
    trajectoryChart.data.labels = distances;
    trajectoryChart.data.datasets[0].data = heights;
    trajectoryChart.data.datasets[1].data = zeroLine;
    
    // Actualizar el gráfico
    trajectoryChart.update();
}

// Función para exportar los resultados
function exportResults() {
    // Implementar lógica de exportación si es necesario
    alert('Función de exportación no implementada aún.');
}

// Función para guardar la configuración
function saveConfiguration() {
    // Implementar lógica de guardado si es necesario
    alert('Función de guardado no implementada aún.');
}
