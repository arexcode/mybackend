# Generated by Django 5.0.2 on 2025-04-23 00:57

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_auto_20250422_1945'),
    ]

    operations = [
        migrations.RunSQL(
            """
            -- Recrear la tabla intermedia correctamente
            CREATE TABLE "api_proyecto_desarrolladores_new" (
                "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
                "proyecto_id" integer NOT NULL REFERENCES "api_proyecto" ("id") DEFERRABLE INITIALLY DEFERRED,
                "user_id" integer NOT NULL REFERENCES "api_user" ("id") DEFERRABLE INITIALLY DEFERRED
            );
            
            -- Crear un índice único para evitar duplicados
            CREATE UNIQUE INDEX "api_proyecto_desarrolladores_proyecto_id_user_id_idx" ON "api_proyecto_desarrolladores_new" ("proyecto_id", "user_id");
            
            -- Eliminar la tabla antigua si existe
            DROP TABLE IF EXISTS "api_proyecto_desarrolladores";
            
            -- Renombrar la nueva tabla a la original
            ALTER TABLE "api_proyecto_desarrolladores_new" RENAME TO "api_proyecto_desarrolladores";
            """,
            reverse_sql="""
            -- No es posible revertir esta migración de manera segura
            """
        ),
    ]
