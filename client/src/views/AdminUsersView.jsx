import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export function AdminUsersView() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formMode, setFormMode] = useState('create'); // 'create' o 'edit'
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    is_staff: false,
    is_superuser: false,
    roles: []
  });

  // Cargar usuarios y roles al montar el componente
  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  // Función para obtener usuarios y roles
  const fetchUsersAndRoles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      // Obtener usuarios
      const usersResponse = await axios.get('http://127.0.0.1:8000/api/users/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Obtener roles
      const rolesResponse = await axios.get('http://127.0.0.1:8000/api/roles/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setUsers(usersResponse.data);
      setRoles(rolesResponse.data);
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

  // Manejar cambios en roles (checkboxes)
  const handleRoleChange = (roleId) => {
    // Asegurarse de que roleId sea un número
    const numericRoleId = typeof roleId === 'string' ? parseInt(roleId) : roleId;
    
    const roleIndex = formData.roles.indexOf(numericRoleId);
    let newRoles = [...formData.roles];
    
    if (roleIndex === -1) {
      // Añadir rol
      newRoles.push(numericRoleId);
    } else {
      // Quitar rol
      newRoles.splice(roleIndex, 1);
    }
    
    console.log(`Rol ${numericRoleId} ${roleIndex === -1 ? 'añadido' : 'eliminado'}, nuevos roles:`, newRoles);
    setFormData({ ...formData, roles: newRoles });
  };

  // Abrir modal para crear nuevo usuario
  const openCreateModal = () => {
    setFormData({
      email: '',
      username: '',
      password: '',
      first_name: '',
      last_name: '',
      is_staff: false,
      is_superuser: false,
      roles: []
    });
    setFormMode('create');
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  // Abrir modal para editar usuario
  const openEditModal = (user) => {
    setCurrentUser(user);
    
    // Asegurarse de que los IDs de roles sean números
    const roleIds = user.roles ? 
      user.roles.map(role => typeof role.id === 'string' ? parseInt(role.id) : role.id) : 
      [];
    
    console.log('Usuario a editar:', user);
    console.log('Roles del usuario:', user.roles);
    console.log('Role IDs convertidos:', roleIds);
    
    setFormData({
      email: user.email || '',
      username: user.username || '',
      password: '', // No mostrar contraseña
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      is_staff: user.is_staff || false,
      is_superuser: user.is_superuser || false,
      roles: roleIds
    });
    setFormMode('edit');
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  // Cerrar modal
  const closeModal = () => {
    setShowModal(false);
    setCurrentUser(null);
  };

  // Crear usuario
  const createUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Validar que los campos requeridos estén completos
      if (!formData.email || !formData.username || !formData.password) {
        setError('Correo, nombre de usuario y contraseña son obligatorios');
        return;
      }

      // Extraer roles del formData para manejarlos por separado
      const { roles, ...userData } = formData;
      
      console.log('Enviando datos para crear usuario:', userData);

      // Primero crear el usuario
      const response = await axios.post('http://127.0.0.1:8000/api/users/', userData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Usuario creado:', response.data);
      
      // Mostrar mensaje de éxito
      setSuccess(`Usuario ${response.data.username} creado correctamente.`);
      setTimeout(() => setSuccess(null), 5000); // Ocultar después de 5 segundos
      
      // Si hay roles seleccionados, asignarlos al usuario
      if (roles && roles.length > 0) {
        const userId = response.data.id;
        
        // Para cada rol, hacer una petición para asignarlo al usuario
        for (const roleId of roles) {
          await axios.post(`http://127.0.0.1:8000/api/users/${userId}/add_role/`, 
            { role_id: roleId },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
        }
      }
      
      // Actualizar lista de usuarios
      fetchUsersAndRoles();
      closeModal();
    } catch (err) {
      console.error('Error al crear usuario:', err);
      console.error('Detalles del error:', err.response?.data);
      
      let errorMsg = 'No se pudo crear el usuario. ';
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

  // Actualizar usuario - Método simplificado para resolver el problema
  const updateUser = async (e) => {
    e.preventDefault();
    console.group('Actualización de usuario - Método simplificado');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }
      
      // Extraer datos del formulario
      const { roles, password, ...userData } = formData;
      
      // Paso 1: Actualizamos los datos básicos sin la contraseña
      const basicData = {
        email: userData.email,
        username: userData.username,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        is_staff: userData.is_staff || false,
        is_superuser: userData.is_superuser || false
      };
      
      console.log('Actualizando datos básicos del usuario:', basicData);
      
      const basicResponse = await axios.patch(
        `http://127.0.0.1:8000/api/users/${currentUser.id}/`, 
        basicData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Datos básicos actualizados correctamente');
      
      // Paso 2: Si hay una contraseña, enviamos una petición separada
      // Si el backend no tiene un endpoint específico, podemos intentar este método
      let passwordUpdated = false;
      
      if (password && password.trim() !== '') {
        console.log('Enviando actualización de contraseña en solicitud separada');
        
        try {
          // Solución alternativa: Enviamos solo la contraseña en una petición separada
          // Esto debería funcionar si el backend acepta actualizaciones parciales
          await axios.patch(
            `http://127.0.0.1:8000/api/users/${currentUser.id}/`,
            { password: password },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log('Contraseña actualizada correctamente');
          passwordUpdated = true;
        } catch (passwordError) {
          console.error('Error al actualizar contraseña:', passwordError.response?.data);
          setError('La contraseña no pudo ser actualizada. ' + 
                   (passwordError.response?.data?.password || passwordError.message));
        }
      }
      
      // Paso 3: Actualizamos los roles
      await axios.post(
        `http://127.0.0.1:8000/api/users/${currentUser.id}/update_roles/`,
        { role_ids: roles || [] },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Roles actualizados correctamente');
      
      // Mostrar mensaje de éxito
      if (password && !passwordUpdated) {
        setSuccess(`Usuario actualizado, pero la contraseña no se pudo cambiar.`);
      } else {
        setSuccess(`Usuario ${basicResponse.data.username} actualizado correctamente.`);
      }
      
      setTimeout(() => setSuccess(null), 5000);
      
      // Actualizar lista de usuarios y cerrar modal
      fetchUsersAndRoles();
      closeModal();
    } catch (err) {
      console.error('Error en actualización:', err);
      let errorMsg = 'No se pudo actualizar el usuario. ';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          const errorDetails = Object.entries(err.response.data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('; ');
          errorMsg += errorDetails;
        } else {
          errorMsg += err.response.data;
        }
      } else if (err.message) {
        errorMsg += err.message;
      }
      
      setError(errorMsg);
    } finally {
      console.groupEnd();
    }
  };

  // Eliminar usuario
  const deleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`http://127.0.0.1:8000/api/users/${userId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Actualizar lista de usuarios
      fetchUsersAndRoles();
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      setError('No se pudo eliminar el usuario. ' + (err.response?.data?.detail || ''));
    }
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
            <h1 className="text-2xl font-bold text-gray-800">Administración de Usuarios</h1>
            <p className="text-gray-600 mt-1">Gestiona todos los usuarios del sistema</p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Crear Usuario
          </button>
        </div>
        
        {/* Barra de búsqueda y filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Buscar usuarios..."
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
              <option value="TODOS">Todos los roles</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Mensaje de éxito */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
          <button 
            onClick={() => setSuccess(null)}
            className="text-green-600 hover:text-green-800 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}
      
      {/* Tabla de usuarios */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Completo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                        {user.first_name ? user.first_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.first_name || '-'} {user.last_name || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map(role => (
                          <span key={role.id} className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {role.nombre}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">Sin roles</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.is_superuser ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                        Superusuario
                      </span>
                    ) : user.is_staff ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Staff
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Usuario
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p className="text-lg font-medium">No hay usuarios disponibles</p>
                      <p className="text-sm text-gray-400 mt-1">Crea un nuevo usuario para comenzar</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal para crear/editar usuario */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-screen overflow-y-auto">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">
                {formMode === 'create' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
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
              <form onSubmit={formMode === 'create' ? createUser : updateUser}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Nombre</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Apellido</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Apellido"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Nombre de usuario *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder="username"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    {formMode === 'create' ? 'Contraseña *' : 'Nueva contraseña (opcional)'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required={formMode === 'create'}
                    placeholder={formMode === 'create' ? "Contraseña" : "Dejar en blanco para no cambiar"}
                    aria-describedby="passwordHelpBlock"
                  />
                  {formMode === 'edit' && (
                    <p id="passwordHelpBlock" className="text-xs text-gray-500 mt-1">
                      La contraseña actual se mantendrá si dejas este campo vacío.
                    </p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Roles</label>
                  <div className="mt-2 p-3 border border-gray-300 rounded-md shadow-sm overflow-y-auto max-h-40">
                    {roles.map(role => (
                      <div key={role.id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id={`role-${role.id}`}
                          checked={formData.roles.includes(role.id)}
                          onChange={() => handleRoleChange(role.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`role-${role.id}`} className="ml-2 block text-sm text-gray-900">
                          {role.nombre} - {role.descripcion}
                        </label>
                      </div>
                    ))}
                    {roles.length === 0 && (
                      <p className="text-sm text-gray-500">No hay roles disponibles</p>
                    )}
                  </div>
                </div>
                
                <div className="mb-6 space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_staff"
                      name="is_staff"
                      checked={formData.is_staff}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_staff" className="ml-2 block text-sm text-gray-900">
                      Acceso al panel de administración (Staff)
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_superuser"
                      name="is_superuser"
                      checked={formData.is_superuser}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_superuser" className="ml-2 block text-sm text-gray-900">
                      Permisos de superusuario (Acceso total)
                    </label>
                  </div>
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
                    {formMode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
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