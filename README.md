# Infocent-KPI

Sistema de control y visualización de Indicadores Clave de Rendimiento (KPIs) para las unidades de **Requerimientos**, **Desarrollo** y **Calidad**.

El almacenamiento persistente y la base de datos están gestionados por **Supabase** (PostgreSQL).

---

## 🚀 Guía de Configuración Rápida

### Paso 1: Configurar Variables de Entorno
Asegúrate de tener un archivo `.env` en la raíz del proyecto con la siguiente estructura (este archivo ya está configurado localmente en tu máquina):

```env
VITE_SUPABASE_URL=https://tjsvnyvybdzkpdxhbyky.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_EESD16r25HxN_UytKbEjYw_LdEnUgUX
```

### Paso 2: Inicializar la Base de Datos (Supabase)
Si aún no has configurado tu base de datos, copia y ejecuta en el **SQL Editor** de tu Dashboard de Supabase los siguientes archivos en orden:
1. [20260702133815_init_schema.sql](file:///c:/Users/continuidadoperacion/Documents/Infocent-KPI/supabase/migrations/20260702133815_init_schema.sql) (Crea las tablas, las relaciones y carga los KPIs iniciales).
2. [20260702134959_disable_rls.sql](file:///c:/Users/continuidadoperacion/Documents/Infocent-KPI/supabase/migrations/20260702134959_disable_rls.sql) (Desactiva la seguridad RLS para poder registrar datos sin login).

### Paso 3: Ejecutar el Proyecto Localmente
1. Abre una terminal en la carpeta del proyecto.
2. Instala las dependencias si no lo has hecho:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

---

## 📊 Estructura de la Base de Datos Creada

- **`units`**: Unidades organizacionales (`Requerimientos`, `Desarrollo`, `Calidad`).
- **`kpis`**: Definición de cada métrica (ej. Cobertura de pruebas, Tasa de cambios) con su meta (target) y frecuencia.
- **`kpi_entries`**: Registro histórico de los valores alcanzados por periodo.
