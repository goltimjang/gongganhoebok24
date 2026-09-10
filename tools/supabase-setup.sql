-- 공간회복24 고객 후기 저장소 만들기
-- Supabase 대시보드 → SQL Editor 에 이 내용을 통째로 붙여넣고 Run 을 누르세요.

-- 1) 후기 표
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  nickname    text not null default '익명',
  service     text,
  rating      int  not null default 5,
  body        text not null,
  photos      text[] not null default '{}',
  hidden      boolean not null default false
);

create index if not exists reviews_created_idx on public.reviews (created_at desc);

alter table public.reviews enable row level security;

-- 2) 누구나 후기를 읽을 수 있다 (숨김 처리한 것 제외)
drop policy if exists "read reviews" on public.reviews;
create policy "read reviews" on public.reviews
  for select using (hidden = false);

-- 3) 누구나 후기를 등록할 수 있다 (형식이 맞을 때만)
drop policy if exists "insert reviews" on public.reviews;
create policy "insert reviews" on public.reviews
  for insert with check (
    char_length(body) between 10 and 1000
    and char_length(coalesce(nickname, '')) <= 20
    and rating between 1 and 5
    and (array_length(photos, 1) is null or array_length(photos, 1) <= 3)
    and hidden = false
  );

-- 수정과 삭제 권한은 주지 않는다. 사장님만 대시보드에서 지울 수 있다.

-- 4) 사진 보관함
insert into storage.buckets (id, name, public)
values ('review-photos', 'review-photos', true)
on conflict (id) do nothing;

drop policy if exists "upload review photo" on storage.objects;
create policy "upload review photo" on storage.objects
  for insert to anon with check (bucket_id = 'review-photos');

drop policy if exists "read review photo" on storage.objects;
create policy "read review photo" on storage.objects
  for select using (bucket_id = 'review-photos');
