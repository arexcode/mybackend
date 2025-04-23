from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    User, Role, Departamento, Trabajador, 
    Proyecto, Tarea
)

User = get_user_model()

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description']

class UserSerializer(serializers.ModelSerializer):
    roles = RoleSerializer(many=True, read_only=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'password', 'roles']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password']
        )
        return user

class DepartamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departamento
        fields = ['id', 'nombre', 'descripcion']

class TrabajadorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    departamento = DepartamentoSerializer(read_only=True)
    departamento_id = serializers.PrimaryKeyRelatedField(
        queryset=Departamento.objects.all(),
        source='departamento',
        write_only=True
    )

    class Meta:
        model = Trabajador
        fields = ['id', 'user', 'departamento', 'departamento_id', 'cargo', 'fecha_contratacion', 'activo']

class ProyectoSerializer(serializers.ModelSerializer):
    responsable = UserSerializer(read_only=True)
    responsable_id = serializers.PrimaryKeyRelatedField(
        source='responsable',
        queryset=User.objects.all(),
        required=True
    )
    desarrolladores = UserSerializer(many=True, read_only=True)
    desarrolladores_ids = serializers.PrimaryKeyRelatedField(
        source='desarrolladores',
        queryset=User.objects.all(),
        many=True,
        required=False
    )

    class Meta:
        model = Proyecto
        fields = [
            'id', 'titulo', 'descripcion', 'prioridad', 'estado',
            'fechaLimite', 'responsable', 'responsable_id', 'progreso', 
            'creado_por', 'fecha_creacion', 'fecha_actualizacion', 
            'desarrolladores', 'desarrolladores_ids'
        ]
        read_only_fields = ['creado_por', 'fecha_creacion', 'fecha_actualizacion']
        
    def validate(self, data):
        # Imprimir datos recibidos para depuración
        print(f"Datos recibidos para validación: {data}")
        return data

class TareaSerializer(serializers.ModelSerializer):
    proyecto = ProyectoSerializer(read_only=True)
    proyecto_id = serializers.PrimaryKeyRelatedField(
        queryset=Proyecto.objects.all(),
        source='proyecto',
        write_only=True
    )
    asignado_a = UserSerializer(read_only=True)
    asignado_a_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='asignado_a',
        write_only=True
    )

    class Meta:
        model = Tarea
        fields = [
            'id', 'titulo', 'descripcion', 'prioridad', 'estado',
            'fecha_limite', 'proyecto', 'proyecto_id', 'asignado_a',
            'asignado_a_id', 'creado_por', 'fecha_creacion',
            'fecha_actualizacion'
        ]
        read_only_fields = ['creado_por', 'fecha_creacion', 'fecha_actualizacion']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['roles'] = [role.name for role in user.roles.all()]
        return token
