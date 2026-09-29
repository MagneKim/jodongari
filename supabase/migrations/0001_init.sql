-- jodongari Phase 4 initial schema
-- 참고: docs/DECISIONS.md, docs/ARCHITECTURE.md
-- bird master(597종)는 이 schema에 포함하지 않는다 (data/birds.json 정적 파일 유지).

-- ============================================================
-- profiles
-- ============================================================

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null,
  role text not null default 'member' check (role in ('member', 'leader', 'admin')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 신규 auth.users row 생성 시 profiles row를 자동 생성한다 (기본 role=member, status=active).
-- nickname은 signup 시 전달한 raw_user_meta_data.nickname을 쓰고, 없으면 이메일 local part로 대체한다.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, nickname)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nickname', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- sightings
-- ============================================================

create table public.sightings (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (user_id),
  observed_date date not null,
  place text not null,
  note text not null default '',
  status text not null default 'draft' check (status in ('draft', 'pending', 'approved')),
  leader_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.profiles (user_id)
);

create index sightings_author_id_idx on public.sightings (author_id);
create index sightings_status_idx on public.sightings (status);
create index sightings_observed_date_idx on public.sightings (observed_date);

-- ============================================================
-- sighting_participants (작성자 제외, 공동 탐조자만)
-- ============================================================

create table public.sighting_participants (
  sighting_id uuid not null references public.sightings (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id),
  primary key (sighting_id, user_id)
);

create index sighting_participants_user_id_idx on public.sighting_participants (user_id);

-- ============================================================
-- sighting_species (species_id는 local bird master의 "bird-<KTSN>" 문자열, FK 없음)
-- ============================================================

create table public.sighting_species (
  sighting_id uuid not null references public.sightings (id) on delete cascade,
  species_id text not null,
  primary key (sighting_id, species_id)
);

create index sighting_species_species_id_idx on public.sighting_species (species_id);

-- ============================================================
-- sighting_media
-- ============================================================

create table public.sighting_media (
  id uuid primary key default gen_random_uuid(),
  sighting_id uuid not null references public.sightings (id) on delete cascade,
  type text not null check (type in ('image', 'video', 'audio')),
  storage_path text not null,
  mime_type text not null,
  original_name text not null,
  size_bytes bigint not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index sighting_media_sighting_id_idx on public.sighting_media (sighting_id);

-- ============================================================
-- sighting_likes
-- ============================================================

create table public.sighting_likes (
  sighting_id uuid not null references public.sightings (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id),
  created_at timestamptz not null default now(),
  primary key (sighting_id, user_id)
);

-- ============================================================
-- sighting_comments
-- ============================================================

create table public.sighting_comments (
  id uuid primary key default gen_random_uuid(),
  sighting_id uuid not null references public.sightings (id) on delete cascade,
  author_id uuid not null references public.profiles (user_id),
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sighting_comments_sighting_id_idx on public.sighting_comments (sighting_id);

-- ============================================================
-- helper: updated_at 자동 갱신 (profiles/sightings/sighting_comments 공용)
-- ============================================================

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_updated_at_sightings
  before update on public.sightings
  for each row execute function public.set_updated_at();

create trigger set_updated_at_sighting_comments
  before update on public.sighting_comments
  for each row execute function public.set_updated_at();

-- ============================================================
-- helper: 현재 사용자의 role (RLS policy에서 반복 사용)
-- ============================================================

create function public.current_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where user_id = auth.uid();
$$;

create function public.is_reviewer()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(public.current_role() in ('leader', 'admin'), false);
$$;

create function public.is_contributor(p_sighting_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.sightings s
    where s.id = p_sighting_id
      and (
        s.author_id = auth.uid()
        or exists (
          select 1 from public.sighting_participants sp
          where sp.sighting_id = s.id and sp.user_id = auth.uid()
        )
      )
  );
$$;

-- ============================================================
-- RLS enable
-- ============================================================

alter table public.profiles enable row level security;
alter table public.sightings enable row level security;
alter table public.sighting_participants enable row level security;
alter table public.sighting_species enable row level security;
alter table public.sighting_media enable row level security;
alter table public.sighting_likes enable row level security;
alter table public.sighting_comments enable row level security;

-- ============================================================
-- profiles policies
-- ============================================================

-- active authenticated user는 모든 profile(공개 필드만 가진 table 자체)을 read 가능 (Members 화면용).
create policy profiles_select_authenticated on public.profiles
  for select to authenticated
  using (true);

-- 본인 nickname만 수정 가능. role/status는 여기서 막지 않고 trigger로 강제한다 (member가 자기 row를 직접 update할 수 있어야 하므로).
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- admin은 모든 profile을 update 가능 (role/status 관리).
create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- 본인이 아닌 update에서 role/status가 바뀌지 않도록 강제 (admin이 아닌 경우).
create function public.protect_profile_role_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.current_role() <> 'admin' then
    if new.role <> old.role or new.status <> old.status then
      raise exception 'role/status는 admin만 변경할 수 있습니다.';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_profile_role_status_trigger
  before update on public.profiles
  for each row execute function public.protect_profile_role_status();

-- 마지막 admin 보호 (역할 강등/비활성화 모두 차단) — application layer(lib/app-data-context.tsx)와 이중 방어.
create function public.protect_last_admin()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.role = 'admin' and (new.role <> 'admin' or new.status = 'inactive') then
    if (
      select count(*) from public.profiles
      where role = 'admin' and status = 'active' and user_id <> old.user_id
    ) = 0 then
      raise exception '마지막 관리자는 권한을 변경하거나 비활성화할 수 없습니다.';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_last_admin_trigger
  before update on public.profiles
  for each row execute function public.protect_last_admin();

-- ============================================================
-- sightings policies
-- ============================================================

-- read: 본인이 author/participant면 상태 무관, 그 외에는 approved만.
create policy sightings_select on public.sightings
  for select to authenticated
  using (
    status = 'approved'
    or author_id = auth.uid()
    or public.is_contributor(id)
    or public.is_reviewer()
  );

-- insert: active user만, author_id는 반드시 본인.
create policy sightings_insert on public.sightings
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and (select status from public.profiles where user_id = auth.uid()) = 'active'
  );

-- update: 작성자는 approved 되기 전(draft/pending)까지만 본인 기록 수정 가능. leader/admin은 항상 가능(승인 포함).
create policy sightings_update on public.sightings
  for update to authenticated
  using (
    (author_id = auth.uid() and status <> 'approved')
    or public.is_reviewer()
  )
  with check (
    (author_id = auth.uid() and status <> 'approved')
    or public.is_reviewer()
  );

-- ============================================================
-- sighting_participants policies
-- ============================================================

create policy sighting_participants_select on public.sighting_participants
  for select to authenticated
  using (
    exists (
      select 1 from public.sightings s
      where s.id = sighting_id
        and (s.status = 'approved' or s.author_id = auth.uid() or public.is_contributor(s.id) or public.is_reviewer())
    )
  );

-- author는 본인 sighting이 approved 되기 전까지 participant를 관리할 수 있다. leader/admin은 항상 가능.
create policy sighting_participants_write on public.sighting_participants
  for all to authenticated
  using (
    exists (
      select 1 from public.sightings s
      where s.id = sighting_id and ((s.author_id = auth.uid() and s.status <> 'approved') or public.is_reviewer())
    )
  )
  with check (
    exists (
      select 1 from public.sightings s
      where s.id = sighting_id and ((s.author_id = auth.uid() and s.status <> 'approved') or public.is_reviewer())
    )
  );

-- ============================================================
-- sighting_species policies (participants와 동일 규칙)
-- ============================================================

create policy sighting_species_select on public.sighting_species
  for select to authenticated
  using (
    exists (
      select 1 from public.sightings s
      where s.id = sighting_id
        and (s.status = 'approved' or s.author_id = auth.uid() or public.is_contributor(s.id) or public.is_reviewer())
    )
  );

create policy sighting_species_write on public.sighting_species
  for all to authenticated
  using (
    exists (
      select 1 from public.sightings s
      where s.id = sighting_id and ((s.author_id = auth.uid() and s.status <> 'approved') or public.is_reviewer())
    )
  )
  with check (
    exists (
      select 1 from public.sightings s
      where s.id = sighting_id and ((s.author_id = auth.uid() and s.status <> 'approved') or public.is_reviewer())
    )
  );

-- ============================================================
-- sighting_media policies (participants와 동일 규칙)
-- ============================================================

create policy sighting_media_select on public.sighting_media
  for select to authenticated
  using (
    exists (
      select 1 from public.sightings s
      where s.id = sighting_id
        and (s.status = 'approved' or s.author_id = auth.uid() or public.is_contributor(s.id) or public.is_reviewer())
    )
  );

create policy sighting_media_write on public.sighting_media
  for all to authenticated
  using (
    exists (
      select 1 from public.sightings s
      where s.id = sighting_id and ((s.author_id = auth.uid() and s.status <> 'approved') or public.is_reviewer())
    )
  )
  with check (
    exists (
      select 1 from public.sightings s
      where s.id = sighting_id and ((s.author_id = auth.uid() and s.status <> 'approved') or public.is_reviewer())
    )
  );

-- ============================================================
-- sighting_likes / sighting_comments policies
-- approved sighting에 한해 active authenticated user가 interaction 가능.
-- 본인이 visible한 pending(작성자/participant)에도 기존 mock 동작(toggleLike/addComment가 status를 가리지 않음)과
-- 동일하게 상호작용을 허용한다 (docs/DECISIONS.md에 기록, 임의 축소하지 않음).
-- ============================================================

create policy sighting_likes_select on public.sighting_likes
  for select to authenticated
  using (
    exists (
      select 1 from public.sightings s
      where s.id = sighting_id
        and (s.status = 'approved' or s.author_id = auth.uid() or public.is_contributor(s.id) or public.is_reviewer())
    )
  );

create policy sighting_likes_insert on public.sighting_likes
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.sightings s
      where s.id = sighting_id
        and (s.status = 'approved' or s.author_id = auth.uid() or public.is_contributor(s.id))
    )
  );

create policy sighting_likes_delete on public.sighting_likes
  for delete to authenticated
  using (user_id = auth.uid());

create policy sighting_comments_select on public.sighting_comments
  for select to authenticated
  using (
    exists (
      select 1 from public.sightings s
      where s.id = sighting_id
        and (s.status = 'approved' or s.author_id = auth.uid() or public.is_contributor(s.id) or public.is_reviewer())
    )
  );

create index sighting_comments_author_id_idx on public.sighting_comments (author_id);

create policy sighting_comments_insert on public.sighting_comments
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.sightings s
      where s.id = sighting_id
        and (s.status = 'approved' or s.author_id = auth.uid() or public.is_contributor(s.id))
    )
  );

create policy sighting_comments_delete on public.sighting_comments
  for delete to authenticated
  using (author_id = auth.uid());

-- ============================================================
-- Storage: sighting-media bucket (private)
-- path 구조: {user_id}/{sighting_id}/{media_id}-{safe_filename}
-- ============================================================

insert into storage.buckets (id, name, public)
values ('sighting-media', 'sighting-media', false)
on conflict (id) do nothing;

-- upload: authenticated user, path의 첫 segment(user_id)가 본인이어야 한다.
create policy sighting_media_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'sighting-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- read: 본인이 올린 파일이거나, 해당 sighting이 visible한 경우 (경로의 두번째 segment = sighting_id).
create policy sighting_media_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'sighting-media'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.sightings s
        where s.id::text = (storage.foldername(name))[2]
          and (s.status = 'approved' or s.author_id = auth.uid() or public.is_contributor(s.id) or public.is_reviewer())
      )
    )
  );

-- delete: 본인이 올린 파일만.
create policy sighting_media_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'sighting-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
