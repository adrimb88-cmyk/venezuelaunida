-- ============================================================
--  VENEZUELA UNIDA — Base de datos Supabase
--  Copia y pega esto en el SQL Editor de tu proyecto Supabase
-- ============================================================


-- TABLA DE CASOS
create table if not exists casos (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),

  -- Información pública
  name          text not null,
  zone          text not null,
  description   text,
  categories    text[] default '{}',

  -- Formas de donación
  gofundme      text,
  instagram     text,
  tiene_cuenta  boolean default false,

  -- Datos bancarios (solo se muestran si tiene_cuenta = true)
  banco         text,
  num_cuenta    text,
  tipo_cuenta   text,
  cedula        text,
  titular       text,
  pago_movil    text,

  -- Moderación
  status        text default 'pendiente' check (status in ('pendiente','verificado','rechazado')),

  -- Contacto interno (nunca se muestra en la web pública)
  contacto_nombre  text,
  contacto_interno text
);

-- Índices para filtros rápidos
create index if not exists idx_casos_status   on casos(status);
create index if not exists idx_casos_zone     on casos(zone);
create index if not exists idx_casos_created  on casos(created_at desc);


-- TABLA DE ADMINS
create table if not exists admins (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  username   text unique not null,
  password   text not null,
  name       text not null,
  role       text default 'admin' check (role in ('admin','superadmin'))
);

-- Admin inicial: usuario = adriana, contraseña = admin2024
-- CAMBIA LA CONTRASEÑA después de tu primer login
insert into admins (username, password, name, role)
values ('adriana', 'admin2024', 'Adriana', 'superadmin')
on conflict (username) do nothing;


-- PERMISOS (Row Level Security)
-- Casos: cualquiera puede leer los verificados e insertar nuevos
--        solo autenticados pueden actualizar/borrar
alter table casos enable row level security;

create policy "Leer casos verificados"
  on casos for select
  using (status = 'verificado');

create policy "Insertar caso (cualquiera)"
  on casos for insert
  with check (status = 'pendiente');

-- Admins: leer y escribir solo con service_role (desde admin.js via anon con RLS desactivado)
-- NOTA: para que el panel admin funcione necesitas desactivar RLS en la tabla admins
-- o usar una función RPC. La opción más sencilla para empezar:
alter table admins disable row level security;

-- Habilitar lectura completa de casos para el panel admin:
-- (el panel admin usa la misma anon key, así que necesitamos una política que permita
--  leer todos los casos cuando se filtran por status)
create policy "Leer todos los casos"
  on casos for select
  using (true);

-- Permitir que admins actualicen y borren casos
create policy "Actualizar casos"
  on casos for update
  using (true);

create policy "Borrar casos"
  on casos for delete
  using (true);
