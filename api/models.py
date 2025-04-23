from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.core.validators import MaxValueValidator, MinValueValidator

# Create your models here.

class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    roles = models.ManyToManyField(Role, related_name='users')
    email = models.EmailField(_('email address'), unique=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

class Departamento(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)

    def __str__(self):
        return self.nombre

class Trabajador(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='trabajador')
    departamento = models.ForeignKey(Departamento, on_delete=models.SET_NULL, null=True, related_name='trabajadores')
    cargo = models.CharField(max_length=100)
    fecha_contratacion = models.DateField()
    activo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.cargo}"

class Proyecto(models.Model):
    ESTADO_CHOICES = [
        ('P', 'Pendiente'),
        ('E', 'En Progreso'),
        ('C', 'Completado'),
        ('A', 'Atrasado'),
    ]

    PRIORIDAD_CHOICES = [
        ('B', 'Baja'),
        ('M', 'Media'),
        ('A', 'Alta'),
        ('U', 'Urgente'),
    ]

    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    prioridad = models.CharField(max_length=1, choices=PRIORIDAD_CHOICES, default='M')
    estado = models.CharField(max_length=1, choices=ESTADO_CHOICES, default='P')
    fechaLimite = models.DateField()
    responsable = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="proyectos_responsable")
    progreso = models.IntegerField(default=0, validators=[MaxValueValidator(100), MinValueValidator(0)])
    creado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="proyectos_creados")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    desarrolladores = models.ManyToManyField(User, related_name="proyectos_asignados", blank=True)

    def __str__(self):
        return self.titulo

class Tarea(models.Model):
    ESTADO_CHOICES = [
        ('P', 'Pendiente'),
        ('E', 'En Progreso'),
        ('C', 'Completada'),
        ('A', 'Atrasada'),
    ]

    PRIORIDAD_CHOICES = [
        ('B', 'Baja'),
        ('M', 'Media'),
        ('A', 'Alta'),
        ('U', 'Urgente'),
    ]

    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    prioridad = models.CharField(max_length=1, choices=PRIORIDAD_CHOICES, default='M')
    estado = models.CharField(max_length=1, choices=ESTADO_CHOICES, default='P')
    fecha_limite = models.DateField()
    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='tareas')
    asignado_a = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='tareas_asignadas')
    creado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='tareas_creadas')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.titulo

