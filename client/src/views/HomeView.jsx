import { LogoutButton } from '../components/LogoutButton';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export function HomeView() {
    const [proyectos, setProyectos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [stats, setStats] = useState({
      total: 0,
      enProgreso: 0,
      pendientes: 0,
      completados: 0
    });

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

    // Función para obtener los proyectos desde la API
    const fetchProyectos = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No se encontró token de autenticación');
        }

        const response = await axios.get('http://127.0.0.1:8000/api/proyectos/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Proyectos recibidos:', response.data);

        // Convertir los proyectos del formato de la API al formato que usa el componente
        const proyectosFormateados = response.data.map(proyecto => ({
          id: proyecto.id,
          titulo: proyecto.titulo,
          descripcion: proyecto.descripcion,
          prioridad: mapPrioridad(proyecto.prioridad),
          estado: mapEstado(proyecto.estado),
          fechaLimite: formatearFecha(proyecto.fechaLimite),
          responsable: proyecto.responsable ? proyecto.responsable.email : 'Sin asignar',
          responsable_id: proyecto.responsable ? proyecto.responsable.id : null,
          progreso: proyecto.progreso,
          creado_por_id: proyecto.creado_por,
          desarrolladores: proyecto.desarrolladores || []
        }));

        // Filtrar proyectos donde el usuario está involucrado como desarrollador
        const email = currentUser?.email;
        let proyectosFiltrados = proyectosFormateados;
        
        if (email) {
          proyectosFiltrados = proyectosFormateados.filter(proyecto => {
            // El usuario es responsable, creador o desarrollador del proyecto
            const esResponsable = proyecto.responsable === email;
            const esDesarrollador = proyecto.desarrolladores.some(dev => dev.email === email);
            return esResponsable || esDesarrollador;
          });
        }
        
        console.log('Proyectos filtrados:', proyectosFiltrados);
        setProyectos(proyectosFiltrados);
        
        // Calcular estadísticas
        const estadisticas = {
          total: proyectosFiltrados.length,
          enProgreso: proyectosFiltrados.filter(p => p.estado === 'En progreso').length,
          pendientes: proyectosFiltrados.filter(p => p.estado === 'Pendiente').length,
          completados: proyectosFiltrados.filter(p => p.estado === 'Completado').length
        };
        
        setStats(estadisticas);
        setError(null);
      } catch (err) {
        console.error('Error al obtener proyectos:', err);
        setError('No se pudieron cargar los proyectos. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
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

    // Cargar proyectos cuando el componente se monta o el usuario cambia
    useEffect(() => {
      if (currentUser) {
        fetchProyectos();
      }
    }, [currentUser]);

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
        case "No iniciado":
          return "bg-gray-100 text-gray-800"
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
  
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Mis Proyectos</h2>
              <p className="mt-2 text-gray-600">
                Visualiza y gestiona los proyectos donde estás involucrado en Digital Buho S.A.C
              </p>
              {currentUser && (
                <p className="mt-1 text-sm text-gray-500">
                  Usuario: {currentUser.email}
                </p>
              )}
            </div>
            <LogoutButton />
          </div>
  
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
              <p className="text-sm text-gray-500">Total de proyectos</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
              <p className="text-sm text-gray-500">En progreso</p>
              <p className="text-2xl font-bold">{stats.enProgreso}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold">{stats.pendientes}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
              <p className="text-sm text-gray-500">Completados</p>
              <p className="text-2xl font-bold">{stats.completados}</p>
            </div>
          </div>

          {!currentUser ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mt-6">
              Iniciando sesión...
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mt-6">
              {error}
            </div>
          ) : proyectos.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mt-6">
              No tienes proyectos asignados como desarrollador o responsable.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {proyectos.map((proyecto) => (
                <div
                  key={proyecto.id}
                  className="bg-white rounded-lg overflow-hidden shadow border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{proyecto.titulo}</h3>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPrioridadColor(
                          proyecto.prioridad,
                        )}`}
                      >
                        {proyecto.prioridad}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{proyecto.descripcion}</p>
    
                    <div className="flex flex-col gap-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Estado:</span>
                        <span className={`px-2 py-0.5 rounded ${getEstadoColor(proyecto.estado)}`}>{proyecto.estado}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Fecha límite:</span>
                        <span className="font-medium">{proyecto.fechaLimite}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Responsable:</span>
                        <span className="font-medium">{proyecto.responsable}</span>
                      </div>
                      {proyecto.desarrolladores && proyecto.desarrolladores.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Desarrolladores:</span>
                          <span className="font-medium">{proyecto.desarrolladores.length}</span>
                        </div>
                      )}
                    </div>
    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Progreso:</span>
                        <span className="font-medium">{proyecto.progreso}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getProgresoColor(proyecto.progreso)}`}
                          style={{ width: `${proyecto.progreso}%` }}
                        ></div>
                      </div>
                    </div>
    
                    <div className="flex justify-between mt-4 pt-4 border-t border-gray-100">
                      <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                        Actualizar
                      </button>
                      <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        Ver detalles
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  