import os
import django
import sys
import datetime

# Setup Django environment
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Proyecto, Tarea, User
from django.utils import timezone

def create_demo_tasks():
    # Ensure we have users and projects
    users = User.objects.all()
    if not users.exists():
        print("No users found. Please create a user first.")
        return

    default_user = users.first()
    
    projects = Proyecto.objects.all()
    if not projects.exists():
        print("No projects found. Creating demo projects...")
        
        # Create example projects
        project1 = Proyecto.objects.create(
            titulo='Sistema de Gestión de Tareas',
            descripcion='Aplicación web para gestión de tareas y proyectos',
            prioridad='A',
            estado='E',
            fechaLimite=timezone.now().date() + datetime.timedelta(days=30),
            responsable=default_user,
            progreso=60,
            creado_por=default_user
        )
        
        project2 = Proyecto.objects.create(
            titulo='Rediseño de Sitio Web Corporativo',
            descripcion='Actualización completa del sitio web de la empresa',
            prioridad='M',
            estado='P',
            fechaLimite=timezone.now().date() + datetime.timedelta(days=45),
            responsable=default_user,
            progreso=25,
            creado_por=default_user
        )
        
        project3 = Proyecto.objects.create(
            titulo='Aplicación Móvil de Ventas',
            descripcion='Desarrollo de app móvil para equipo de ventas',
            prioridad='U',
            estado='P',
            fechaLimite=timezone.now().date() + datetime.timedelta(days=60),
            responsable=default_user,
            progreso=10,
            creado_por=default_user
        )
        
        projects = [project1, project2, project3]
        print(f"Created {len(projects)} demo projects")
    else:
        # Use existing projects
        projects = list(projects)
        print(f"Using {len(projects)} existing projects")
    
    # Delete existing tasks for clean demo
    Tarea.objects.all().delete()
    
    # Example tasks for projects
    tasks_data = [
        # Project 1 tasks
        {
            'titulo': 'Diseñar interfaz de usuario',
            'descripcion': 'Crear mockups para la interfaz de usuario principal',
            'prioridad': 'M',
            'estado': 'P',
            'fecha_limite': timezone.now().date() + datetime.timedelta(days=10),
            'proyecto': projects[0] if len(projects) > 0 else None,
            'asignado_a': default_user,
            'creado_por': default_user
        },
        {
            'titulo': 'Implementar autenticación',
            'descripcion': 'Integrar sistema de login con JWT',
            'prioridad': 'A',
            'estado': 'E',
            'fecha_limite': timezone.now().date() + datetime.timedelta(days=5),
            'proyecto': projects[0] if len(projects) > 0 else None,
            'asignado_a': default_user,
            'creado_por': default_user
        },
        {
            'titulo': 'Configurar base de datos',
            'descripcion': 'Configurar PostgreSQL y migrar datos existentes',
            'prioridad': 'A',
            'estado': 'C',
            'fecha_limite': timezone.now().date() - datetime.timedelta(days=5),
            'proyecto': projects[0] if len(projects) > 0 else None,
            'asignado_a': default_user,
            'creado_por': default_user
        },
        
        # Project 2 tasks
        {
            'titulo': 'Desarrollo de API REST',
            'descripcion': 'Implementar endpoints para recursos principales',
            'prioridad': 'M',
            'estado': 'E',
            'fecha_limite': timezone.now().date() + datetime.timedelta(days=15),
            'proyecto': projects[1] if len(projects) > 1 else None,
            'asignado_a': default_user,
            'creado_por': default_user
        },
        {
            'titulo': 'Testing de seguridad',
            'descripcion': 'Realizar pruebas de penetración en la API',
            'prioridad': 'U',
            'estado': 'P',
            'fecha_limite': timezone.now().date() + datetime.timedelta(days=20),
            'proyecto': projects[1] if len(projects) > 1 else None,
            'asignado_a': default_user,
            'creado_por': default_user
        },
        {
            'titulo': 'Optimización de consultas',
            'descripcion': 'Mejorar rendimiento de consultas SQL críticas',
            'prioridad': 'A',
            'estado': 'P',
            'fecha_limite': timezone.now().date() + datetime.timedelta(days=12),
            'proyecto': projects[1] if len(projects) > 1 else None,
            'asignado_a': default_user,
            'creado_por': default_user
        },
        
        # Project 3 tasks
        {
            'titulo': 'Documentación técnica',
            'descripcion': 'Crear documentación para desarrolladores',
            'prioridad': 'B',
            'estado': 'P',
            'fecha_limite': timezone.now().date() + datetime.timedelta(days=30),
            'proyecto': projects[2] if len(projects) > 2 else None,
            'asignado_a': default_user,
            'creado_por': default_user
        },
        {
            'titulo': 'Optimización de rendimiento',
            'descripcion': 'Mejorar tiempos de carga en páginas críticas',
            'prioridad': 'A',
            'estado': 'P',
            'fecha_limite': timezone.now().date() + datetime.timedelta(days=25),
            'proyecto': projects[2] if len(projects) > 2 else None,
            'asignado_a': default_user,
            'creado_por': default_user
        },
        {
            'titulo': 'Implementar notificaciones push',
            'descripcion': 'Integrar sistema de notificaciones en tiempo real',
            'prioridad': 'M',
            'estado': 'P',
            'fecha_limite': timezone.now().date() + datetime.timedelta(days=18),
            'proyecto': projects[2] if len(projects) > 2 else None,
            'asignado_a': default_user,
            'creado_por': default_user
        },
        {
            'titulo': 'Diseño responsive',
            'descripcion': 'Asegurar compatibilidad con todos los dispositivos',
            'prioridad': 'A',
            'estado': 'E',
            'fecha_limite': timezone.now().date() + datetime.timedelta(days=15),
            'proyecto': projects[2] if len(projects) > 2 else None,
            'asignado_a': default_user,
            'creado_por': default_user
        }
    ]
    
    created_tasks = []
    for task_data in tasks_data:
        if task_data['proyecto'] is None:
            continue
        task = Tarea.objects.create(**task_data)
        created_tasks.append(task)
    
    print(f"Created {len(created_tasks)} demo tasks")
    
    for task in created_tasks:
        print(f"- {task.titulo} (Proyecto: {task.proyecto.titulo})")

if __name__ == "__main__":
    create_demo_tasks() 