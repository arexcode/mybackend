import { useState } from "react"
import { useForm } from "../hooks/useForm"
import axios from "axios"
import { toast } from 'react-toastify'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useNavigate } from "react-router-dom"
import classNames from 'classnames'

export function LoginView() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [loginError, setLoginError] = useState(null)
  
  const { onInputChanged, email, password} = useForm({
    email: '',
    password: ''
  })

  const validateForm = () => {
    const newErrors = {}
    
    if (!email) {
      newErrors.email = 'El correo es requerido'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'El correo no es válido'
    }
    
    if (!password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const onLoginUp = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setLoginError(null);
      
      console.log('Iniciando proceso de login con:', { email: email, password: '***' });
      
      const response = await axios.post('http://127.0.0.1:8000/api/token/', {
        email,
        password,
      });
      
      console.log('Respuesta exitosa del servidor:', response.status);
      
      // Guardar tokens en localStorage
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // Notificar a otros componentes sobre el inicio de sesión exitoso
      window.dispatchEvent(new Event('login'));
      
      toast.success('Inicio de sesión exitoso');
      
      // Redirigir al usuario a la página principal con un small delay para permitir que se complete el almacenamiento
      setTimeout(() => {
        navigate('/');
      }, 100);
      
    } catch (error) {
      setLoading(false);
      console.error('Error durante el login:', error);
      
      // Manejar los diferentes tipos de errores
      if (error.response) {
        // El servidor respondió con un estado de error
        if (error.response.status === 401) {
          setLoginError('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
        } else if (error.response.data.detail) {
          setLoginError(error.response.data.detail);
        } else {
          setLoginError('Error en la autenticación. Por favor, intenta nuevamente.');
        }
      } else if (error.request) {
        // La solicitud se hizo pero no se recibió respuesta
        setLoginError('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
      } else {
        // Algo sucedió en la configuración de la solicitud
        setLoginError('Error al intentar iniciar sesión. Por favor, intenta nuevamente.');
      }
      
      toast.error('Error al iniciar sesión');
    } finally {
      // Asegurarse de que isLoading se establezca en false después de un pequeño retraso
      // para evitar la sensación de parpadeo rápido del botón
      setTimeout(() => {
        setLoading(false);
      }, 300);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
              <span className="text-xl font-bold">DB</span>
            </div>
            <h1 className="text-2xl font-bold">Digital Buho S.A.C</h1>
            <p className="text-center text-gray-500">Ingrese sus credenciales corporativas para acceder</p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={onLoginUp}>
            <div className="space-y-1">
              <label htmlFor="email" className="font-medium">
                Correo Corporativo
              </label>
              <input
                value={email}
                name="email"
                onChange={onInputChanged}  
                type="email"
                placeholder="usuario@digitalbuho.com"
                className={classNames(
                  errors.email ? 'border-red-500' : 'border-gray-300 focus:border-gray-400',
                  'w-full rounded-md border p-2.5 outline-none'
                )}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="font-medium">
                Contraseña
              </label>
              <div className="relative">
                <input
                  value={password}
                  name="password"
                  onChange={onInputChanged}
                  type={showPassword ? "text" : "password"}
                  className={classNames(
                    errors.password ? 'border-red-500' : 'border-gray-300 focus:border-gray-400',
                    'w-full rounded-md border p-2.5 outline-none'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </>
                    )}
                  </svg>
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {loginError && (
              <div className="mb-4">
                <p className="text-red-500 text-sm">{loginError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={classNames(
                'w-full rounded-md py-2.5 font-medium text-white',
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800'
              )}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
