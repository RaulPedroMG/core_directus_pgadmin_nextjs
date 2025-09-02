-- Script SQL para configurar sincronización en tiempo real entre pgAdmin y Directus
-- Este script crea triggers que notifican cuando se modifican datos en las tablas de Directus

-- 1. Crear función de notificación
CREATE OR REPLACE FUNCTION notify_directus_change()
RETURNS trigger AS $$
BEGIN
    -- Notificar el cambio con el nombre de la tabla y la operación
    PERFORM pg_notify(
        'directus_data_change',
        json_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'timestamp', extract(epoch from now()),
            'user_id', CASE
                WHEN TG_TABLE_NAME = 'directus_users' AND TG_OP != 'DELETE'
                THEN NEW.id
                ELSE null
            END
        )::text
    );

    -- Retornar el registro apropiado según la operación
    CASE TG_OP
        WHEN 'DELETE' THEN RETURN OLD;
        ELSE RETURN NEW;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- 2. Crear triggers para las tablas principales de Directus
CREATE OR REPLACE FUNCTION create_directus_triggers()
RETURNS void AS $$
DECLARE
    table_name text;
    directus_tables text[] := ARRAY[
        'directus_users',
        'directus_roles',
        'directus_permissions',
        'directus_collections',
        'directus_fields',
        'directus_files',
        'directus_folders',
        'directus_settings',
        'directus_presets',
        'directus_webhooks',
        'directus_flows',
        'directus_operations',
        'directus_panels',
        'directus_dashboards',
        'directus_notifications',
        'directus_shares',
        'directus_versions',
        'directus_revisions',
        'directus_activity',
        'directus_sessions',
        'directus_translations'
    ];
BEGIN
    FOREACH table_name IN ARRAY directus_tables
    LOOP
        -- Verificar si la tabla existe
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name) THEN
            -- Eliminar trigger existente si existe
            EXECUTE format('DROP TRIGGER IF EXISTS %I_change_trigger ON %I', table_name, table_name);

            -- Crear nuevo trigger
            EXECUTE format('
                CREATE TRIGGER %I_change_trigger
                AFTER INSERT OR UPDATE OR DELETE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION notify_directus_change()
            ', table_name, table_name);

            RAISE NOTICE 'Trigger creado para tabla: %', table_name;
        ELSE
            RAISE NOTICE 'Tabla no encontrada: %', table_name;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Ejecutar la creación de triggers
SELECT create_directus_triggers();

-- 4. Crear función para limpiar triggers (por si necesitas desinstalar)
CREATE OR REPLACE FUNCTION remove_directus_triggers()
RETURNS void AS $$
DECLARE
    table_name text;
    directus_tables text[] := ARRAY[
        'directus_users',
        'directus_roles',
        'directus_permissions',
        'directus_collections',
        'directus_fields',
        'directus_files',
        'directus_folders',
        'directus_settings',
        'directus_presets',
        'directus_webhooks',
        'directus_flows',
        'directus_operations',
        'directus_panels',
        'directus_dashboards',
        'directus_notifications',
        'directus_shares',
        'directus_versions',
        'directus_revisions',
        'directus_activity',
        'directus_sessions',
        'directus_translations'
    ];
BEGIN
    FOREACH table_name IN ARRAY directus_tables
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I_change_trigger ON %I', table_name, table_name);
        RAISE NOTICE 'Trigger eliminado para tabla: %', table_name;
    END LOOP;

    -- Eliminar función de notificación
    DROP FUNCTION IF EXISTS notify_directus_change();
    RAISE NOTICE 'Sistema de sincronización desinstalado';
END;
$$ LANGUAGE plpgsql;

-- 5. Crear vista para monitorear notificaciones (útil para debugging)
CREATE OR REPLACE VIEW directus_sync_status AS
SELECT
    schemaname,
    tablename,
    attname as column_name,
    n_distinct,
    correlation
FROM pg_stats
WHERE tablename LIKE 'directus_%'
ORDER BY tablename, attname;

-- 6. Comentarios informativos
COMMENT ON FUNCTION notify_directus_change() IS 'Función trigger que notifica cambios en las tablas de Directus para sincronización en tiempo real';
COMMENT ON FUNCTION create_directus_triggers() IS 'Instala triggers de notificación en todas las tablas de Directus';
COMMENT ON FUNCTION remove_directus_triggers() IS 'Desinstala el sistema de sincronización en tiempo real';

-- 7. Mostrar información sobre el setup
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== SETUP DE SINCRONIZACIÓN EN TIEMPO REAL COMPLETADO ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Triggers instalados en las tablas de Directus';
    RAISE NOTICE 'Canal de notificación: directus_data_change';
    RAISE NOTICE '';
    RAISE NOTICE 'Para probar, ejecuta en otra sesión:';
    RAISE NOTICE '  LISTEN directus_data_change;';
    RAISE NOTICE '  UPDATE directus_users SET first_name = ''Test'' WHERE id = (SELECT id FROM directus_users LIMIT 1);';
    RAISE NOTICE '';
    RAISE NOTICE 'Para desinstalar: SELECT remove_directus_triggers();';
    RAISE NOTICE '';
END $$;
