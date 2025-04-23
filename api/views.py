from django.shortcuts import render
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
        if self.action == 'create':
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)

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

class TareaViewSet(viewsets.ModelViewSet):
    queryset = Tarea.objects.all()
    serializer_class = TareaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return Tarea.objects.all()
        return Tarea.objects.filter(
            asignado_a=self.request.user
        ) | Tarea.objects.filter(
            proyecto__responsable=self.request.user
        )

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
