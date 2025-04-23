import os
import django
import sys

# Setup Django environment
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Proyecto, Tarea
from api.views import ProyectoViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from api.serializers import TareaSerializer

def add_project_tasks_endpoint():
    """
    Este script agrega un endpoint personalizado a ProyectoViewSet para obtener
    todas las tareas de un proyecto específico, independientemente del usuario.
    
    Para ejecutar este script:
    1. Copie la implementación del método en la clase ProyectoViewSet en api/views.py
    2. Reinicie el servidor Django
    """
    
    # Verificar si el método ya existe
    if hasattr(ProyectoViewSet, 'get_tasks'):
        print("El endpoint ya existe en ProyectoViewSet")
        return
    
    # Crear la implementación del método
    code = """
    # Agregue este método a la clase ProyectoViewSet en api/views.py
    
    @action(detail=True, methods=['get'])
    def tareas(self, request, pk=None):
        \"\"\"
        Obtiene todas las tareas asociadas a un proyecto específico,
        independientemente del usuario que hace la solicitud.
        \"\"\"
        try:
            proyecto = self.get_object()
            tareas = Tarea.objects.filter(proyecto=proyecto)
            serializer = TareaSerializer(tareas, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    """
    
    print("Agregue el siguiente código a la clase ProyectoViewSet en api/views.py:")
    print("\n" + code)
    
    # Verificación de implementación
    print("\nDespués de agregar el código, el endpoint estará disponible en:")
    print("http://127.0.0.1:8000/api/proyectos/{id}/tareas/")
    print("\nEste endpoint devolverá todas las tareas del proyecto, sin importar quién sea el usuario.")

if __name__ == "__main__":
    add_project_tasks_endpoint() 