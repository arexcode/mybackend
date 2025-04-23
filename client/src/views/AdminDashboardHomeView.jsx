import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export function AdminDashboardHomeView() {
  const [stats, setStats] = useState({
    users: 0,
    projects: 0,
    tasks: 0,
    completedTasks: 0,
    completedProjects: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No se encontró token de autenticación');
        }
        
        // Objeto para almacenar las estadísticas
        const statsData = {
          users: 0,
          projects: 0,
          tasks: 0,
          completedTasks: 0,
          completedProjects: 0
        };
        
        try {
          // Obtener usuarios
          const usersResponse = await axios.get('http://127.0.0.1:8000/api/users/', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          statsData.users = usersResponse.data.length;
        } catch (userError) {
          console.error('Error al obtener usuarios:', userError);
        }
        
        try {
          // Obtener proyectos
          const projectsResponse = await axios.get('http://127.0.0.1:8000/api/proyectos/', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          statsData.projects = projectsResponse.data.length;
          statsData.completedProjects = projectsResponse.data.filter(p => p.estado === 'C').length;
        } catch (projectError) {
          console.error('Error al obtener proyectos:', projectError);
        }
        
        try {
          // Obtener tareas
          const tasksResponse = await axios.get('http://127.0.0.1:8000/api/tareas/', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          statsData.tasks = tasksResponse.data.length;
          statsData.completedTasks = tasksResponse.data.filter(t => t.estado === 'C').length;
        } catch (taskError) {
          console.error('Error al obtener tareas:', taskError);
        }
        
        setStats(statsData);
        
        // Si todas las peticiones fallaron, mostramos error
        if (statsData.users === 0 && statsData.projects === 0 && statsData.tasks === 0) {
          setError('No se pudieron cargar las estadísticas. Por favor, intenta de nuevo más tarde.');
        } else {
          setError(null);
        }
      } catch (err) {
        console.error('Error al obtener estadísticas:', err);
        setError('No se pudieron cargar las estadísticas. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Panel de Control Administrativo</h1>
      
      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm font-medium">Usuarios Totales</h2>
              <p className="text-3xl font-bold text-gray-800">{stats.users}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/users" className="text-blue-600 hover:text-blue-800 text-sm">Ver todos los usuarios →</Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm font-medium">Proyectos</h2>
              <p className="text-3xl font-bold text-gray-800">
                {stats.projects}
                <span className="text-sm text-green-600 ml-2">
                  {stats.completedProjects} completados
                </span>
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/projects" className="text-blue-600 hover:text-blue-800 text-sm">Ver todos los proyectos →</Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm font-medium">Tareas</h2>
              <p className="text-3xl font-bold text-gray-800">
                {stats.tasks}
                <span className="text-sm text-green-600 ml-2">
                  {stats.completedTasks} completadas
                </span>
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/tasks" className="text-blue-600 hover:text-blue-800 text-sm">Ver todas las tareas →</Link>
          </div>
        </div>
      </div>
      
      {/* Acciones rápidas */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            to="/admin/users/new" 
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span className="ml-3 text-blue-800">Crear nuevo usuario</span>
          </Link>
          
          <Link 
            to="/admin/projects/new" 
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <span className="ml-3 text-purple-800">Crear nuevo proyecto</span>
          </Link>
          
          <Link 
            to="/admin/tasks/new" 
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="ml-3 text-green-800">Crear nueva tarea</span>
          </Link>
        </div>
      </div>
      
      {/* Información y ayuda */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Información para administradores</h2>
        <p className="text-gray-600 mb-4">
          Bienvenido al panel de administración. Aquí puedes gestionar todos los aspectos del sistema:
        </p>
        <ul className="list-disc pl-5 text-gray-600 mb-4">
          <li>Gestionar usuarios, proyectos y tareas</li>
          <li>Asignar tareas a los usuarios</li>
          <li>Verificar el progreso de los proyectos</li>
          <li>Generar reportes de actividad</li>
        </ul>
        <p className="text-gray-600">
          Si necesitas ayuda, contacta al equipo de soporte técnico.
        </p>
      </div>
    </div>
  );
} 