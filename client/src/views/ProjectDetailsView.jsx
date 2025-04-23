import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export function ProjectDetailsView() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [updatingTask, setUpdatingTask] = useState(false);

  // Obtener los datos del usuario actual desde el token JWT
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUser(decoded);
        console.log('Usuario actual:', decoded);
      } catch (err) {
        console.error('Error al decodificar el token:', err);
      }
    }
  }, []);

  // Helper function to check if a task is assigned to current user
  const isTaskAssignedToCurrentUser = (task) => {
    if (!currentUser || !task) return false;
    
    // Check if we have user_id in the token
    if (currentUser.user_id && task.asignado_a_id) {
      return currentUser.user_id === task.asignado_a_id;
    }
    
    // Fallback to email comparison
    if (currentUser.email && task.asignado_a) {
      return currentUser.email === task.asignado_a;
    }
    
    // Additional fallback for id property
    if (currentUser.id && task.asignado_a_id) {
      return currentUser.id === task.asignado_a_id;
    }
    
    return false;
  };

  // Función para obtener el proyecto desde la API
  const fetchProject = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      // Obtener datos del proyecto
      const response = await axios.get(`http://127.0.0.1:8000/api/proyectos/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Convertir el proyecto del formato de la API
      const proyectoFormateado = {
        id: response.data.id,
        titulo: response.data.titulo,
        descripcion: response.data.descripcion,
        prioridad: mapPrioridad(response.data.prioridad),
        estado: mapEstado(response.data.estado),
        fechaLimite: formatearFecha(response.data.fechaLimite),
        responsable: response.data.responsable ? response.data.responsable.email : 'Sin asignar',
        responsable_id: response.data.responsable ? response.data.responsable.id : null,
        progreso: response.data.progreso,
        creado_por_id: response.data.creado_por,
        desarrolladores: response.data.desarrolladores || []
      };
      
      // Importante: Debido a la restricción en la API, puede que no obtengamos todas las tareas del proyecto
      // a través del endpoint normal de tareas si el usuario no es el responsable o no está asignado a todas
      // las tareas. Por lo tanto, intentaremos obtener las tareas a través del endpoint del proyecto.
      
      let projectTasks = [];
      
      // Intento 1: Obtener tareas a través del endpoint del proyecto
      try {
        // Este enfoque depende de cómo esté configurada la API, puede necesitar ajustes
        const projectWithTasksResponse = await axios.get(`http://127.0.0.1:8000/api/proyectos/${id}/tareas/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (projectWithTasksResponse.data && Array.isArray(projectWithTasksResponse.data)) {
          projectTasks = projectWithTasksResponse.data;
          console.log("Tareas obtenidas desde endpoint de proyecto:", projectTasks.length);
        }
      } catch (error) {
        console.log("No se pudo obtener tareas desde endpoint de proyecto, intentando método alternativo", error.message);
      }
      
      // Intento 2: Si no obtuvimos tareas del proyecto directamente, intentar obtener todas las tareas y filtrar
      if (projectTasks.length === 0) {
        const tasksResponse = await axios.get(`http://127.0.0.1:8000/api/tareas/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Filtrar solo las tareas de este proyecto
        projectTasks = tasksResponse.data.filter(task => 
          task.proyecto && task.proyecto.id === parseInt(id)
        );
        console.log("Tareas obtenidas filtrando desde endpoint general:", projectTasks.length);
      }
      
      // Función para determinar si una tarea está completada
      const isTaskCompleted = (task) => {
        return task.estado === 'C' || 
               task.estado === 'Completado' || 
               task.estado === 'Completada';
      };
      
      // Calcular el progreso basado en todas las tareas del proyecto
      const completedCount = projectTasks.filter(isTaskCompleted).length;
      const totalTasks = projectTasks.length;
      const calculatedProgress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
      
      console.log(`Tareas completadas: ${completedCount}/${totalTasks}`);
      console.log(`Progreso calculado: ${calculatedProgress}%, Progreso en servidor: ${proyectoFormateado.progreso}%`);
      
      // Datos a actualizar en el proyecto si es necesario
      let needsUpdate = false;
      const projectUpdates = {};
      
      // Verificar si el progreso necesita actualizarse
      if (totalTasks > 0 && calculatedProgress !== proyectoFormateado.progreso) {
        console.log(`Actualizando progreso del proyecto: ${proyectoFormateado.progreso}% -> ${calculatedProgress}%`);
        projectUpdates.progreso = calculatedProgress;
        proyectoFormateado.progreso = calculatedProgress;
        needsUpdate = true;
      }
      
      // Verificar si el estado del proyecto necesita actualizarse basado en el progreso
      let expectedEstado;
      if (calculatedProgress === 100) {
        expectedEstado = 'C'; // Completado
        console.log('El proyecto debería estar completado');
      } else if (calculatedProgress > 0) {
        expectedEstado = 'E'; // En Progreso
        console.log('El proyecto debería estar en progreso');
      } else {
        expectedEstado = 'P'; // Pendiente
        console.log('El proyecto debería estar pendiente');
      }
      
      // Obtener el código de estado actual del proyecto
      const estadoActual = Object.keys(mapEstado()).find(
        key => mapEstado(key) === proyectoFormateado.estado
      ) || 'P';
      
      // Verificar si el estado del proyecto necesita actualizarse
      if (expectedEstado !== estadoActual && estadoActual !== 'A') { // No cambiar el estado si está Atrasado
        console.log(`Actualizando estado del proyecto: ${proyectoFormateado.estado} -> ${mapEstado(expectedEstado)}`);
        projectUpdates.estado = expectedEstado;
        proyectoFormateado.estado = mapEstado(expectedEstado);
        needsUpdate = true;
      }
      
      // Si necesitamos actualizar el proyecto, hacerlo
      if (needsUpdate) {
        try {
          await axios.patch(`http://127.0.0.1:8000/api/proyectos/${id}/`, 
            projectUpdates,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          console.log('Proyecto actualizado correctamente');
        } catch (updateError) {
          console.error("Error al actualizar el proyecto:", updateError);
        }
      }
      
      setProject(proyectoFormateado);
      
      // Formatear las tareas
      const formattedTasks = projectTasks.map(task => ({
        id: task.id,
        titulo: task.titulo,
        descripcion: task.descripcion,
        prioridad: mapPrioridad(task.prioridad),
        prioridadCodigo: task.prioridad,
        estado: mapEstado(task.estado),
        estadoCodigo: task.estado,
        fecha_limite: formatearFecha(task.fecha_limite),
        asignado_a: task.asignado_a ? task.asignado_a.email : 'Sin asignar',
        asignado_a_id: task.asignado_a ? task.asignado_a.id : null,
        completada: isTaskCompleted(task)
      }));
      
      console.log(`Total de tareas formateadas: ${formattedTasks.length}`);
      setTasks(formattedTasks);
      setError(null);
    } catch (err) {
      console.error('Error al obtener datos del proyecto:', err);
      setError('No se pudo cargar la información del proyecto. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Función para marcar una tarea como completada/pendiente
  const toggleTaskCompletion = async (taskId, isCompleted) => {
    try {
      setUpdatingTask(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      // Obtener el nuevo estado
      const nuevoEstado = isCompleted ? 'P' : 'C';
      
      // Actualizar la tarea en el backend
      await axios.patch(`http://127.0.0.1:8000/api/tareas/${taskId}/`, 
        { estado: nuevoEstado },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Actualizar tareas localmente
      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            estado: mapEstado(nuevoEstado),
            estadoCodigo: nuevoEstado,
            completada: nuevoEstado === 'C'
          };
        }
        return task;
      });

      setTasks(updatedTasks);
      
      // Recalcular el progreso basado en todas las tareas actualizadas (localmente)
      const completedCount = updatedTasks.filter(task => task.completada).length;
      const totalTasks = updatedTasks.length;
      const newProgress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
      
      console.log(`Progreso actualizado localmente: ${completedCount}/${totalTasks} = ${newProgress}%`);
      
      // Datos a actualizar en el proyecto
      const projectUpdates = { progreso: newProgress };
      
      // Si el progreso llegó al 100%, actualizar también el estado del proyecto a "Completado"
      if (newProgress === 100) {
        projectUpdates.estado = 'C';
        console.log('¡Proyecto completado! Actualizando estado a Completado');
      } else if (newProgress > 0 && newProgress < 100) {
        // Si hay algún progreso pero no está completado, asegurar que esté "En Progreso"
        projectUpdates.estado = 'E';
      }
      
      // Actualizar progreso del proyecto en el backend
      await axios.patch(`http://127.0.0.1:8000/api/proyectos/${id}/`, 
        projectUpdates,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Actualizar proyecto localmente
      if (project) {
        let updatedEstado = project.estado;
        
        if (newProgress === 100) {
          updatedEstado = mapEstado('C');
        } else if (newProgress > 0 && newProgress < 100 && project.estado !== mapEstado('A')) {
          updatedEstado = mapEstado('E');
        }
        
        setProject({
          ...project,
          progreso: newProgress,
          estado: updatedEstado
        });
      }
      
    } catch (err) {
      console.error('Error al actualizar la tarea:', err);
      alert('No se pudo actualizar el estado de la tarea. Inténtelo de nuevo más tarde.');
      // Si ocurre un error, recargamos los datos para asegurar consistencia
      fetchProject();
    } finally {
      setUpdatingTask(false);
    }
  };

  // Función para mapear códigos de prioridad a texto
  const mapPrioridad = (codigo) => {
    const mapa = {
      'B': 'Baja',
      'M': 'Media',
      'A': 'Alta',
      'U': 'Crítica'
    };
    return mapa[codigo] || 'Media';
  };

  // Función para mapear códigos de estado a texto
  const mapEstado = (codigo) => {
    const mapa = {
      'P': 'Pendiente',
      'E': 'En progreso',
      'C': 'Completado',
      'A': 'Atrasado'
    };
    if (!codigo) return mapa; // Si no se proporciona código, devolver el mapa completo
    return mapa[codigo] || 'Pendiente';
  };

  // Función para formatear fechas
  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return 'Sin fecha';
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Cargar proyecto y tareas cuando el componente se monta
  useEffect(() => {
    if (id && currentUser) {
      fetchProject();
    }
  }, [id, currentUser]);

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case "Crítica":
        return "bg-red-100 text-red-800"
      case "Alta":
        return "bg-orange-100 text-orange-800"
      case "Media":
        return "bg-yellow-100 text-yellow-800"
      case "Baja":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "Completado":
        return "bg-green-100 text-green-800"
      case "En progreso":
        return "bg-blue-100 text-blue-800"
      case "Pendiente":
        return "bg-purple-100 text-purple-800"
      case "Atrasado":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProgresoColor = (progreso) => {
    if (progreso < 25) return "bg-red-500"
    if (progreso < 50) return "bg-orange-500"
    if (progreso < 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          {error}
        </div>
        <div className="mt-4">
          <Link to="/" className="text-blue-600 hover:underline">← Volver a proyectos</Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
          Proyecto no encontrado
        </div>
        <div className="mt-4">
          <Link to="/" className="text-blue-600 hover:underline">← Volver a proyectos</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <Link to="/" className="text-blue-600 hover:underline flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a proyectos
        </Link>
      </div>

      {/* Detalles del proyecto */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{project.titulo}</h1>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPrioridadColor(project.prioridad)}`}>
              {project.prioridad}
            </span>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-700 mb-2">Descripción</h2>
            <p className="text-gray-600">{project.descripcion}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-lg font-medium text-gray-700 mb-2">Información General</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Estado</p>
                    <span className={`mt-1 inline-block px-2 py-1 rounded text-xs font-medium ${getEstadoColor(project.estado)}`}>
                      {project.estado}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha límite</p>
                    <p className="font-medium">{project.fechaLimite}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Responsable</p>
                    <p className="font-medium">{project.responsable}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Desarrolladores</p>
                    <p className="font-medium">{project.desarrolladores.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-700 mb-2">Progreso</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-2 flex justify-between">
                  <span className="text-gray-600">Completado</span>
                  <span className="font-medium">{project.progreso}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className={`h-4 rounded-full ${getProgresoColor(project.progreso)}`}
                    style={{ width: `${project.progreso}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de tareas */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Tareas del proyecto</h2>
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar tarea
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
            Este proyecto aún no tiene tareas asignadas.
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completado</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridad</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asignado a</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha límite</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.id} className={`hover:bg-gray-50 ${task.completada ? 'bg-green-50' : ''} ${isTaskAssignedToCurrentUser(task) ? 'border-l-4 border-blue-500' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        {isTaskAssignedToCurrentUser(task) ? (
                          <input 
                            type="checkbox" 
                            checked={task.completada}
                            onChange={() => toggleTaskCompletion(task.id, task.completada)}
                            disabled={updatingTask}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                          />
                        ) : (
                          <div className="relative">
                            <input 
                              type="checkbox" 
                              checked={task.completada}
                              disabled={true}
                              className="h-5 w-5 text-gray-400 border-gray-300 rounded opacity-60 cursor-not-allowed"
                            />
                            {task.completada && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 absolute top-0.5 left-0.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {task.titulo}
                        {isTaskAssignedToCurrentUser(task) && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Asignada a ti
                          </span>
                        )}
                      </div>
                      {task.descripcion && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{task.descripcion}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoColor(task.estado)}`}>
                        {task.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPrioridadColor(task.prioridad)}`}>
                        {task.prioridad}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.asignado_a}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.fecha_limite}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 