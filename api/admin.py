from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Role, Departamento, Trabajador, Proyecto, Tarea

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active', 'roles')
    search_fields = ('email', 'username')
    ordering = ('email',)
    filter_horizontal = ('roles',)

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'descripcion')
    search_fields = ('nombre',)

@admin.register(Trabajador)
class TrabajadorAdmin(admin.ModelAdmin):
    list_display = ('user', 'departamento', 'cargo', 'fecha_contratacion', 'activo')
    list_filter = ('departamento', 'activo')
    search_fields = ('user__email', 'user__username', 'cargo')

@admin.register(Proyecto)
class ProyectoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'estado', 'prioridad', 'responsable', 'progreso')
    list_filter = ('estado', 'prioridad')
    search_fields = ('titulo', 'descripcion', 'responsable__email')

@admin.register(Tarea)
class TareaAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'estado', 'prioridad', 'proyecto', 'asignado_a', 'fecha_limite')
    list_filter = ('estado', 'prioridad', 'proyecto')
    search_fields = ('titulo', 'descripcion', 'asignado_a__email')
