# Infocent-KPI

Sistema de control y visualización de Indicadores Clave de Rendimiento (KPIs) para las unidades de **Requerimientos**, **Desarrollo** y **Calidad**.

El almacenamiento persistente y la base de datos están gestionados por **Supabase** (PostgreSQL).

---

## 🚀 Guía de Configuración de Supabase

Sigue estos pasos para inicializar el proyecto en tu cuenta de Supabase y aplicar el esquema de base de datos.

### Paso 1: Crear el proyecto en Supabase
1. Inicia sesión o regístrate en [Supabase](https://supabase.com/).
2. Haz clic en **New Project** y selecciona tu organización.
3. Rellena los datos básicos:
   - **Name**: `Infocent-KPI` (o el nombre que prefieras).
   - **Database Password**: Genera una contraseña segura y guárdala.
   - **Region**: Selecciona la más cercana a tu ubicación.
4. Espera un par de minutos a que Supabase termine de aprovisionar la base de datos.

### Paso 2: Aplicar la Estructura de la Base de Datos (SQL)
Una vez que el proyecto esté listo:
1. Ve al panel lateral izquierdo de tu proyecto en Supabase y haz clic en **SQL Editor**.
2. Haz clic en **New Query**.
3. Abre el archivo local de migración inicial:
   - [20260702133815_init_schema.sql](file:///c:/Users/continuidadoperacion/Documents/Infocent-KPI/supabase/migrations/20260702133815_init_schema.sql)
4. Copia todo el contenido de ese archivo SQL y pégalo en el editor web de Supabase.
5. Haz clic en el botón **Run** (en la esquina inferior derecha del editor SQL).
6. Deberías ver un mensaje indicando que la consulta se ejecutó correctamente (`Success`). Esto creará las tablas, las políticas de seguridad (RLS) y cargará los KPIs iniciales de ejemplo.

### Paso 3: Obtener las Credenciales de Conexión
Para conectar nuestra futura aplicación web con Supabase, necesitaremos las credenciales del proyecto.
1. Ve a **Project Settings** (el icono de engranaje en la barra lateral izquierda) y selecciona **API**.
2. Copia los siguientes valores:
   - **Project URL**: (Generalmente tiene el formato `https://xxxxxx.supabase.co`)
   - **API Key (anon / public)**: La clave pública anónima.
3. Crea un archivo llamado `.env` en la raíz de este proyecto con la siguiente estructura:

```env
SUPABASE_URL=tu_project_url_aqui
SUPABASE_ANON_KEY=tu_anon_key_aqui
```

*(Nota: Asegúrate de no compartir este archivo en repositorios públicos)*

---

## 📊 Estructura de la Base de Datos Creada

- **`units`**: Contiene las unidades organizacionales. Por defecto incluye `Requerimientos`, `Desarrollo` y `Calidad`.
- **`kpis`**: Contiene la definición de cada métrica (ej. Cobertura de pruebas, Tasa de cambios) con su meta (target) y frecuencia (mensual, semanal).
- **`kpi_entries`**: Registro histórico de los valores alcanzados por periodo para cada KPI.
