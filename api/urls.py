from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, RoleViewSet, DepartamentoViewSet,
    TrabajadorViewSet, ProyectoViewSet, TareaViewSet,
    CustomTokenObtainPairView
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'departamentos', DepartamentoViewSet, basename='departamento')
router.register(r'trabajadores', TrabajadorViewSet, basename='trabajador')
router.register(r'proyectos', ProyectoViewSet, basename='proyecto')
router.register(r'tareas', TareaViewSet, basename='tarea')

urlpatterns = [
    path('', include(router.urls)),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
] 