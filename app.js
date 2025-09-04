// Sistema de Gestión de Horarios - Versión Avanzada
class SistemaHorarios {
    constructor() {
        this.empleados = [
            {
                id: 1,
                nombre: "Nicola",
                tipo: "fijo",
                vacacionesRestantes: 30,
                estado: "activo",
                fechaInicio: null,
                fechaFin: null,
                horariosOriginales: {
                    lunes: "18:00-23:30",
                    martes: "libre",
                    miercoles: "libre", 
                    jueves: "18:00-23:30",
                    viernes: "12:00/16:00--19:00-24h",
                    sabado: "12:00/16:00--19:00-24h",
                    domingo: "12:00/16:00--19:00-23:30"
                },
                horariosActuales: {},
                estadosDias: {}
            },
            {
                id: 2,
                nombre: "Emanuele",
                tipo: "fijo",
                vacacionesRestantes: 30,
                estado: "activo",
                fechaInicio: null,
                fechaFin: null,
                horariosOriginales: {
                    lunes: "libre",
                    martes: "18:00-23:30",
                    miercoles: "18:00-23:30",
                    jueves: "18:00-23:30", 
                    viernes: "12:00-16:00/19:00-24h",
                    sabado: "12:00-16:00/19:00-24h",
                    domingo: "libre"
                },
                horariosActuales: {},
                estadosDias: {}
            }
        ];

        this.diasSemana = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
        this.diasSemanaDisplay = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
        this.meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        
        this.fechaActual = new Date(2025, 8, 4);
        this.mesActual = 8;
        this.añoActual = 2025;
        
        this.contextMenu = null;
        this.currentCell = null;
        this.nextId = 3;
        this.empleadoAEliminar = null;

        this.init();
    }

    init() {
        // Inicializar horarios actuales con originales
        this.empleados.forEach(emp => {
            emp.horariosActuales = { ...emp.horariosOriginales };
            emp.estadosDias = {};
            this.diasSemana.forEach(dia => {
                emp.estadosDias[dia] = emp.horariosOriginales[dia] === 'libre' ? 'libre' : 'trabajando';
            });
        });

        // Configurar todo cuando el DOM esté listo
        this.configurarTabs();
        this.configurarEventListeners();
        this.renderizarTodo();
        this.mostrarAlerta('Sistema inicializado correctamente', 'success');
    }

    configurarTabs() {
        // Configurar navegación de tabs
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                e.preventDefault();
                const tabId = e.target.getAttribute('data-tab');
                this.cambiarTab(tabId);
            }
        });
    }

    cambiarTab(tabId) {
        console.log('Cambiando a tab:', tabId);
        
        // Remover active de todos los botones y contenidos
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Agregar active al botón y contenido actual
        const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
        const activeContent = document.getElementById(tabId);
        
        if (activeBtn) activeBtn.classList.add('active');
        if (activeContent) activeContent.classList.add('active');

        // Renderizar según el tab activo
        if (tabId === 'calendario') {
            this.renderizarCalendario();
        } else if (tabId === 'gestion') {
            this.renderizarGestionPersonal();
        } else if (tabId === 'cuadrante') {
            this.renderizarCuadrante();
            this.renderizarPanelVacaciones();
            this.renderizarResumen();
        }
    }

    configurarEventListeners() {
        // Event delegation para botones principales
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            if (target.id === 'btnAgregarTemporal' || target.id === 'btnAgregarTemporalGestion') {
                e.preventDefault();
                this.mostrarModalTemporal();
                return;
            }
            
            if (target.id === 'btnGuardarCambios') {
                e.preventDefault();
                this.guardarCambios();
                return;
            }
            
            if (target.id === 'btnRestablecerSemana') {
                e.preventDefault();
                this.restablecerSemana();
                return;
            }
            
            if (target.id === 'btnImprimirSemanal') {
                e.preventDefault();
                this.imprimirCuadrante();
                return;
            }
            
            if (target.id === 'btnImprimirCalendario') {
                e.preventDefault();
                this.imprimirCalendario();
                return;
            }
            
            if (target.id === 'btnMesAnterior') {
                e.preventDefault();
                this.cambiarMes(-1);
                return;
            }
            
            if (target.id === 'btnMesSiguiente') {
                e.preventDefault();
                this.cambiarMes(1);
                return;
            }
            
            // Modal handlers
            if (target.id === 'closeModal' || target.id === 'cancelarTemporal') {
                e.preventDefault();
                this.cerrarModalTemporal();
                return;
            }
            
            if (target.id === 'closeModalConfirmacion' || target.id === 'cancelarEliminacion') {
                e.preventDefault();
                this.cerrarModalConfirmacion();
                return;
            }
            
            if (target.id === 'confirmarEliminacion') {
                e.preventDefault();
                this.confirmarEliminacion();
                return;
            }
            
            if (target.id === 'alertClose') {
                e.preventDefault();
                this.cerrarAlerta();
                return;
            }
            
            // Context menu items
            if (target.classList.contains('context-menu-item')) {
                e.preventDefault();
                e.stopPropagation();
                const nuevoEstado = target.getAttribute('data-estado');
                if (this.currentCell) {
                    this.cambiarEstadoDia(this.currentCell.empleadoId, this.currentCell.dia, nuevoEstado);
                }
                this.cerrarContextMenu();
                return;
            }
            
            // Eliminar empleado buttons
            if (target.classList.contains('btn-eliminar')) {
                e.preventDefault();
                const empleadoId = target.getAttribute('data-empleado-id');
                const empleado = this.empleados.find(emp => emp.id == empleadoId);
                if (empleado) {
                    this.mostrarModalConfirmacion(empleado);
                }
                return;
            }
            
            // Day cells - context menu
            if (target.classList.contains('dia-celda') || target.closest('.dia-celda')) {
                e.preventDefault();
                e.stopPropagation();
                const celda = target.classList.contains('dia-celda') ? target : target.closest('.dia-celda');
                const empleadoId = parseInt(celda.getAttribute('data-empleado-id'));
                const dia = celda.getAttribute('data-dia');
                this.mostrarContextMenu(e, empleadoId, dia);
                return;
            }
            
            // Cerrar modales al hacer click fuera
            if (target.id === 'modalTemporal') {
                this.cerrarModalTemporal();
                return;
            }
            
            if (target.id === 'modalConfirmacion') {
                this.cerrarModalConfirmacion();
                return;
            }
        });

        // Form submission
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'formTemporal') {
                e.preventDefault();
                this.agregarTemporal(e);
            }
        });

        // Change events
        document.addEventListener('change', (e) => {
            if (e.target.id === 'tipoTemporal') {
                this.toggleSustitutoOptions(e);
            }
        });

        // Cerrar menú contextual al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu') && !e.target.closest('.dia-celda')) {
                this.cerrarContextMenu();
            }
        });
    }

    renderizarTodo() {
        this.renderizarPanelVacaciones();
        this.renderizarCuadrante();
        this.renderizarResumen();
        this.renderizarCalendario();
        this.renderizarGestionPersonal();
    }

    renderizarPanelVacaciones() {
        const container = document.getElementById('empleadosVacaciones');
        if (!container) return;
        
        container.innerHTML = '';

        this.empleados.filter(emp => emp.tipo === 'fijo').forEach(empleado => {
            const div = document.createElement('div');
            div.className = 'empleado-vacaciones';
            div.innerHTML = `
                <div class="empleado-info">
                    <h4>${empleado.nombre}</h4>
                    <p>Estado: ${empleado.estado}</p>
                </div>
                <div class="vacaciones-contador">
                    <span class="vacaciones-numero">${empleado.vacacionesRestantes}</span>
                    <span>días restantes</span>
                </div>
            `;
            container.appendChild(div);
        });
    }

    renderizarCuadrante() {
        const tbody = document.getElementById('cuadranteBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        this.empleados.forEach(empleado => {
            const tr = document.createElement('tr');
            
            // Nombre del empleado
            const tdNombre = document.createElement('td');
            tdNombre.className = `empleado-nombre ${empleado.tipo === 'temporal' || empleado.tipo === 'sustituto' ? 'empleado-temporal' : ''}`;
            tdNombre.textContent = empleado.nombre;
            tr.appendChild(tdNombre);

            // Días de la semana
            this.diasSemana.forEach(dia => {
                const td = document.createElement('td');
                const divCelda = document.createElement('div');
                divCelda.className = `dia-celda ${empleado.estadosDias[dia] || 'libre'}`;
                divCelda.setAttribute('data-empleado-id', empleado.id);
                divCelda.setAttribute('data-dia', dia);
                
                const horarioTexto = document.createElement('div');
                horarioTexto.className = 'horario-texto';
                horarioTexto.textContent = empleado.horariosActuales[dia] || 'libre';
                
                const estadoBadge = document.createElement('div');
                estadoBadge.className = `estado-badge ${empleado.estadosDias[dia] || 'libre'}`;
                estadoBadge.textContent = this.getEstadoTexto(empleado.estadosDias[dia] || 'libre');

                divCelda.appendChild(horarioTexto);
                divCelda.appendChild(estadoBadge);
                
                td.appendChild(divCelda);
                tr.appendChild(td);
            });

            // Acciones
            const tdAcciones = document.createElement('td');
            tdAcciones.className = 'no-print';
            if (empleado.tipo === 'temporal' || empleado.tipo === 'sustituto') {
                const btnEliminar = document.createElement('button');
                btnEliminar.className = 'btn-accion btn-eliminar';
                btnEliminar.textContent = 'Eliminar';
                btnEliminar.setAttribute('data-empleado-id', empleado.id);
                tdAcciones.appendChild(btnEliminar);
            }
            tr.appendChild(tdAcciones);

            tbody.appendChild(tr);
        });
    }

    renderizarCalendario() {
        const grid = document.getElementById('calendarioGrid');
        const titulo = document.getElementById('mesActualTitulo');
        
        if (!grid || !titulo) return;
        
        titulo.textContent = `${this.meses[this.mesActual]} ${this.añoActual}`;
        grid.innerHTML = '';

        // Headers de días
        this.diasSemanaDisplay.forEach(dia => {
            const header = document.createElement('div');
            header.className = 'calendario-header-dia';
            header.textContent = dia.substring(0, 3);
            grid.appendChild(header);
        });

        // Obtener primer día del mes y días en el mes
        const primerDia = new Date(this.añoActual, this.mesActual, 1);
        const ultimoDia = new Date(this.añoActual, this.mesActual + 1, 0);
        const diasEnMes = ultimoDia.getDate();
        const diaSemanaInicio = primerDia.getDay() === 0 ? 6 : primerDia.getDay() - 1;

        // Días del mes anterior
        const mesAnterior = new Date(this.añoActual, this.mesActual, 0);
        for (let i = diaSemanaInicio - 1; i >= 0; i--) {
            const dia = document.createElement('div');
            dia.className = 'calendario-dia otro-mes';
            dia.innerHTML = `<div class="calendario-dia-numero">${mesAnterior.getDate() - i}</div>`;
            grid.appendChild(dia);
        }

        // Días del mes actual
        for (let dia = 1; dia <= diasEnMes; dia++) {
            const diaElemento = document.createElement('div');
            diaElemento.className = 'calendario-dia';
            
            // Verificar si es el día actual
            const fechaDia = new Date(this.añoActual, this.mesActual, dia);
            if (this.esMismoDia(fechaDia, this.fechaActual)) {
                diaElemento.classList.add('hoy');
            }

            const numeroDia = document.createElement('div');
            numeroDia.className = 'calendario-dia-numero';
            numeroDia.textContent = dia;
            diaElemento.appendChild(numeroDia);

            // Agregar horarios de empleados
            const diaSemana = this.diasSemana[fechaDia.getDay() === 0 ? 6 : fechaDia.getDay() - 1];
            
            this.empleados.forEach(empleado => {
                if (empleado.estadosDias[diaSemana] === 'trabajando') {
                    const empleadoDiv = document.createElement('div');
                    empleadoDiv.className = `calendario-empleado ${empleado.nombre.toLowerCase()}`;
                    empleadoDiv.textContent = `${empleado.nombre}: ${empleado.horariosActuales[diaSemana]}`;
                    diaElemento.appendChild(empleadoDiv);
                } else if (empleado.estadosDias[diaSemana] === 'vacaciones') {
                    const empleadoDiv = document.createElement('div');
                    empleadoDiv.className = `calendario-empleado ${empleado.nombre.toLowerCase()}`;
                    empleadoDiv.textContent = `${empleado.nombre}: Vacaciones`;
                    diaElemento.appendChild(empleadoDiv);
                } else if (empleado.estadosDias[diaSemana] === 'baja') {
                    const empleadoDiv = document.createElement('div');
                    empleadoDiv.className = `calendario-empleado ${empleado.nombre.toLowerCase()}`;
                    empleadoDiv.textContent = `${empleado.nombre}: Baja`;
                    diaElemento.appendChild(empleadoDiv);
                }
            });

            grid.appendChild(diaElemento);
        }

        // Días del mes siguiente para completar la grilla
        const diasRestantes = 42 - (diaSemanaInicio + diasEnMes);
        for (let dia = 1; dia <= diasRestantes; dia++) {
            const diaElemento = document.createElement('div');
            diaElemento.className = 'calendario-dia otro-mes';
            diaElemento.innerHTML = `<div class="calendario-dia-numero">${dia}</div>`;
            grid.appendChild(diaElemento);
        }

        this.renderizarLeyendaEmpleados();
    }

    renderizarLeyendaEmpleados() {
        const container = document.getElementById('empleadosLeyenda');
        if (!container) return;
        
        container.innerHTML = '';

        this.empleados.forEach(empleado => {
            const div = document.createElement('div');
            div.className = 'empleado-leyenda';
            div.innerHTML = `
                <span class="empleado-color ${empleado.nombre.toLowerCase()}"></span>
                <span>${empleado.nombre} (${empleado.tipo})</span>
            `;
            container.appendChild(div);
        });
    }

    renderizarGestionPersonal() {
        // Empleados fijos
        const fijoContainer = document.getElementById('empleadosFijos');
        if (fijoContainer) {
            fijoContainer.innerHTML = '';

            this.empleados.filter(emp => emp.tipo === 'fijo').forEach(empleado => {
                const card = document.createElement('div');
                card.className = 'empleado-card';
                card.innerHTML = `
                    <div class="empleado-card-header">
                        <h4>${empleado.nombre}</h4>
                        <span class="empleado-tipo ${empleado.tipo}">${empleado.tipo}</span>
                    </div>
                    <div class="empleado-card-info">
                        Vacaciones restantes: ${empleado.vacacionesRestantes} días<br>
                        Estado: ${empleado.estado}
                    </div>
                `;
                fijoContainer.appendChild(card);
            });
        }

        // Empleados temporales
        const temporalContainer = document.getElementById('empleadosTemporales');
        if (temporalContainer) {
            temporalContainer.innerHTML = '';

            const temporales = this.empleados.filter(emp => emp.tipo === 'temporal' || emp.tipo === 'sustituto');
            
            if (temporales.length === 0) {
                const mensaje = document.createElement('p');
                mensaje.textContent = 'No hay empleados temporales actualmente.';
                mensaje.style.color = 'var(--color-text-secondary)';
                mensaje.style.fontStyle = 'italic';
                temporalContainer.appendChild(mensaje);
            } else {
                temporales.forEach(empleado => {
                    const card = document.createElement('div');
                    card.className = 'empleado-card';
                    
                    const fechaInicio = empleado.fechaInicio ? new Date(empleado.fechaInicio).toLocaleDateString('es-ES') : 'No definida';
                    const fechaFin = empleado.fechaFin ? new Date(empleado.fechaFin).toLocaleDateString('es-ES') : 'No definida';
                    
                    card.innerHTML = `
                        <div class="empleado-card-header">
                            <h4>${empleado.nombre}</h4>
                            <span class="empleado-tipo ${empleado.tipo}">${empleado.tipo}</span>
                        </div>
                        <div class="empleado-card-info">
                            Fecha inicio: ${fechaInicio}<br>
                            Fecha fin: ${fechaFin}<br>
                            ${empleado.sustitutoDe ? `Sustituto de: ${this.empleados.find(e => e.id === empleado.sustitutoDe)?.nombre}` : ''}
                        </div>
                        <div class="empleado-card-actions">
                            <button class="btn-accion btn-eliminar" data-empleado-id="${empleado.id}">Eliminar</button>
                        </div>
                    `;
                    
                    temporalContainer.appendChild(card);
                });
            }
        }
    }

    cambiarMes(direccion) {
        this.mesActual += direccion;
        
        if (this.mesActual > 11) {
            this.mesActual = 0;
            this.añoActual++;
        } else if (this.mesActual < 0) {
            this.mesActual = 11;
            this.añoActual--;
        }
        
        this.renderizarCalendario();
    }

    esMismoDia(fecha1, fecha2) {
        return fecha1.getDate() === fecha2.getDate() && 
               fecha1.getMonth() === fecha2.getMonth() && 
               fecha1.getFullYear() === fecha2.getFullYear();
    }

    getEstadoTexto(estado) {
        const estados = {
            trabajando: 'Trabajando',
            vacaciones: 'Vacaciones',
            baja: 'Baja',
            libre: 'Libre'
        };
        return estados[estado] || 'Libre';
    }

    mostrarContextMenu(event, empleadoId, dia) {
        event.preventDefault();
        event.stopPropagation();

        console.log('Mostrando context menu para empleado:', empleadoId, 'dia:', dia);

        const empleado = this.empleados.find(emp => emp.id === empleadoId);
        if (!empleado) return;

        this.currentCell = { empleadoId, dia };
        
        const menu = document.getElementById('contextMenu');
        if (!menu) return;
        
        menu.classList.remove('hidden');
        
        // Posicionar el menú
        const rect = event.target.getBoundingClientRect();
        menu.style.left = `${rect.left + window.scrollX}px`;
        menu.style.top = `${rect.bottom + window.scrollY + 5}px`;
    }

    cambiarEstadoDia(empleadoId, dia, nuevoEstado) {
        const empleado = this.empleados.find(emp => emp.id === empleadoId);
        if (!empleado) return;

        const estadoAnterior = empleado.estadosDias[dia];

        // Validar vacaciones
        if (nuevoEstado === 'vacaciones') {
            if (empleado.tipo === 'fijo' && empleado.vacacionesRestantes <= 0) {
                this.mostrarAlerta('Este empleado no tiene días de vacaciones restantes', 'error');
                return;
            }
        }

        // Actualizar estado
        empleado.estadosDias[dia] = nuevoEstado;

        // Actualizar horario según el estado
        if (nuevoEstado === 'libre') {
            empleado.horariosActuales[dia] = 'libre';
        } else if (nuevoEstado === 'vacaciones') {
            empleado.horariosActuales[dia] = 'Vacaciones';
            if (empleado.tipo === 'fijo') {
                if (estadoAnterior !== 'vacaciones') {
                    empleado.vacacionesRestantes--;
                } 
            }
        } else if (nuevoEstado === 'baja') {
            empleado.horariosActuales[dia] = 'Baja médica';
        } else {
            empleado.horariosActuales[dia] = empleado.horariosOriginales[dia];
        }

        // Restaurar día de vacaciones si se cambia de vacaciones a otro estado
        if (estadoAnterior === 'vacaciones' && nuevoEstado !== 'vacaciones' && empleado.tipo === 'fijo') {
            empleado.vacacionesRestantes++;
        }

        this.renderizarTodo();
        this.mostrarAlerta(`Estado cambiado a ${this.getEstadoTexto(nuevoEstado)} para ${empleado.nombre}`, 'success');
    }

    cerrarContextMenu() {
        const menu = document.getElementById('contextMenu');
        if (menu) {
            menu.classList.add('hidden');
        }
        this.currentCell = null;
    }

    mostrarModalTemporal() {
        console.log('Mostrando modal temporal');
        
        // Llenar opciones de sustituto
        const select = document.getElementById('sustitutoDe');
        if (select) {
            select.innerHTML = '';
            this.empleados.filter(emp => emp.tipo === 'fijo').forEach(empleado => {
                const option = document.createElement('option');
                option.value = empleado.id;
                option.textContent = empleado.nombre;
                select.appendChild(option);
            });
        }

        // Establecer fecha por defecto
        const hoy = new Date();
        const fechaInicio = document.getElementById('fechaInicio');
        const fechaFin = document.getElementById('fechaFin');
        
        if (fechaInicio) {
            fechaInicio.value = hoy.toISOString().split('T')[0];
        }
        
        if (fechaFin) {
            const mesDepues = new Date(hoy);
            mesDepues.setMonth(mesDepues.getMonth() + 1);
            fechaFin.value = mesDepues.toISOString().split('T')[0];
        }

        const modal = document.getElementById('modalTemporal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    cerrarModalTemporal() {
        const modal = document.getElementById('modalTemporal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        const form = document.getElementById('formTemporal');
        if (form) {
            form.reset();
        }
        
        const sustitutoGroup = document.getElementById('sustitutoGroup');
        if (sustitutoGroup) {
            sustitutoGroup.style.display = 'none';
        }
    }

    toggleSustitutoOptions(event) {
        const sustitutoGroup = document.getElementById('sustitutoGroup');
        if (sustitutoGroup) {
            sustitutoGroup.style.display = event.target.value === 'sustituto' ? 'block' : 'none';
        }
    }

    agregarTemporal(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const nombre = formData.get('nombreTemporal');
        const tipo = formData.get('tipoTemporal');
        const fechaInicio = formData.get('fechaInicio');
        const fechaFin = formData.get('fechaFin');
        const sustitutoDe = formData.get('sustitutoDe');

        // Validaciones
        if (!nombre || nombre.trim() === '') {
            this.mostrarAlerta('El nombre es requerido', 'error');
            return;
        }

        if (this.empleados.some(emp => emp.nombre.toLowerCase() === nombre.toLowerCase().trim())) {
            this.mostrarAlerta('Ya existe un empleado con ese nombre', 'error');
            return;
        }

        if (new Date(fechaInicio) > new Date(fechaFin)) {
            this.mostrarAlerta('La fecha de inicio no puede ser posterior a la fecha de fin', 'error');
            return;
        }

        // Recoger horarios
        const horarios = {};
        const estadosDias = {};
        
        this.diasSemana.forEach(dia => {
            const input = document.querySelector(`[data-dia="${dia}"]`);
            const horario = input ? (input.value.trim() || 'libre') : 'libre';
            horarios[dia] = horario;
            estadosDias[dia] = horario === 'libre' ? 'libre' : 'trabajando';
        });

        // Si es sustituto, copiar horarios del empleado original si no se especificaron
        if (tipo === 'sustituto' && sustitutoDe) {
            const empleadoOriginal = this.empleados.find(emp => emp.id == sustitutoDe);
            if (empleadoOriginal) {
                Object.keys(empleadoOriginal.horariosOriginales).forEach(dia => {
                    if (!horarios[dia] || horarios[dia] === 'libre') {
                        horarios[dia] = empleadoOriginal.horariosOriginales[dia];
                        estadosDias[dia] = empleadoOriginal.horariosOriginales[dia] === 'libre' ? 'libre' : 'trabajando';
                    }
                });
            }
        }

        const nuevoEmpleado = {
            id: this.nextId++,
            nombre: nombre.trim(),
            tipo: tipo,
            vacacionesRestantes: 0,
            estado: 'activo',
            fechaInicio: fechaInicio,
            fechaFin: fechaFin,
            horariosOriginales: { ...horarios },
            horariosActuales: { ...horarios },
            estadosDias: { ...estadosDias }
        };

        if (tipo === 'sustituto') {
            nuevoEmpleado.sustitutoDe = parseInt(sustitutoDe);
        }

        this.empleados.push(nuevoEmpleado);
        
        this.renderizarTodo();
        this.cerrarModalTemporal();
        
        this.mostrarAlerta(`${tipo === 'sustituto' ? 'Sustituto' : 'Trabajador temporal'} ${nombre.trim()} añadido correctamente`, 'success');
    }

    mostrarModalConfirmacion(empleado) {
        this.empleadoAEliminar = empleado;
        const mensaje = document.getElementById('mensajeConfirmacion');
        if (mensaje) {
            mensaje.textContent = `¿Está seguro de eliminar al empleado "${empleado.nombre}"?`;
        }
        
        const modal = document.getElementById('modalConfirmacion');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    cerrarModalConfirmacion() {
        const modal = document.getElementById('modalConfirmacion');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.empleadoAEliminar = null;
    }

    confirmarEliminacion() {
        if (this.empleadoAEliminar) {
            const nombre = this.empleadoAEliminar.nombre;
            this.empleados = this.empleados.filter(emp => emp.id !== this.empleadoAEliminar.id);
            this.renderizarTodo();
            this.cerrarModalConfirmacion();
            this.mostrarAlerta(`Empleado ${nombre} eliminado correctamente`, 'success');
        }
    }

    imprimirCuadrante() {
        this.cambiarTab('cuadrante');
        setTimeout(() => {
            window.print();
        }, 100);
    }

    imprimirCalendario() {
        this.cambiarTab('calendario');
        setTimeout(() => {
            window.print();
        }, 100);
    }

    guardarCambios() {
        try {
            const datosGuardado = {
                empleados: this.empleados,
                configuracion: {
                    mesActual: this.mesActual,
                    añoActual: this.añoActual
                },
                timestamp: new Date().toISOString()
            };
            
            console.log('Datos guardados:', datosGuardado);
            this.mostrarAlerta('Cambios guardados correctamente', 'success');
        } catch (error) {
            console.error('Error al guardar:', error);
            this.mostrarAlerta('Error al guardar los cambios', 'error');
        }
    }

    restablecerSemana() {
        if (confirm('¿Está seguro de restablecer la semana? Se perderán todos los cambios no guardados.')) {
            this.empleados.forEach(empleado => {
                if (empleado.tipo === 'fijo') {
                    empleado.horariosActuales = { ...empleado.horariosOriginales };
                    empleado.estadosDias = {};
                    empleado.vacacionesRestantes = 30;
                    
                    this.diasSemana.forEach(dia => {
                        empleado.estadosDias[dia] = empleado.horariosOriginales[dia] === 'libre' ? 'libre' : 'trabajando';
                    });
                }
            });

            // Eliminar empleados temporales
            this.empleados = this.empleados.filter(emp => emp.tipo === 'fijo');

            this.renderizarTodo();
            this.mostrarAlerta('Semana restablecida a valores originales', 'success');
        }
    }

    renderizarResumen() {
        const container = document.getElementById('resumenContainer');
        if (!container) return;
        
        container.innerHTML = '';

        this.empleados.forEach(empleado => {
            const horasSemanales = this.calcularHorasSemanales(empleado);
            const diasTrabajando = this.calcularDiasTrabajando(empleado);
            const diasVacaciones = this.calcularDiasVacaciones(empleado);
            const diasBaja = this.calcularDiasBaja(empleado);

            const div = document.createElement('div');
            div.className = 'resumen-empleado';
            div.innerHTML = `
                <h4>${empleado.nombre} <span style="font-size: 0.8em; color: var(--color-text-secondary);">(${empleado.tipo})</span></h4>
                <div class="resumen-stats">
                    <div>
                        <div>Horas estimadas: <strong>${horasSemanales}h</strong></div>
                        <div>Días trabajando: <strong>${diasTrabajando}</strong></div>
                    </div>
                    <div style="text-align: right;">
                        <div>Vacaciones: <strong>${diasVacaciones}</strong></div>
                        <div>Bajas: <strong>${diasBaja}</strong></div>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    calcularHorasSemanales(empleado) {
        let totalHoras = 0;
        
        this.diasSemana.forEach(dia => {
            if (empleado.estadosDias[dia] === 'trabajando') {
                const horario = empleado.horariosActuales[dia];
                if (horario && horario !== 'libre') {
                    if (horario.includes('18:00-23:30')) {
                        totalHoras += 5.5;
                    } else if (horario.includes('12:00/16:00--19:00-24')) {
                        totalHoras += 9;
                    } else if (horario.includes('12:00/16:00--19:00-23:30')) {
                        totalHoras += 8.5;
                    } else if (horario.includes('12:00-16:00/19:00-24')) {
                        totalHoras += 9;
                    } else {
                        totalHoras += 8;
                    }
                }
            }
        });

        return totalHoras;
    }

    calcularDiasTrabajando(empleado) {
        return this.diasSemana.filter(dia => empleado.estadosDias[dia] === 'trabajando').length;
    }

    calcularDiasVacaciones(empleado) {
        return this.diasSemana.filter(dia => empleado.estadosDias[dia] === 'vacaciones').length;
    }

    calcularDiasBaja(empleado) {
        return this.diasSemana.filter(dia => empleado.estadosDias[dia] === 'baja').length;
    }

    mostrarAlerta(mensaje, tipo = 'info') {
        const alert = document.getElementById('alertContainer');
        const messageEl = document.getElementById('alertMessage');
        
        if (alert && messageEl) {
            messageEl.textContent = mensaje;
            alert.className = `alert ${tipo}`;
            alert.classList.remove('hidden');

            setTimeout(() => {
                this.cerrarAlerta();
            }, 5000);
        }
    }

    cerrarAlerta() {
        const alert = document.getElementById('alertContainer');
        if (alert) {
            alert.classList.add('hidden');
        }
    }
}

// Inicializar la aplicación cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
    window.sistemaHorarios = new SistemaHorarios();
});