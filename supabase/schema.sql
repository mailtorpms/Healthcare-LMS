-- =============================================================================
-- ClinicalEd LMS: Supabase / PostgreSQL schema with Row-Level Security
-- =============================================================================
-- Roles:
--   admin         full access to everything in the organisation
--   course_admin  manages cohorts, courses, modules, questions; reads attempts
--                 of learners in cohorts they manage
--   learner       reads courses assigned via cohort membership; writes own attempts
--
-- Run in the Supabase SQL editor or via `supabase db push`.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('admin', 'course_admin', 'learner');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.profession as enum ('physician', 'resident', 'nurse', 'nurse_practitioner', 'pharmacist', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.account_status as enum ('active', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.question_type as enum ('single', 'multi', 'dosage');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Shared trigger: updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- -----------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  full_name       text not null,
  email           text not null unique,
  role            public.app_role not null default 'learner',
  profession      public.profession not null default 'other',
  specialty       text,
  license_number  text,
  npi             text check (npi is null or npi ~ '^\d{10}$'),
  status          public.account_status not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create or replace trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile when a user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- cohorts & cohort_members
-- -----------------------------------------------------------------------------
create table if not exists public.cohorts (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  specialty    text,
  created_by   uuid not null references public.profiles (id) on delete restrict,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create or replace trigger cohorts_updated_at before update on public.cohorts
  for each row execute function public.set_updated_at();

create table if not exists public.cohort_members (
  cohort_id    uuid not null references public.cohorts (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  added_by     uuid references public.profiles (id) on delete set null,
  added_at     timestamptz not null default now(),
  primary key (cohort_id, user_id)
);

create index if not exists cohort_members_user_idx on public.cohort_members (user_id);

-- -----------------------------------------------------------------------------
-- courses, course_cohorts (assignment), modules
-- -----------------------------------------------------------------------------
create table if not exists public.courses (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  specialty       text,
  cme_credits     numeric(5,2) not null default 0 check (cme_credits >= 0),
  passing_score   numeric(5,2) not null default 80 check (passing_score between 0 and 100),
  time_limit_min  integer check (time_limit_min is null or time_limit_min > 0),
  is_published    boolean not null default false,
  created_by      uuid not null references public.profiles (id) on delete restrict,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create or replace trigger courses_updated_at before update on public.courses
  for each row execute function public.set_updated_at();

create table if not exists public.course_cohorts (
  course_id    uuid not null references public.courses (id) on delete cascade,
  cohort_id    uuid not null references public.cohorts (id) on delete cascade,
  due_date     date,
  assigned_by  uuid references public.profiles (id) on delete set null,
  assigned_at  timestamptz not null default now(),
  primary key (course_id, cohort_id)
);

create index if not exists course_cohorts_cohort_idx on public.course_cohorts (cohort_id);

create table if not exists public.modules (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references public.courses (id) on delete cascade,
  title         text not null,
  content       jsonb not null default '{}'::jsonb,   -- rich content blocks / media refs
  duration_min  integer not null default 15 check (duration_min > 0),
  position      integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (course_id, position)
);

create or replace trigger modules_updated_at before update on public.modules
  for each row execute function public.set_updated_at();

-- Learner module completion (drives progress bars and CME eligibility).
create table if not exists public.module_progress (
  user_id       uuid not null references public.profiles (id) on delete cascade,
  module_id     uuid not null references public.modules (id) on delete cascade,
  completed_at  timestamptz not null default now(),
  primary key (user_id, module_id)
);

-- -----------------------------------------------------------------------------
-- questions (flexible JSONB payloads)
-- -----------------------------------------------------------------------------
-- payload shapes, validated by check constraint below:
--   single : { "options": [{ "id": "a", "text": "..." }], "correctId": "a" }
--   multi  : { "options": [...], "correctIds": ["a","c"], "scoring": "partial" | "all_or_nothing" }
--   dosage : { "template": "Give {{s1}} every {{s2}}", "answers": { "s1": "1 mg" }, "tokens": ["1 mg", "0.5 mg"] }
create table if not exists public.questions (
  id          uuid primary key default gen_random_uuid(),
  module_id   uuid not null references public.modules (id) on delete cascade,
  type        public.question_type not null,
  stem        text not null,
  vignette    text,
  payload     jsonb not null,
  rationale   text not null,
  citations   text[] not null default '{}',
  points      numeric(5,2) not null default 1 check (points > 0),
  position    integer not null default 0,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint questions_payload_shape check (
    case type
      when 'single' then payload ? 'options' and payload ? 'correctId'
                         and jsonb_typeof(payload -> 'options') = 'array'
      when 'multi'  then payload ? 'options' and payload ? 'correctIds'
                         and jsonb_typeof(payload -> 'correctIds') = 'array'
                         and coalesce(payload ->> 'scoring', 'partial') in ('partial', 'all_or_nothing')
      when 'dosage' then payload ? 'template' and payload ? 'answers' and payload ? 'tokens'
                         and jsonb_typeof(payload -> 'answers') = 'object'
                         and jsonb_typeof(payload -> 'tokens') = 'array'
    end
  )
);

create index if not exists questions_module_idx on public.questions (module_id, position);
create index if not exists questions_payload_gin on public.questions using gin (payload jsonb_path_ops);

create or replace trigger questions_updated_at before update on public.questions
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- quiz_attempts
-- -----------------------------------------------------------------------------
create table if not exists public.quiz_attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  course_id     uuid not null references public.courses (id) on delete cascade,
  responses     jsonb not null default '{}'::jsonb,   -- { questionId: response }
  result        jsonb,                                -- per-question scoring breakdown
  score         numeric(5,2) check (score between 0 and 100),
  passed        boolean,
  started_at    timestamptz not null default now(),
  submitted_at  timestamptz,
  duration_sec  integer check (duration_sec is null or duration_sec >= 0)
);

create index if not exists quiz_attempts_user_idx on public.quiz_attempts (user_id, course_id);
create index if not exists quiz_attempts_course_idx on public.quiz_attempts (course_id, submitted_at desc);

-- -----------------------------------------------------------------------------
-- Helper functions for RLS (security definer avoids recursive policy checks)
-- -----------------------------------------------------------------------------
create or replace function public.app_user_role()
returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and status = 'active'
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.app_user_role() = 'admin', false)
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.app_user_role() in ('admin', 'course_admin'), false)
$$;

create or replace function public.is_cohort_member(p_cohort uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.cohort_members where cohort_id = p_cohort and user_id = auth.uid())
$$;

-- Course admins manage cohorts they created.
create or replace function public.manages_cohort(p_cohort uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin()
      or exists (select 1 from public.cohorts where id = p_cohort and created_by = auth.uid()
                 and public.app_user_role() = 'course_admin')
$$;

create or replace function public.can_access_course(p_course uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_staff()
      or exists (
        select 1
        from public.course_cohorts cc
        join public.cohort_members cm on cm.cohort_id = cc.cohort_id
        join public.courses c on c.id = cc.course_id
        where cc.course_id = p_course and cm.user_id = auth.uid() and c.is_published
          and public.app_user_role() is not null
      )
$$;

create or replace function public.manages_learner(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin()
      or exists (
        select 1 from public.cohort_members cm
        join public.cohorts c on c.id = cm.cohort_id
        where cm.user_id = p_user and c.created_by = auth.uid()
          and public.app_user_role() = 'course_admin'
      )
$$;

-- -----------------------------------------------------------------------------
-- Learner-facing question view (answer keys stripped)
-- -----------------------------------------------------------------------------
-- The base `questions` table holds answer keys, so only staff may read it.
-- Learners read this view instead. It runs with the owner's privileges
-- (security_invoker = false), so it filters rows itself via can_access_course().
-- Answer keys are applied server-side by submit_quiz_attempt().
create or replace view public.questions_public
with (security_invoker = false) as
select
  q.id, q.module_id, m.course_id, q.type, q.stem, q.vignette, q.points, q.position,
  case q.type
    when 'single' then q.payload - 'correctId'
    when 'multi'  then q.payload - 'correctIds'
    when 'dosage' then q.payload - 'answers'
  end as payload
from public.questions q
join public.modules m on m.id = q.module_id
where public.can_access_course(m.course_id);

revoke all on public.questions_public from anon, public;
grant select on public.questions_public to authenticated;

-- Prevent non-admins from escalating their own role or status through the API.
-- SECURITY INVOKER so current_user reflects the PostgREST role; the SQL editor,
-- migrations and the service role are unaffected (needed to bootstrap the first admin).
create or replace function public.protect_profile_columns()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon')
     and not public.is_admin()
     and (new.role is distinct from old.role or new.status is distinct from old.status) then
    raise exception 'Only admins can change role or status';
  end if;
  return new;
end $$;

create or replace trigger profiles_protect_columns before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- -----------------------------------------------------------------------------
-- Enable RLS
-- -----------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.cohorts         enable row level security;
alter table public.cohort_members  enable row level security;
alter table public.courses         enable row level security;
alter table public.course_cohorts  enable row level security;
alter table public.modules         enable row level security;
alter table public.module_progress enable row level security;
alter table public.questions       enable row level security;
alter table public.quiz_attempts   enable row level security;

-- profiles --------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- cohorts ---------------------------------------------------------------------
drop policy if exists cohorts_select on public.cohorts;
create policy cohorts_select on public.cohorts for select to authenticated
  using (public.is_staff() or public.is_cohort_member(id));

drop policy if exists cohorts_insert on public.cohorts;
create policy cohorts_insert on public.cohorts for insert to authenticated
  with check (public.is_staff() and created_by = auth.uid());

drop policy if exists cohorts_update on public.cohorts;
create policy cohorts_update on public.cohorts for update to authenticated
  using (public.manages_cohort(id)) with check (public.manages_cohort(id));

drop policy if exists cohorts_delete on public.cohorts;
create policy cohorts_delete on public.cohorts for delete to authenticated
  using (public.manages_cohort(id));

-- cohort_members --------------------------------------------------------------
drop policy if exists cohort_members_select on public.cohort_members;
create policy cohort_members_select on public.cohort_members for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

drop policy if exists cohort_members_insert on public.cohort_members;
create policy cohort_members_insert on public.cohort_members for insert to authenticated
  with check (public.manages_cohort(cohort_id));

drop policy if exists cohort_members_delete on public.cohort_members;
create policy cohort_members_delete on public.cohort_members for delete to authenticated
  using (public.manages_cohort(cohort_id));

-- courses ---------------------------------------------------------------------
drop policy if exists courses_select on public.courses;
create policy courses_select on public.courses for select to authenticated
  using (public.can_access_course(id));

drop policy if exists courses_insert on public.courses;
create policy courses_insert on public.courses for insert to authenticated
  with check (public.is_staff() and created_by = auth.uid());

drop policy if exists courses_update on public.courses;
create policy courses_update on public.courses for update to authenticated
  using (public.is_admin() or (public.is_staff() and created_by = auth.uid()))
  with check (public.is_admin() or (public.is_staff() and created_by = auth.uid()));

drop policy if exists courses_delete on public.courses;
create policy courses_delete on public.courses for delete to authenticated
  using (public.is_admin() or (public.is_staff() and created_by = auth.uid()));

-- course_cohorts --------------------------------------------------------------
drop policy if exists course_cohorts_select on public.course_cohorts;
create policy course_cohorts_select on public.course_cohorts for select to authenticated
  using (public.is_staff() or public.is_cohort_member(cohort_id));

drop policy if exists course_cohorts_write on public.course_cohorts;
create policy course_cohorts_write on public.course_cohorts for all to authenticated
  using (public.manages_cohort(cohort_id)) with check (public.manages_cohort(cohort_id));

-- modules ---------------------------------------------------------------------
drop policy if exists modules_select on public.modules;
create policy modules_select on public.modules for select to authenticated
  using (public.can_access_course(course_id));

drop policy if exists modules_write on public.modules;
create policy modules_write on public.modules for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- module_progress -------------------------------------------------------------
drop policy if exists module_progress_select on public.module_progress;
create policy module_progress_select on public.module_progress for select to authenticated
  using (user_id = auth.uid() or public.manages_learner(user_id));

drop policy if exists module_progress_insert on public.module_progress;
create policy module_progress_insert on public.module_progress for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.can_access_course((select course_id from public.modules m where m.id = module_id))
  );

drop policy if exists module_progress_delete on public.module_progress;
create policy module_progress_delete on public.module_progress for delete to authenticated
  using (user_id = auth.uid());

-- questions -------------------------------------------------------------------
-- Only staff read or write the base table (it contains answer keys).
-- Learners use public.questions_public.
drop policy if exists questions_staff_all on public.questions;
create policy questions_staff_all on public.questions for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- quiz_attempts ---------------------------------------------------------------
drop policy if exists quiz_attempts_select on public.quiz_attempts;
create policy quiz_attempts_select on public.quiz_attempts for select to authenticated
  using (user_id = auth.uid() or public.manages_learner(user_id));

drop policy if exists quiz_attempts_insert on public.quiz_attempts;
create policy quiz_attempts_insert on public.quiz_attempts for insert to authenticated
  with check (user_id = auth.uid() and public.can_access_course(course_id));

-- Learners may update only their own unsubmitted attempt (e.g. autosave).
drop policy if exists quiz_attempts_update_own on public.quiz_attempts;
create policy quiz_attempts_update_own on public.quiz_attempts for update to authenticated
  using (user_id = auth.uid() and submitted_at is null)
  with check (user_id = auth.uid());

drop policy if exists quiz_attempts_admin_delete on public.quiz_attempts;
create policy quiz_attempts_admin_delete on public.quiz_attempts for delete to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Server-side scoring: learners submit responses; the score is computed here so
-- clients cannot forge `score` / `passed`.
-- -----------------------------------------------------------------------------
create or replace function public.submit_quiz_attempt(p_attempt uuid, p_responses jsonb)
returns public.quiz_attempts
language plpgsql security definer set search_path = public as $$
declare
  v_attempt  public.quiz_attempts;
  v_pass     numeric;
  q          record;
  v_resp     jsonb;
  v_earned   numeric := 0;
  v_max      numeric := 0;
  v_q_earned numeric;
  v_hits     int;
  v_false    int;
  v_total    int;
  v_result   jsonb := '{}'::jsonb;
begin
  select * into v_attempt from public.quiz_attempts
   where id = p_attempt and user_id = auth.uid() and submitted_at is null
   for update;
  if not found then
    raise exception 'Attempt not found or already submitted';
  end if;

  select passing_score into v_pass from public.courses where id = v_attempt.course_id;

  for q in
    select qq.* from public.questions qq
    join public.modules m on m.id = qq.module_id
    where m.course_id = v_attempt.course_id
  loop
    v_resp := p_responses -> q.id::text;
    v_max := v_max + q.points;
    v_q_earned := 0;

    if q.type = 'single' then
      if v_resp #>> '{}' = q.payload ->> 'correctId' then v_q_earned := q.points; end if;

    elsif q.type = 'multi' then
      select count(*) filter (where c.value is not null), count(*) filter (where c.value is null)
        into v_hits, v_false
      from jsonb_array_elements_text(coalesce(v_resp, '[]'::jsonb)) r(value)
      left join jsonb_array_elements_text(q.payload -> 'correctIds') c(value) on c.value = r.value;
      v_total := jsonb_array_length(q.payload -> 'correctIds');
      if q.payload ->> 'scoring' = 'all_or_nothing' then
        if v_hits = v_total and v_false = 0 then v_q_earned := q.points; end if;
      else
        v_q_earned := greatest(0, (v_hits - v_false)::numeric / v_total) * q.points;
      end if;

    elsif q.type = 'dosage' then
      select count(*) filter (where v_resp ->> a.key = a.value), count(*)
        into v_hits, v_total
      from jsonb_each_text(q.payload -> 'answers') a(key, value);
      v_q_earned := (v_hits::numeric / greatest(v_total, 1)) * q.points;
    end if;

    v_earned := v_earned + v_q_earned;
    v_result := v_result || jsonb_build_object(q.id::text, jsonb_build_object('earned', v_q_earned, 'max', q.points));
  end loop;

  update public.quiz_attempts
     set responses    = p_responses,
         result       = v_result,
         score        = case when v_max = 0 then 0 else round(v_earned / v_max * 100, 2) end,
         passed       = case when v_max = 0 then false else (v_earned / v_max * 100) >= v_pass end,
         submitted_at = now(),
         duration_sec = extract(epoch from now() - started_at)::int
   where id = p_attempt
   returning * into v_attempt;

  return v_attempt;
end $$;

revoke all on function public.submit_quiz_attempt(uuid, jsonb) from public;
grant execute on function public.submit_quiz_attempt(uuid, jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- Reporting view: cohort performance (respects caller's RLS)
-- -----------------------------------------------------------------------------
create or replace view public.cohort_performance
with (security_invoker = true) as
select
  c.id                                           as cohort_id,
  c.name                                         as cohort_name,
  count(distinct cm.user_id)                     as member_count,
  round(avg(best.best_score), 1)                 as avg_best_score,
  count(distinct best.user_id) filter (where best.best_score >= 80) as passed_count
from public.cohorts c
left join public.cohort_members cm on cm.cohort_id = c.id
left join lateral (
  select qa.user_id, max(qa.score) as best_score
  from public.quiz_attempts qa
  where qa.user_id = cm.user_id and qa.submitted_at is not null
  group by qa.user_id
) best on true
group by c.id, c.name;
