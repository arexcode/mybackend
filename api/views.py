from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAdminUser, AllowAny, IsAuthenticated
from django.db import transaction
from .models import (
    User, Role, Departamento, Trabajador,
    Proyecto, Tarea
)
from .serializers import (
    UserSerializer, RoleSerializer, DepartamentoSerializer,
    TrabajadorSerializer, ProyectoSerializer, TareaSerializer,
    CustomTokenObtainPairSerializer
)

User = get_user_model()

# Create your views here.

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)
        
    def update(self, request, *args, **kwargs):
        """Sobrescribimos update para mejorar el manejo de errores y depuración"""
        try:
            # Registrar datos para diagnóstico
            print(f"PUT/PATCH a usuarios/{kwargs.get('pk')} con datos: {request.data}")
            
            # Realizar la actualización estándar
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            
            # Validar manualmente para capturar errores
            if not serializer.is_valid():
                print(f"Errores de validación: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Guardar la instancia
            self.perform_update(serializer)
            
            # Retornar resultado
            return Response(serializer.data)
        except Exception as e:
            print(f"Error no manejado en update: {str(e)}")
            return Response(
                {"error": f"Error al actualizar usuario: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    def perform_update(self, serializer):
        print(f"Datos validados antes de guardar: {serializer.validated_data}")
        serializer.save()

    @action(detail=True, methods=['post'])
    def add_role(self, request, pk=None):
        """Añadir un rol a un usuario"""
        try:
            user = self.get_object()
            role_id = request.data.get('role_id')
            
            if not role_id:
                return Response({"error": "Se requiere role_id"}, status=status.HTTP_400_BAD_REQUEST)
                
            role = get_object_or_404(Role, id=role_id)
            user.roles.add(role)
            
            return Response({"message": f"Rol {role.name} añadido a {user.email}"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
    @action(detail=True, methods=['post'])
    def remove_role(self, request, pk=None):
        """Eliminar un rol de un usuario"""
        try:
            user = self.get_object()
            role_id = request.data.get('role_id')
            
            if not role_id:
                return Response({"error": "Se requiere role_id"}, status=status.HTTP_400_BAD_REQUEST)
                
            role = get_object_or_404(Role, id=role_id)
            
            if role in user.roles.all():
                user.roles.remove(role)
                return Response({"message": f"Rol {role.name} eliminado de {user.email}"})
            else:
                return Response({"error": f"El usuario no tiene el rol {role.name}"}, 
                                status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
    @action(detail=True, methods=['post'])
    def update_roles(self, request, pk=None):
        """Actualizar todos los roles de un usuario"""
        try:
            user = self.get_object()
            role_ids = request.data.get('role_ids', [])
            
            print(f"Actualizando roles para usuario {user.email} (ID: {user.id})")
            print(f"Role IDs recibidos: {role_ids}")
            
            # Validar que todos los IDs de roles son válidos
            roles = []
            invalid_roles = []
            
            for role_id in role_ids:
                try:
                    role = Role.objects.get(id=role_id)
                    roles.append(role)
                except Role.DoesNotExist:
                    invalid_roles.append(role_id)
                    print(f"Rol con ID {role_id} no existe")
            
            if invalid_roles:
                return Response(
                    {"error": f"Los siguientes roles no existen: {invalid_roles}"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Obtener roles actuales para registro
            current_roles = list(user.roles.all())
            print(f"Roles actuales: {[r.name for r in current_roles]}")
            
            # Limpiar roles existentes
            user.roles.clear()
            print(f"Roles eliminados para usuario {user.email}")
            
            # Añadir los nuevos roles
            for role in roles:
                user.roles.add(role)
                print(f"Rol {role.name} añadido a {user.email}")
                
            # Obtener roles actualizados para registro
            updated_roles = list(user.roles.all())
            print(f"Roles actualizados: {[r.name for r in updated_roles]}")
                
            return Response({
                "message": f"Roles actualizados para {user.email}",
                "previous_roles": [{"id": r.id, "name": r.name} for r in current_roles],
                "current_roles": [{"id": r.id, "name": r.name} for r in updated_roles]
            })
        except Exception as e:
            print(f"Error en update_roles: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAdminUser]

class DepartamentoViewSet(viewsets.ModelViewSet):
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer
    permission_classes = [IsAuthenticated]

class TrabajadorViewSet(viewsets.ModelViewSet):
    queryset = Trabajador.objects.all()
    serializer_class = TrabajadorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return Trabajador.objects.all()
        return Trabajador.objects.filter(user=self.request.user)

class ProyectoViewSet(viewsets.ModelViewSet):
    queryset = Proyecto.objects.all()
    serializer_class = ProyectoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        print(f"Usuario actual en get_queryset: {self.request.user}")
        print(f"ID del usuario: {self.request.user.id}")
        print(f"Es superusuario: {self.request.user.is_superuser}")
        
        if self.request.user.is_superuser:
            queryset = Proyecto.objects.all()
        else:
            # Usuario puede ver proyectos donde es responsable o desarrollador
            queryset = Proyecto.objects.filter(
                responsable=self.request.user
            ) | Proyecto.objects.filter(
                desarrolladores=self.request.user
            ) | Proyecto.objects.filter(
                creado_por=self.request.user
            )
            
            # Si aún así no hay proyectos visibles, mostrar todos (esto se puede ajustar según necesidades)
            if not queryset.exists():
                queryset = Proyecto.objects.all()
        
        print(f"Total de proyectos encontrados: {queryset.count()}")
        return queryset

    def list(self, request, *args, **kwargs):
        print("Método list ejecutándose")
        queryset = self.filter_queryset(self.get_queryset())
        print(f"Proyectos después de filtrar: {queryset.count()}")
        
        # Depurar proyectos disponibles
        for proyecto in queryset:
            print(f"Proyecto ID: {proyecto.id}, Título: {proyecto.titulo}, Responsable: {proyecto.responsable_id}, Creado por: {proyecto.creado_por_id}")
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        try:
            # Aseguramos que el usuario actual sea asignado como creado_por
            with transaction.atomic():
                print(f"Usuario actual: {self.request.user}")
                print(f"ID del usuario: {self.request.user.id}")
                print(f"Datos validados: {serializer.validated_data}")
                serializer.save(creado_por=self.request.user)
        except Exception as e:
            # Registrar el error para diagnóstico
            print(f"Error al crear proyecto: {str(e)}")
            raise

    @action(detail=True, methods=['get'])
    def tareas(self, request, pk=None):
        """
        Obtiene todas las tareas asociadas a un proyecto específico,
        independientemente del usuario que hace la solicitud.
        """
        try:
            proyecto = self.get_object()
            tareas = Tarea.objects.filter(proyecto=proyecto)
            serializer = TareaSerializer(tareas, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class TareaViewSet(viewsets.ModelViewSet):
    queryset = Tarea.objects.all()
    serializer_class = TareaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return Tarea.objects.all()
        
        # Obtener proyectos donde el usuario está involucrado
        proyectos_usuario = Proyecto.objects.filter(
            desarrolladores=self.request.user
        ) | Proyecto.objects.filter(
            responsable=self.request.user
        ) | Proyecto.objects.filter(
            creado_por=self.request.user
        )
        
        return Tarea.objects.filter(
            # Ver tareas asignadas al usuario
            asignado_a=self.request.user
        ) | Tarea.objects.filter(
            # Ver tareas de proyectos donde es responsable
            proyecto__responsable=self.request.user
        ) | Tarea.objects.filter(
            # Ver tareas de proyectos donde es desarrollador
            proyecto__in=proyectos_usuario
        )

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        """Sobrescribimos el método post para depurar"""
        print(f"Solicitud de token para: {request.data.get('email')}")
        
        response = super().post(request, *args, **kwargs)
        
        # Si la autenticación fue exitosa, obtener el usuario
        if response.status_code == 200 and 'email' in request.data:
            try:
                user = User.objects.get(email=request.data['email'])
                print(f"DETALLE DE USUARIO: {user.email}")
                print(f"ROLES: {[role.name for role in user.roles.all()]}")
                print(f"IS_STAFF: {user.is_staff}")
                print(f"IS_SUPERUSER: {user.is_superuser}")
                
                # Actualizar is_staff y is_superuser si es necesario forzar los permisos
                if user.email == 'rafacotrina720@gmail.com' and not (user.is_staff or user.is_superuser):
                    print("Actualizando permisos para usuario administrador")
                    user.is_staff = True
                    user.is_superuser = True
                    user.save()
                
                if user.email == 'rafix@gmail.com' and (user.is_staff or user.is_superuser):
                    print("Corrigiendo permisos para usuario no administrador")
                    user.is_staff = False
                    user.is_superuser = False
                    user.save()
            except User.DoesNotExist:
                print(f"Usuario no encontrado para {request.data['email']}")
            except Exception as e:
                print(f"Error al procesar usuario: {str(e)}")
        
        return response
