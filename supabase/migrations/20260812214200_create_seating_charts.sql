create table "public"."seating_layouts" (
    "id" uuid not null default gen_random_uuid(),
    "event_id" uuid not null references public.events(id) on delete cascade,
    "layout_data_json" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    primary key ("id")
);

create table "public"."seats" (
    "id" uuid not null default gen_random_uuid(),
    "layout_id" uuid not null references public.seating_layouts(id) on delete cascade,
    "label" text not null,
    "ticket_type_id" uuid references public.ticket_types(id) on delete set null,
    "status" text not null default 'available', -- available, locked, sold
    "locked_until" timestamp with time zone,
    "locked_by_session" text,
    "order_id" uuid references public.orders(id) on delete set null,
    "created_at" timestamp with time zone not null default now(),
    primary key ("id"),
    unique("layout_id", "label")
);

-- RLS
alter table "public"."seating_layouts" enable row level security;
alter table "public"."seats" enable row level security;

create policy "Enable read access for all users" on "public"."seating_layouts" as permissive for select to public using (true);
create policy "Enable all access for organizers" on "public"."seating_layouts" as permissive for all to authenticated using (
    exists (select 1 from public.events where id = event_id and user_id = auth.uid())
);

create policy "Enable read access for all users" on "public"."seats" as permissive for select to public using (true);
create policy "Enable all access for organizers" on "public"."seats" as permissive for all to authenticated using (
    exists (
        select 1 from public.seating_layouts sl 
        join public.events e on e.id = sl.event_id 
        where sl.id = layout_id and e.user_id = auth.uid()
    )
);

-- RPC for atomic seat locking
create or replace function public.lock_seat(p_seat_id uuid, p_session_id text)
returns boolean
language plpgsql
as $$
declare
    v_success boolean;
begin
    update public.seats
    set status = 'locked',
        locked_until = now() + interval '10 minutes',
        locked_by_session = p_session_id
    where id = p_seat_id 
      and (status = 'available' or (status = 'locked' and locked_until < now()))
    returning true into v_success;

    return coalesce(v_success, false);
end;
$$;
