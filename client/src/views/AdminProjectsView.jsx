import { useState, useEffect } from 'react';
import axios from 'axios';

export function AdminProjectsView() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [formMode, setFormMode] = useState('create'); // 'create' o 'edit'
  
  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'M',
    estado: 'P',
    fechaLimite: '',
    responsable: '',
    progreso: 0,
    desarrolladores: []
  });

  // Cargar proyectos y usuarios al montar el componente
  useEffect(() => {
    fetchProjectsAndUsers();
  }, []);

  // Función para obtener proyectos y usuarios
  const fetchProjectsAndUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      // Obtener proyectos
      const projectsResponse = await axios.get('http://127.0.0.1:8000/api/proyectos/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Obtener usuarios
      const usersResponse = await axios.get('http://127.0.0.1:8000/api/users/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setProjects(projectsResponse.data);
      setUsers(usersResponse.data);
      setError(null);
    } catch (err) {
      console.error('Error al obtener datos:', err);
      setError('No se pudieron cargar los datos. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Manejar cambios en desarrolladores (select múltiple)
  const handleDeveloperChange = (e) => {
    const options = e.target.options;
    const selectedValues = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(parseInt(options[i].value));
      }
    }
    
    setFormData({ ...formData, desarrolladores: selectedValues });
  };

  // Abrir modal para crear nuevo proyecto
  const openCreateModal = () => {
    // Obtener la fecha de hoy en formato YYYY-MM-DD para el valor predeterminado
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    setFormData({
      titulo: '',
      descripcion: '',
      prioridad: 'M',
      estado: 'P',
      fechaLimite: formattedDate,
      responsable: '',
      progreso: 0,
      desarrolladores: []
    });
    setFormMode('create');
    setShowModal(true);
  };

  // Abrir modal de editar proyecto
  const openEditModal = (project) => {
    console.log('Proyecto a editar:', project);
    setCurrentProject(project);
    setFormMode('edit');
    
    // Convertir los IDs de desarrolladores a números si son strings
    let desarrolladores = [];
    
    // Verificar si tenemos desarrolladores
    if (project.desarrolladores) {
      if (Array.isArray(project.desarrolladores)) {
        // Caso 1: Es un array de objetos con id o un array de ids
        if (project.desarrolladores.length > 0) {
          if (typeof project.desarrolladores[0] === 'object' && project.desarrolladores[0] !== null) {
            // Array de objetos
            desarrolladores = project.desarrolladores.map(dev => 
              typeof dev.id === 'string' ? parseInt(dev.id) : dev.id
            );
          } else {
            // Array de ids
            desarrolladores = project.desarrolladores.map(id => 
              typeof id === 'string' ? parseInt(id) : id
            );
          }
        }
      } else if (typeof project.desarrolladores === 'object' && project.desarrolladores !== null) {
        // Caso 2: Es un objeto (quizás con keys como id1, id2, etc.)
        desarrolladores = Object.values(project.desarrolladores).map(id => 
          typeof id === 'string' ? parseInt(id) : id
        );
      }
    }
    
    // Extraer el ID del responsable
    let responsableId = null;
    
    // Caso 1: Responsable está en un campo responsable_id
    if (project.responsable_id !== undefined && project.responsable_id !== null) {
      responsableId = typeof project.responsable_id === 'string' 
        ? parseInt(project.responsable_id) 
        : project.responsable_id;
    }
    
    // Caso 2: Responsable está en un objeto responsable con una propiedad id
    else if (project.responsable && typeof project.responsable === 'object' && project.responsable !== null) {
      responsableId = typeof project.responsable.id === 'string'
        ? parseInt(project.responsable.id)
        : project.responsable.id;
    }
    
    console.log('Responsable ID:', responsableId);
    console.log('Desarrolladores IDs:', desarrolladores);
    
    // Valores por defecto para los selectores de estado y prioridad
    const estadoDefault = project.estado || 'P';
    const prioridadDefault = project.prioridad || 'M';
    
    setFormData({
      titulo: project.titulo || '',
      descripcion: project.descripcion || '',
      prioridad: prioridadDefault,
      estado: estadoDefault,
      fechaLimite: project.fechaLimite ? project.fechaLimite.split('T')[0] : '',
      progreso: project.progreso || 0,
      responsable: responsableId,
      desarrolladores: desarrolladores
    });
    
    setShowModal(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setShowModal(false);
    setCurrentProject(null);
  };

  // Crear proyecto
  const createProject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Validar que los campos requeridos estén completos
      if (!formData.titulo || !formData.fechaLimite) {
        setError('El título y la fecha límite son obligatorios');
        return;
      }
      
      // Validar que haya un responsable asignado
      if (!formData.responsable) {
        setError('Debes asignar un responsable al proyecto');
        return;
      }

      // Limpiar posibles errores previos
      setError(null);
      
      // Asegurarnos de que los datos están en el formato correcto
      const responsable_id = typeof formData.responsable === 'string' 
        ? parseInt(formData.responsable) 
        : formData.responsable;
      
      const desarrolladores_ids = formData.desarrolladores.map(id => 
        typeof id === 'string' ? parseInt(id) : id
      );

      // Adaptar los datos al formato esperado por el backend
      const projectData = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        prioridad: formData.prioridad,
        estado: formData.estado,
        fechaLimite: formData.fechaLimite,
        progreso: parseInt(formData.progreso),
        responsable_id: responsable_id,
        desarrolladores_ids: desarrolladores_ids
      };

      console.log('Enviando datos para crear proyecto:', projectData);

      const response = await axios.post('http://127.0.0.1:8000/api/proyectos/', projectData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Proyecto creado:', response.data);

      // Actualizar lista de proyectos
      fetchProjectsAndUsers();
      closeModal();
    } catch (err) {
      console.error('Error al crear proyecto:', err);
      let errorMsg = 'No se pudo crear el proyecto. ';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          // Si es un objeto con múltiples errores, mostrarlos todos
          const errorDetails = Object.entries(err.response.data)
            .map(([key, value]) => {
              // Si value es un array, convertirlo a string
              if (Array.isArray(value)) {
                return `${key}: ${value.join(', ')}`;
              }
              return `${key}: ${value}`;
            })
            .join('; ');
          errorMsg += errorDetails;
        } else {
          errorMsg += err.response.data;
        }
      } else if (err.message) {
        errorMsg += err.message;
      }
      
      setError(errorMsg);
    }
  };

  // Actualizar proyecto
  const updateProject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Validar que los campos requeridos estén completos
      if (!formData.titulo || !formData.fechaLimite) {
        setError('El título y la fecha límite son obligatorios');
        return;
      }
      
      // Validar que haya un responsable asignado
      if (!formData.responsable) {
        setError('Debes asignar un responsable al proyecto');
        return;
      }

      // Limpiar posibles errores previos
      setError(null);

      // Asegurarnos de que los datos están en el formato correcto
      const responsable_id = typeof formData.responsable === 'string' 
        ? parseInt(formData.responsable) 
        : formData.responsable;
      
      const desarrolladores_ids = formData.desarrolladores.map(id => 
        typeof id === 'string' ? parseInt(id) : id
      );

      // Adaptar los datos al formato esperado por el backend
      const projectData = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        prioridad: formData.prioridad,
        estado: formData.estado,
        fechaLimite: formData.fechaLimite,
        progreso: parseInt(formData.progreso),
        responsable_id: responsable_id,
        desarrolladores_ids: desarrolladores_ids
      };

      console.log('ID del proyecto a actualizar:', currentProject.id);
      console.log('Enviando datos para actualizar proyecto:', projectData);

      const response = await axios.put(`http://127.0.0.1:8000/api/proyectos/${currentProject.id}/`, projectData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Proyecto actualizado:', response.data);

      // Actualizar lista de proyectos
      fetchProjectsAndUsers();
      closeModal();
    } catch (err) {
      console.error('Error al actualizar proyecto:', err);
      console.error('Detalles del error:', err.response?.data);
      
      let errorMsg = 'No se pudo actualizar el proyecto. ';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          // Si es un objeto con múltiples errores, mostrarlos todos
          const errorDetails = Object.entries(err.response.data)
            .map(([key, value]) => {
              // Si value es un array, convertirlo a string
              if (Array.isArray(value)) {
                return `${key}: ${value.join(', ')}`;
              }
              return `${key}: ${value}`;
            })
            .join('; ');
          errorMsg += errorDetails;
        } else {
          errorMsg += err.response.data;
        }
      } else if (err.message) {
        errorMsg += err.message;
      }
      
      setError(errorMsg);
    }
  };

  // Eliminar proyecto
  const deleteProject = async (projectId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este proyecto? Esta acción eliminará también todas sus tareas asociadas.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`http://127.0.0.1:8000/api/proyectos/${projectId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Actualizar lista de proyectos
      fetchProjectsAndUsers();
    } catch (err) {
      console.error('Error al eliminar proyecto:', err);
      setError('No se pudo eliminar el proyecto. ' + (err.response?.data?.detail || ''));
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Mapear códigos de estado a texto y colores
  const getStatusInfo = (statusCode) => {
    const statusMap = {
      'P': { text: 'Pendiente', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
      'E': { text: 'En Progreso', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
      'C': { text: 'Completado', bgColor: 'bg-green-100', textColor: 'text-green-800' },
      'A': { text: 'Atrasado', bgColor: 'bg-red-100', textColor: 'text-red-800' }
    };
    return statusMap[statusCode] || { text: 'Desconocido', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
  };

  // Mapear códigos de prioridad a texto y colores
  const getPriorityInfo = (priorityCode) => {
    const priorityMap = {
      'B': { text: 'Baja', bgColor: 'bg-green-100', textColor: 'text-green-800' },
      'M': { text: 'Media', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
      'A': { text: 'Alta', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
      'U': { text: 'Urgente', bgColor: 'bg-red-100', textColor: 'text-red-800' }
    };
    return priorityMap[priorityCode] || { text: 'Media', bgColor: 'bg-blue-100', textColor: 'text-blue-800' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Encabezado */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Administración de Proyectos</h1>
            <p className="text-gray-600 mt-1">Gestiona todos los proyectos del sistema</p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Crear Proyecto
          </button>
        </div>
        
        {/* Barra de búsqueda y filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Buscar proyectos..."
              className="w-full p-3 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute left-3 top-3 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="flex gap-2">
            <select className="p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
              <option value="TODOS">Todos los estados</option>
              <option value="P">Pendiente</option>
              <option value="E">En Progreso</option>
              <option value="C">Completado</option>
              <option value="A">Atrasado</option>
            </select>
            <select className="p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
              <option value="TODOS">Todas las prioridades</option>
              <option value="B">Baja</option>
              <option value="M">Media</option>
              <option value="A">Alta</option>
              <option value="U">Urgente</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}
      
      {/* Tabla de proyectos */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Límite</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progreso</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.map(project => {
                const statusInfo = getStatusInfo(project.estado);
                const priorityInfo = getPriorityInfo(project.prioridad);
                
                return (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{project.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{project.titulo}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{project.descripcion}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                        {statusInfo.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityInfo.bgColor} ${priorityInfo.textColor}`}>
                        {priorityInfo.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.responsable ? (
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                            {project.responsable.first_name && project.responsable.last_name ? 
                              `${project.responsable.first_name.charAt(0)}${project.responsable.last_name.charAt(0)}` : 
                              project.responsable.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-700">
                              {project.responsable.first_name} {project.responsable.last_name}
                            </p>
                            <p className="text-xs text-gray-500">{project.responsable.email}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(project.fechaLimite)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                          <div 
                            className={`h-2.5 rounded-full ${
                              project.progreso >= 80 ? 'bg-green-600' : 
                              project.progreso >= 50 ? 'bg-blue-600' : 
                              project.progreso >= 20 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} 
                            style={{ width: `${project.progreso}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{project.progreso}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(project)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteProject(project.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {projects.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-lg font-medium">No hay proyectos disponibles</p>
                      <p className="text-sm text-gray-400 mt-1">Crea un nuevo proyecto para comenzar</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal para crear/editar proyecto */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-screen overflow-y-auto">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">
                {formMode === 'create' ? 'Crear Nuevo Proyecto' : 'Editar Proyecto'}
              </h3>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={formMode === 'create' ? createProject : updateProject}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Título *</label>
                  <input
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder="Ingrese el título del proyecto"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Descripción</label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Descripción detallada del proyecto"
                  ></textarea>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Estado</label>
                    <select
                      name="estado"
                      value={formData.estado}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="P">Pendiente</option>
                      <option value="E">En Progreso</option>
                      <option value="C">Completado</option>
                      <option value="A">Atrasado</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Prioridad</label>
                    <select
                      name="prioridad"
                      value={formData.prioridad}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="B">Baja</option>
                      <option value="M">Media</option>
                      <option value="A">Alta</option>
                      <option value="U">Urgente</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Fecha Límite *</label>
                  <input
                    type="date"
                    name="fechaLimite"
                    value={formData.fechaLimite}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Responsable *</label>
                  <select
                    name="responsable"
                    value={formData.responsable}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccionar responsable</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.email} - {user.first_name} {user.last_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-red-600 mt-1">* El responsable es obligatorio</p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Progreso (%)</label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      name="progreso"
                      value={formData.progreso}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      step="5"
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="ml-2 text-gray-700 min-w-[40px] text-center">{formData.progreso}%</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Desarrolladores</label>
                  <select
                    multiple
                    name="desarrolladores"
                    value={formData.desarrolladores}
                    onChange={handleDeveloperChange}
                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    size="4"
                  >
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.email} - {user.first_name} {user.last_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Mantén presionado Ctrl (Windows) o Cmd (Mac) para seleccionar múltiples desarrolladores
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6 border-t pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {formMode === 'create' ? 'Crear Proyecto' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 