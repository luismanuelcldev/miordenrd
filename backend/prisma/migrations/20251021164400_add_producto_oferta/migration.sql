-- Add missing columns for oferta support
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'Producto'
      and column_name = 'enOferta'
  ) then
    alter table "public"."Producto"
      add column "enOferta" boolean not null default false;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'Producto'
      and column_name = 'precioOferta'
  ) then
    alter table "public"."Producto"
      add column "precioOferta" double precision;
  end if;
end$$;
