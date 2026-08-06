create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  region_id text not null,
  address text not null,
  room_count int not null default 0 check (room_count >= 0),
  manager_id uuid references staff(id),
  checkin_time time not null default '15:00',
  checkout_time time not null default '11:00',
  status text not null default 'preparing'
    check (status in ('preparing', 'active')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table properties enable row level security;

insert into properties (name, region_id, address, room_count, manager_id, status)
select
  room_branches.branch,
  case
    when room_branches.branch in ('노블리안 강남', '강남 스퀘어 스테이') then 'seoul-gangnam'
    when room_branches.branch in ('홍대 하이브', '마포 브릭하우스') then 'seoul-mapo'
    when room_branches.branch in ('해운대 오션하우스', '선셋베이 해운대') then 'busan-haeundae'
    else 'unassigned'
  end,
  case room_branches.branch
    when '노블리안 강남' then '서울 강남구 테헤란로 92길 12'
    when '강남 스퀘어 스테이' then '서울 강남구 테헤란로 87길 5'
    when '홍대 하이브' then '서울 마포구 어울마당로 45'
    when '마포 브릭하우스' then '서울 마포구 월드컵로 20길 8'
    when '해운대 오션하우스' then '부산 해운대구 해운대로 620'
    when '선셋베이 해운대' then '부산 해운대구 달맞이길 65'
    else '주소 미등록'
  end,
  room_branches.room_count,
  (
    select staff.id
    from staff
    where staff.role = 'manager' and staff.branch = room_branches.branch
    limit 1
  ),
  'active'
from (
  select branch, count(*)::int as room_count
  from rooms
  group by branch
) as room_branches
on conflict (name) do nothing;

alter table rooms
  add column if not exists property_id uuid references properties(id);

update rooms
set property_id = properties.id
from properties
where rooms.property_id is null
  and rooms.branch = properties.name;

create index if not exists rooms_property_id_idx on rooms(property_id);
