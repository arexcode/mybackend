import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export function AdminProjectTasksView() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    titulo: '',
    descripcion: '',
    fecha_limite: '',
    prioridad: 'M',
    estado: 'P',
    asignado_a: '',
    proyecto: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [priorityFilter, setPriorityFilter] = useState('TODOS');
  const [projectFilter, setProjectFilter] = useState('TODOS');
  
  const priorityLabels = {
    'BAJA': 'Baja',
    'MEDIA': 'Media',
    'ALTA': 'Alta',
    'URGENTE': 'Urgente'
  };
  
  const priorityColors = {
    'BAJA': 'bg-gray-100 text-gray-800',
    'MEDIA': 'bg-blue-100 text-blue-800',
    'ALTA': 'bg-orange-100 text-orange-800',
    'URGENTE': 'bg-red-100 text-red-800'
  };
  
  const statusLabels = {
    'PENDIENTE': 'Pendiente',
    'EN_PROGRESO': 'En Progreso',
    'COMPLETADO': 'Completado',
    'CANCELADO': 'Cancelado'
  };
  
  const statusColors = {
    'PENDIENTE': 'bg-yellow-100 text-yellow-800',
    'EN_PROGRESO': 'bg-blue-100 text-blue-800',
    'COMPLETADO': 'bg-green-100 text-green-800',
    'CANCELADO': 'bg-red-100 text-red-800'
  };

  // Función para normalizar estados
  const normalizeStatus = (status) => {
    // Convertir a mayúscula para comparación insensible
    if (!status) return '';
    
    const statusUpper = status.toUpperCase();
    
    // Mapeo para normalizar diferentes formatos de estado
    if (statusUpper === 'P' || statusUpper === 'PENDING' || statusUpper === 'PENDIENTE') return 'PENDIENTE';
    if (statusUpper === 'E' || statusUpper === 'IP' || statusUpper === 'IN_PROGRESS' || statusUpper === 'EN PROGRESO' || statusUpper === 'EN_PROGRESO') return 'EN_PROGRESO';
    if (statusUpper === 'C' || statusUpper === 'COMPLETE' || statusUpper === 'COMPLETED' || statusUpper === 'COMPLETADO' || statusUpper === 'COMPLETADA') return 'COMPLETADO';
    if (statusUpper === 'A' || statusUpper === 'DELAYED' || statusUpper === 'ATRASADO' || statusUpper === 'CANCELED' || statusUpper === 'CANCELADO') return 'CANCELADO';
    
    return status; // Si no coincide con ninguno, devolver el original
  };
  
  // Función para normalizar prioridades
  const normalizePriority = (priority) => {
    if (!priority) return '';
    
    const priorityUpper = priority.toUpperCase();
    
    if (priorityUpper === 'B' || priorityUpper === 'BAJA' || priorityUpper === 'LOW') return 'BAJA';
    if (priorityUpper === 'M' || priorityUpper === 'MEDIA' || priorityUpper === 'MEDIUM' || priorityUpper === 'NORMAL') return 'MEDIA';
    if (priorityUpper === 'A' || priorityUpper === 'ALTA' || priorityUpper === 'HIGH') return 'ALTA';
    if (priorityUpper === 'U' || priorityUpper === 'URGENTE' || priorityUpper === 'URGENT') return 'URGENTE';
    
    return priority;
  };
  
  // Función para obtener texto de estado a partir de cualquier formato de estado
  const getStatusText = (statusCode) => {
    const normalizedStatus = normalizeStatus(statusCode);
    return statusLabels[normalizedStatus] || 'Desconocido';
  };
  
  // Función para obtener clase CSS del estado a partir de cualquier formato de estado
  const getStatusClass = (statusCode) => {
    const normalizedStatus = normalizeStatus(statusCode);
    return statusColors[normalizedStatus] || 'bg-gray-100 text-gray-800';
  };
  
  // Función para obtener texto de prioridad a partir de cualquier formato de prioridad
  const getPriorityText = (priorityCode) => {
    const normalizedPriority = normalizePriority(priorityCode);
    return priorityLabels[normalizedPriority] || 'Desconocida';
  };
  
  // Función para obtener clase CSS de la prioridad a partir de cualquier formato de prioridad
  const getPriorityClass = (priorityCode) => {
    const normalizedPriority = normalizePriority(priorityCode);
    return priorityColors[normalizedPriority] || 'bg-gray-100 text-gray-800';
  };

  const formatDateForAPI = (dateString) => {
    if (!dateString) return null;
    
    try {
      // Asegurar que la fecha esté en formato YYYY-MM-DD
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Fecha inválida:', dateString);
        return null;
      }
      
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return null;
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
    }
    fetchAllProjects();
    fetchTasks();
    fetchUsers();
  }, [projectId]);

  useEffect(() => {
    applyFilters();
  }, [tasks, searchTerm, statusFilter, priorityFilter, projectFilter]);

  const fetchProjectDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      const response = await axios.get(`http://127.0.0.1:8000/api/proyectos/${projectId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setProject(response.data);
    } catch (err) {
      console.error('Error al obtener detalles del proyecto:', err);
      setError('No se pudo cargar la información del proyecto. Por favor, intenta de nuevo más tarde.');
    }
  };

  const fetchAllProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      const response = await axios.get('http://127.0.0.1:8000/api/proyectos/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setAllProjects(response.data);
    } catch (err) {
      console.error('Error al obtener lista de proyectos:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      // Si hay un projectId específico, intentamos obtener las tareas de ese proyecto
      if (projectId) {
        try {
          // Intenta obtener tareas desde el endpoint específico del proyecto
          const response = await axios.get(`http://127.0.0.1:8000/api/proyectos/${projectId}/tareas/`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          console.log("Tareas obtenidas desde endpoint específico:", response.data);
          
          if (response.data && response.data.length > 0) {
            setTasks(response.data);
            setFilteredTasks(response.data);
            setError(null);
            return;
          }
        } catch (specificEndpointError) {
          console.error('Error en endpoint específico de tareas:', specificEndpointError);
          // Si falla, continúa con el endpoint general
        }
      }

      // Si no hay projectId o falló el endpoint específico, obtenemos todas las tareas
      console.log("Obteniendo todas las tareas...");
      const allTasksResponse = await axios.get('http://127.0.0.1:8000/api/tareas/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log("Todas las tareas obtenidas:", allTasksResponse.data);
      
      // Si hay un projectId, filtramos las tareas para ese proyecto
      if (projectId) {
        const projectTasks = allTasksResponse.data.filter(task => 
          task.proyecto == projectId || 
          (task.proyecto && task.proyecto.id == projectId)
        );
        
        console.log(`Tareas filtradas para el proyecto ${projectId}:`, projectTasks);
        setTasks(projectTasks);
        setFilteredTasks(projectTasks);
      } else {
        // Si no hay projectId, mostramos todas las tareas
        setTasks(allTasksResponse.data);
        setFilteredTasks(allTasksResponse.data);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error al obtener tareas:', err);
      setError('No se pudieron cargar las tareas. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      const response = await axios.get('http://127.0.0.1:8000/api/users/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setUsers(response.data);
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];
    
    // Agregar debug para ver los valores reales
    console.log("Tareas originales para filtrar:", tasks);
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
        task.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrar por proyecto
    if (projectFilter !== 'TODOS') {
      filtered = filtered.filter(task => {
        const projectIdFromTask = task.proyecto?.id || task.proyecto;
        return projectIdFromTask == projectFilter;
      });
    }
    
    // Filtrar por estado
    if (statusFilter !== 'TODOS') {
      filtered = filtered.filter(task => {
        const normalizedTaskStatus = normalizeStatus(task.estado);
        console.log(`Comparando estado: ${task.estado} (normalizado: ${normalizedTaskStatus}) con filtro: ${statusFilter}`);
        return normalizedTaskStatus === statusFilter;
      });
    }
    
    // Filtrar por prioridad
    if (priorityFilter !== 'TODOS') {
      filtered = filtered.filter(task => {
        const normalizedTaskPriority = normalizePriority(task.prioridad);
        console.log(`Comparando prioridad: ${task.prioridad} (normalizado: ${normalizedTaskPriority}) con filtro: ${priorityFilter}`);
        return normalizedTaskPriority === priorityFilter;
      });
    }
    
    console.log("Tareas filtradas:", filtered);
    setFilteredTasks(filtered);
  };

  // Función para obtener un ID numérico válido o null
  const getSafeId = (value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    // Si es un objeto con propiedad id
    if (typeof value === 'object' && value !== null && 'id' in value) {
      return parseInt(value.id, 10);
    }
    
    // Si es un string o número
    const parsedValue = parseInt(value, 10);
    return isNaN(parsedValue) ? null : parsedValue;
  };

  // Función para obtener un ID de proyecto obligatorio
  const getRequiredProjectId = (proyecto) => {
    // Primero intentamos obtener el ID usando nuestra función genérica
    const id = getSafeId(proyecto);
    
    // Si el ID es null o undefined, intentamos usar el ID del proyecto actual si existe
    if (id === null && projectId) {
      return parseInt(projectId, 10);
    }
    
    return id;
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      // Validamos que haya un proyecto seleccionado
      const proyectoId = getRequiredProjectId(newTask.proyecto);
      
      if (proyectoId === null) {
        alert('Por favor, selecciona un proyecto válido para la tarea');
        return;
      }
      
      console.log('Valores originales:', {
        proyecto: newTask.proyecto,
        asignado_a: newTask.asignado_a
      });
      
      console.log('IDs convertidos:', {
        proyecto_id: proyectoId,
        asignado_a_id: getSafeId(newTask.asignado_a)
      });
      
      // Mapea los valores de estado y prioridad a los códigos de una letra si es necesario
      const taskData = {
        titulo: newTask.titulo,
        descripcion: newTask.descripcion,
        fecha_limite: formatDateForAPI(newTask.fecha_limite),
        prioridad: normalizePriorityToCode(newTask.prioridad),
        estado: normalizeStatusToCode(newTask.estado),
        proyecto_id: proyectoId,  // CAMBIADO: de "proyecto" a "proyecto_id"
        asignado_a_id: getSafeId(newTask.asignado_a) || null  // CAMBIADO: de "asignado_a" a "asignado_a_id"
      };

      console.log('Enviando datos para crear tarea:', JSON.stringify(taskData, null, 2));

      const response = await axios.post('http://127.0.0.1:8000/api/tareas/', taskData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Respuesta del servidor:', response.data);

      setNewTask({
        titulo: '',
        descripcion: '',
        fecha_limite: '',
        prioridad: 'M',
        estado: 'P',
        asignado_a: '',
        proyecto: ''
      });
      
      setIsModalOpen(false);
      await fetchTasks();
    } catch (err) {
      console.error('Error al crear tarea:', err);
      let errorMsg = 'Error al crear tarea: ';
      
      if (err.response) {
        console.error('Status del error:', err.response.status);
        console.error('Detalles del error:', JSON.stringify(err.response.data, null, 2));
        
        if (typeof err.response.data === 'object') {
          // Construir un mensaje de error detallado a partir de los errores del backend
          errorMsg += Object.entries(err.response.data)
            .map(([field, errors]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`;
              }
              return `${field}: ${errors}`;
            })
            .join('\n');
        } else {
          errorMsg += err.response.data || err.message;
        }
      } else {
        errorMsg += err.message;
      }
      
      alert(errorMsg);
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      const proyectoId = getRequiredProjectId(selectedTask.proyecto);
      
      if (proyectoId === null) {
        alert('El ID del proyecto es requerido. Por favor, selecciona un proyecto válido.');
        return;
      }
      
      console.log('Valores originales (edición):', {
        proyecto: selectedTask.proyecto,
        asignado_a: selectedTask.asignado_a
      });
      
      console.log('IDs convertidos (edición):', {
        proyecto_id: proyectoId,
        asignado_a_id: getSafeId(selectedTask.asignado_a)
      });
      
      // Mapea los valores de estado y prioridad a los códigos de una letra si es necesario
      const taskData = {
        titulo: selectedTask.titulo,
        descripcion: selectedTask.descripcion,
        fecha_limite: formatDateForAPI(selectedTask.fecha_limite),
        prioridad: normalizePriorityToCode(selectedTask.prioridad),
        estado: normalizeStatusToCode(selectedTask.estado),
        proyecto_id: proyectoId,  // CAMBIADO: de "proyecto" a "proyecto_id"
        asignado_a_id: getSafeId(selectedTask.asignado_a) || null  // CAMBIADO: de "asignado_a" a "asignado_a_id"
      };

      console.log('Enviando datos para actualizar tarea:', JSON.stringify(taskData, null, 2));
      console.log('ID de la tarea a actualizar:', selectedTask.id);

      const response = await axios.put(`http://127.0.0.1:8000/api/tareas/${selectedTask.id}/`, taskData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Respuesta del servidor:', response.data);

      setIsModalOpen(false);
      await fetchTasks();
    } catch (err) {
      console.error('Error al actualizar tarea:', err);
      let errorMsg = 'Error al actualizar tarea: ';
      
      if (err.response) {
        console.error('Status del error:', err.response.status);
        console.error('Detalles del error:', JSON.stringify(err.response.data, null, 2));
        
        if (typeof err.response.data === 'object') {
          // Construir un mensaje de error detallado a partir de los errores del backend
          errorMsg += Object.entries(err.response.data)
            .map(([field, errors]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`;
              }
              return `${field}: ${errors}`;
            })
            .join('\n');
        } else {
          errorMsg += err.response.data || err.message;
        }
      } else {
        errorMsg += err.message;
      }
      
      alert(errorMsg);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta tarea? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      await axios.delete(`http://127.0.0.1:8000/api/tareas/${taskId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      await fetchTasks();
    } catch (err) {
      console.error('Error al eliminar tarea:', err);
      alert('Error al eliminar tarea: ' + (err.response?.data?.detail || err.message));
    }
  };

  const openCreateModal = () => {
    setEditMode(false);
    // Si hay un projectId disponible (estamos en la vista de un proyecto específico),
    // lo configuramos directamente
    const initialProject = projectId || '';
    
    setNewTask({
      titulo: '',
      descripcion: '',
      fecha_limite: '',
      prioridad: 'M',
      estado: 'P',
      asignado_a: '',
      proyecto: initialProject
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    console.log('Tarea original a editar:', JSON.stringify(task, null, 2));
    
    setEditMode(true);
    
    // Convertir de formato largo a código de una letra para el estado y prioridad
    const getEstadoCodigo = (estado) => {
      if (!estado) return 'P';
      const estadoUpper = typeof estado === 'string' ? estado.toUpperCase() : '';
      if (estadoUpper === 'PENDIENTE' || estadoUpper.startsWith('P')) return 'P';
      if (estadoUpper === 'EN_PROGRESO' || estadoUpper.startsWith('E')) return 'E';
      if (estadoUpper === 'COMPLETADO' || estadoUpper.startsWith('C')) return 'C';
      if (estadoUpper === 'CANCELADO' || estadoUpper.startsWith('A')) return 'A';
      return estado.length === 1 ? estado : 'P';
    };
    
    const getPrioridadCodigo = (prioridad) => {
      if (!prioridad) return 'M';
      const prioridadUpper = typeof prioridad === 'string' ? prioridad.toUpperCase() : '';
      if (prioridadUpper === 'BAJA' || prioridadUpper.startsWith('B')) return 'B';
      if (prioridadUpper === 'MEDIA' || prioridadUpper.startsWith('M')) return 'M';
      if (prioridadUpper === 'ALTA' || prioridadUpper.startsWith('A')) return 'A';
      if (prioridadUpper === 'URGENTE' || prioridadUpper.startsWith('U')) return 'U';
      return prioridad.length === 1 ? prioridad : 'M';
    };
    
    // Asegurar que proyecto sea un ID válido (nunca debe ser null)
    const getProyectoId = (proyecto) => {
      // Primero intentamos extraer el ID si es un objeto
      if (typeof proyecto === 'object' && proyecto !== null) {
        if ('id' in proyecto) return proyecto.id;
        // Si no tiene ID pero tenemos el ID actual, usamos ese
        if (projectId) return projectId;
      }
      
      // Si es un valor primitivo (string o número)
      if (proyecto) return proyecto;
      
      // Si no hay valor pero estamos en contexto de proyecto, usamos ese ID
      if (projectId) return projectId;
      
      // Como último recurso, buscamos el primer proyecto disponible si hay alguno
      if (allProjects && allProjects.length > 0) return allProjects[0].id;
      
      return '';  // No deberíamos llegar aquí si hay al menos un proyecto
    };
    
    // Asegurar que el usuario asignado sea un ID
    const getUsuarioId = (usuario) => {
      if (!usuario) return '';
      if (typeof usuario === 'object' && usuario.id) return usuario.id;
      return usuario;
    };
    
    // Determinar la fecha correcta
    let fechaLimite = null;
    if (task.fecha_limite) {
      fechaLimite = task.fecha_limite;
    } else if (task.fecha_vencimiento) { // Comprobación para campos alternativos
      fechaLimite = task.fecha_vencimiento;
    }
    
    const formattedTask = {
      id: task.id,
      titulo: task.titulo || '',
      descripcion: task.descripcion || '',
      fecha_limite: fechaLimite ? formatDateForAPI(fechaLimite) : '',
      estado: getEstadoCodigo(task.estado),
      prioridad: getPrioridadCodigo(task.prioridad),
      proyecto: getProyectoId(task.proyecto),
      asignado_a: getUsuarioId(task.asignado_a)
    };
    
    console.log('Tarea formateada para editar:', JSON.stringify(formattedTask, null, 2));
    
    setSelectedTask(formattedTask);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (editMode) {
      setSelectedTask(prevState => ({
        ...prevState,
        [name]: value
      }));
    } else {
      setNewTask(prevState => ({
        ...prevState,
        [name]: value
      }));
    }
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === parseInt(userId));
    return user ? `${user.first_name} ${user.last_name} (${user.username})` : 'No asignado';
  };

  const getProjectName = (projectId) => {
    if (!projectId) return 'Sin proyecto';
    
    const project = allProjects.find(p => p.id == projectId);
    return project ? project.titulo : `Proyecto #${projectId}`;
  };

  // Función para normalizar estado a código de 1 letra
  const normalizeStatusToCode = (status) => {
    if (!status) return 'P';
    if (status.length === 1) return status.toUpperCase();
    
    const statusUpper = status.toUpperCase();
    if (statusUpper === 'PENDIENTE') return 'P';
    if (statusUpper === 'EN_PROGRESO') return 'E';
    if (statusUpper === 'COMPLETADO') return 'C';
    if (statusUpper === 'CANCELADO') return 'A';
    
    return 'P'; // Valor predeterminado
  };

  // Función para normalizar prioridad a código de 1 letra
  const normalizePriorityToCode = (priority) => {
    if (!priority) return 'M';
    if (priority.length === 1) return priority.toUpperCase();
    
    const priorityUpper = priority.toUpperCase();
    if (priorityUpper === 'BAJA') return 'B';
    if (priorityUpper === 'MEDIA') return 'M';
    if (priorityUpper === 'ALTA') return 'A';
    if (priorityUpper === 'URGENTE') return 'U';
    
    return 'M'; // Valor predeterminado
  };

  if (loading && !project) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Encabezado con detalles del proyecto */}
      {project && (
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <Link 
              to="/admin/projects" 
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver a proyectos
            </Link>
            <h1 className="text-2xl font-bold">Tareas del proyecto: {project.nombre}</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium text-gray-700">Descripción</h3>
              <p className="mt-1">{project.descripcion}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium text-gray-700">Fechas</h3>
              <p className="mt-1">Inicio: {new Date(project.fecha_inicio).toLocaleDateString()}</p>
              {project.fecha_fin && (
                <p>Fin: {new Date(project.fecha_fin).toLocaleDateString()}</p>
              )}
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium text-gray-700">Estado</h3>
              <div className="mt-1">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[project.estado]}`}>
                  {statusLabels[project.estado]}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">{projectId ? 'Listado de Tareas del Proyecto' : 'Listado de Todas las Tareas'}</h2>
        <button 
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
        >
          Crear Tarea
        </button>
      </div>
      
      {/* Filtros */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar tareas..."
            className="w-full p-3 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-3 top-3 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        {!projectId && (
          <select
            className="p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="TODOS">Todos los proyectos</option>
            {allProjects.map(project => (
              <option key={project.id} value={project.id}>
                {project.titulo}
              </option>
            ))}
          </select>
        )}
        
        <select
          className="p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="TODOS">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="EN_PROGRESO">En Progreso</option>
          <option value="COMPLETADO">Completado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
        
        <select
          className="p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="TODOS">Todas las prioridades</option>
          <option value="BAJA">Baja</option>
          <option value="MEDIA">Media</option>
          <option value="ALTA">Alta</option>
          <option value="URGENTE">Urgente</option>
        </select>
      </div>
      
      {/* Estado de carga */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      )}
      
      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}
      
      {/* Tabla de tareas */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
              {!projectId && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proyecto</th>
              )}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridad</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha vencimiento</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asignado a</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{task.titulo}</div>
                  <div className="text-sm text-gray-500">{task.descripcion}</div>
                </td>
                {!projectId && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getProjectName(task.proyecto?.id || task.proyecto)}</div>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityClass(task.prioridad)}`}>
                    {getPriorityText(task.prioridad)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(task.estado)}`}>
                    {getStatusText(task.estado)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {task.fecha_limite ? new Date(task.fecha_limite).toLocaleDateString() : 'No definida'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {task.asignado_a ? getUserName(task.asignado_a) : 'No asignado'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => openEditModal(task)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTasks.length === 0 && !loading && (
          <div className="p-6 text-center text-gray-500">
            No se encontraron tareas que coincidan con los filtros.
          </div>
        )}
      </div>
      
      {/* Modal para crear/editar tarea */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg rounded-md shadow-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{editMode ? 'Editar Tarea' : 'Crear Tarea'}</h3>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={editMode ? handleUpdateTask : handleCreateTask}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Título de la tarea:</label>
                <input 
                  type="text" 
                  name="titulo" 
                  value={editMode ? selectedTask.titulo : newTask.titulo} 
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                  required 
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Descripción:</label>
                <textarea 
                  name="descripcion" 
                  value={editMode ? selectedTask.descripcion : newTask.descripcion} 
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                  rows="3"
                  required 
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Fecha de vencimiento (opcional):</label>
                <input 
                  type="date" 
                  name="fecha_limite" 
                  value={editMode ? selectedTask.fecha_limite : newTask.fecha_limite} 
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Prioridad:</label>
                  <select 
                    name="prioridad" 
                    value={editMode ? selectedTask.prioridad : newTask.prioridad} 
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                  >
                    <option value="B">Baja</option>
                    <option value="M">Media</option>
                    <option value="A">Alta</option>
                    <option value="U">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Estado:</label>
                  <select 
                    name="estado" 
                    value={editMode ? selectedTask.estado : newTask.estado} 
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                  >
                    <option value="P">Pendiente</option>
                    <option value="E">En Progreso</option>
                    <option value="C">Completado</option>
                    <option value="A">Cancelado</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Proyecto: *</label>
                <select 
                  name="proyecto" 
                  value={editMode ? selectedTask.proyecto : newTask.proyecto} 
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                  required
                >
                  <option value="">Seleccionar proyecto</option>
                  {allProjects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.titulo}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-red-600 mt-1">* El proyecto es obligatorio</p>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">Usuario asignado: *</label>
                <select 
                  name="asignado_a" 
                  value={editMode ? selectedTask.asignado_a : newTask.asignado_a} 
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                  required
                >
                  <option value="">Seleccionar usuario</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.first_name} {user.last_name})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-red-600 mt-1">* El usuario asignado es obligatorio</p>
              </div>
              
              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editMode ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 