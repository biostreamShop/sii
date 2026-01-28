# Administrador de Ventas y Compras

Sistema de gestión de ventas, compras e IVA para empresas chilenas. Permite importar datos desde archivos CSV del SII y visualizar métricas, reportes y cálculos de IVA.

## Características

- **Dashboard** con KPIs y gráficos interactivos
- **Importación de CSV** de ventas y compras en una sola acción
- **Deduplicación automática** de registros (importación idempotente)
- **Reclasificación de liquidaciones** (de compras a ventas)
- **Cálculo de IVA mensual** con opción de ajuste manual
- **Filtros** por año, mes y tipo de documento
- **Exportación** de datos filtrados a CSV
- **Persistencia** con SQLite (los datos se mantienen al reiniciar)

## Requisitos

- Node.js 18+
- npm o yarn

## Instalación

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd sii

# Instalar dependencias
npm install

# Crear la base de datos
npx prisma migrate dev

# Iniciar en modo desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Uso

### 1. Importar Datos

1. Ve a la sección **"Importar CSV"** desde el menú lateral
2. Arrastra o selecciona tu archivo CSV de ventas
3. Arrastra o selecciona tu archivo CSV de compras
4. Haz clic en **"Importar Archivos"**

El sistema mostrará:
- Total de filas leídas
- Filas insertadas (nuevas)
- Filas ignoradas (duplicadas)
- Filas reclasificadas (liquidaciones)

### 2. Ver Dashboard

El dashboard muestra:
- **KPIs**: Total ventas, compras, IVA débito, crédito y a pagar
- **Gráficos**: Ventas vs Compras mensual, tendencia IVA, distribución por tipo de documento
- **Comparación YTD**: Año actual vs anterior

### 3. Ver Ventas/Compras

Las secciones de Ventas y Compras permiten:
- Ver tabla con todos los registros
- Filtrar por año, mes y tipo de documento
- Buscar por cualquier campo
- Exportar a CSV

### 4. Gestionar IVA

La sección IVA muestra:
- Tabla mensual con IVA débito, crédito, calculado y final
- Opción de **ajustar manualmente** el IVA de cualquier mes
- Totales anuales

## Formato de CSV Esperado

### Ventas
El sistema detecta automáticamente columnas con estos nombres:
- **Fecha**: `Fecha`, `Fecha Emision`, `FechaEmision`, `Fecha Emisión`
- **Tipo Doc**: `Tipo Doc`, `Tipo Documento`, `Tipo`, `TipoDoc`
- **Folio**: `Folio`, `N° Documento`, `Numero`, `Nro`
- **RUT**: `RUT`, `Rut Cliente`, `RUT Cliente`, `Rut`
- **Razón Social**: `Razon Social`, `Razón Social`, `Cliente`, `Nombre`
- **Montos**: `Exento`, `Neto`, `IVA`, `Total` (con variantes)

### Compras
Similar a ventas, pero también detecta:
- `Fecha Recepción` para fecha
- `Rut Proveedor` para RUT
- `IVA Recuperable` para IVA

### Formatos de Fecha Soportados
- `DD/MM/YYYY`
- `DD-MM-YYYY`
- `YYYY-MM-DD`
- `YYYY/MM/DD`

### Formatos de Número Soportados
- Chileno: `1.234.567` o `1.234,56`
- Internacional: `1,234,567` o `1234.56`

## Reglas de Negocio

### Deduplicación
- Se genera un **hash único** por registro usando: fecha + tipo doc + folio + rut + neto + iva + total
- Si un registro ya existe, se ignora (no se duplica)
- Esto permite reimportar archivos sin problemas

### Reclasificación de Liquidaciones
Los documentos tipo **"Liquidación"** en el archivo de compras:
- Se contabilizan como **ventas** (no como compras)
- Quedan marcados con `reclassified = true`
- Conservan referencia a su origen (`originalSource = "compras"`)

Tipos de documento detectados como liquidación:
- `Liquidación`
- `Liquidacion`
- `Liquidación Factura`
- `Liquidación-Factura Electrónica`
- Código `43` del SII

### IVA a Pagar
- **Calculado**: IVA Débito (ventas) - IVA Crédito (compras)
- **Ajustado**: Valor manual ingresado por el usuario
- **Final**: Usa el valor ajustado si existe, sino el calculado

## Estructura del Proyecto

```
sii/
├── prisma/
│   ├── schema.prisma    # Esquema de base de datos
│   └── dev.db          # Base de datos SQLite
├── src/
│   ├── app/
│   │   ├── api/        # API Routes
│   │   ├── compras/    # Página de compras
│   │   ├── configuracion/ # Página de configuración
│   │   ├── importar/   # Página de importación
│   │   ├── iva/        # Página de IVA
│   │   ├── ventas/     # Página de ventas
│   │   └── page.tsx    # Dashboard
│   ├── components/     # Componentes reutilizables
│   ├── generated/      # Cliente Prisma generado
│   └── lib/           # Utilidades y helpers
└── README.md
```

## API Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/dashboard` | GET | Obtener datos del dashboard |
| `/api/import` | POST | Importar archivos CSV |
| `/api/transactions` | GET | Listar transacciones |
| `/api/iva` | GET | Obtener datos de IVA mensual |
| `/api/iva` | POST | Guardar ajuste de IVA |
| `/api/config/stats` | GET | Estadísticas de la DB |
| `/api/config/logs` | GET | Historial de importaciones |
| `/api/config/clear` | DELETE | Eliminar todos los datos |

## Tecnologías

- **Next.js 16** - Framework React fullstack
- **Prisma** - ORM para SQLite
- **Tailwind CSS** - Estilos
- **Recharts** - Gráficos
- **PapaParse** - Parsing de CSV
- **Lucide React** - Iconos

## Solución de Problemas

### "No se detectaron las columnas"
Verifica que tu CSV tenga encabezados con nombres similares a los listados arriba.

### "Error de fecha inválida"
Asegúrate de que las fechas estén en formato DD/MM/YYYY, DD-MM-YYYY o YYYY-MM-DD.

### "Muchos duplicados"
Es normal si reimportas el mismo archivo. El sistema detecta duplicados automáticamente.

## Licencia

MIT
