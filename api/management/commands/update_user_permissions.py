from django.core.management.base import BaseCommand
from api.models import User

class Command(BaseCommand):
    help = 'Actualiza los permisos de usuarios específicos en el sistema'

    def handle(self, *args, **kwargs):
        # Asegurar que el usuario administrador tenga los permisos correctos
        try:
            # Buscar por ID
            admin_user = User.objects.get(id=1)
            self.stdout.write(f"Usuario encontrado por ID 1: {admin_user.email}")
            
            # Si es rafacotrina720@gmail.com y no tiene los permisos correctos
            if admin_user.email == 'rafacotrina720@gmail.com':
                admin_user.is_staff = True
                admin_user.is_superuser = True
                admin_user.save()
                self.stdout.write(self.style.SUCCESS(f"Permisos actualizados para {admin_user.email}: is_staff={admin_user.is_staff}, is_superuser={admin_user.is_superuser}"))
            else:
                self.stdout.write(f"Usuario con ID 1 no es rafacotrina720@gmail.com, es {admin_user.email}")
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING("Usuario con ID 1 no encontrado"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error al procesar usuario con ID 1: {str(e)}"))
            
        # También buscar por email
        try:
            admin_user = User.objects.get(email='rafacotrina720@gmail.com')
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f"Permisos actualizados para rafacotrina720@gmail.com: is_staff={admin_user.is_staff}, is_superuser={admin_user.is_superuser}"))
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING("Usuario rafacotrina720@gmail.com no encontrado"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error al procesar usuario rafacotrina720@gmail.com: {str(e)}"))
            
        # Asegurar que el usuario rafix@gmail.com NO tenga permisos de administrador
        try:
            rafix_user = User.objects.get(email='rafix@gmail.com')
            was_changed = False
            
            if rafix_user.is_staff or rafix_user.is_superuser:
                rafix_user.is_staff = False
                rafix_user.is_superuser = False
                rafix_user.save()
                was_changed = True
                
            if was_changed:
                self.stdout.write(self.style.SUCCESS(f"Permisos revocados para {rafix_user.email}: is_staff=False, is_superuser=False"))
            else:
                self.stdout.write(f"Los permisos para {rafix_user.email} ya eran correctos: is_staff={rafix_user.is_staff}, is_superuser={rafix_user.is_superuser}")
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING("Usuario rafix@gmail.com no encontrado"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error al procesar usuario rafix@gmail.com: {str(e)}"))

        # Mostrar todos los usuarios y sus permisos
        self.stdout.write("\nListado completo de usuarios:")
        for user in User.objects.all():
            self.stdout.write(f"ID: {user.id}, Email: {user.email}, is_staff: {user.is_staff}, is_superuser: {user.is_superuser}") 