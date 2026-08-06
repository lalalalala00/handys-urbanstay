-- Demo data for local/dev use. Timestamps are relative to now() so the
-- dashboard's delay-risk sorting always has something meaningful to show.
-- Run after schema.sql.
--
-- Branches are modeled as independently named hotels under Handys'
-- consignment operation (see src/lib/regions.ts) -- two hotels per
-- district (구) to demonstrate the region -> branch drill-down.
--
-- payment_status/payment_amount/door_lock_code are display-only mock
-- fields (no real PG or door-lock vendor integration -- out of MVP scope,
-- see README "제외" section).
--
-- Re-runnable: clears prior demo data first, so this can be re-executed
-- (e.g. to refresh the now()-relative timestamps) without manually
-- resetting the DB.

truncate table issues, cleaning_tasks, rooms, properties, staff restart identity cascade;

insert into staff (name, role, branch) values
  ('김민준', 'cleaner', null),
  ('이서연', 'cleaner', null),
  ('박도윤', 'cleaner', null),
  ('최지호', 'facility', null),
  ('정하은', 'manager', '노블리안 강남'),
  ('이지훈', 'manager', '강남 스퀘어 스테이');

insert into rooms (
  branch, room_number, occupancy_status, operation_status, operation_note, checkout_at, next_checkin_at,
  guest_name, guest_phone, guest_count, nights, payment_status, payment_amount, door_lock_code
) values
  ('노블리안 강남', '1204', 'vacant',   'ready',   null,                 now() - interval '10 minutes', now() + interval '40 minutes', '이하늘', '010-2841-5567', 2, 2, 'paid',   180000, '4821#'),
  ('노블리안 강남', '1205', 'vacant',   'ready',   null,                 now() - interval '30 minutes', now() + interval '3 hours',    '조민석', '010-7734-9021', 1, 1, 'paid',    95000, '1075#'),
  ('노블리안 강남', '1206', 'vacant',   'ready',   null,                 now() - interval '50 minutes', now() + interval '2 hours',    '윤서아', '010-5560-3312', 2, 3, 'unpaid', 270000, '6392#'),
  ('노블리안 강남', '1207', 'vacant',   'ready',   null,                 now() - interval '70 minutes', now() + interval '1 hour',     '한도현', '010-3391-8845', 1, 2, 'paid',   180000, '2648#'),
  ('홍대 하이브',    '802',  'vacant',   'ready',   null,                 now() - interval '2 hours',   now() + interval '1 day 9 hours', '김태리', '010-9012-4456', 2, 1, 'paid',    88000, '7710#'),
  ('홍대 하이브',    '803',  'occupied', 'ready',   null,                 now() + interval '5 hours',   now() - interval '1 day 19 hours', '박서준', '010-6623-1190', 3, 2, 'paid',   176000, '3355#'),
  ('홍대 하이브',    '804',  'vacant',   'blocked', '도어락 배터리 점검', now() - interval '1 day',     null,                          null,     null,             null, null, null,     null,   '9081#'),
  ('강남 스퀘어 스테이', '1208', 'vacant', 'ready', null,                 now() - interval '5 minutes',  now() + interval '6 hours',    '오나은', '010-4487-2203', 2, 4, 'unpaid', 340000, '5124#');

insert into cleaning_tasks (room_id, status, assignee_id, estimated_minutes, started_at)
values
  ((select id from rooms where room_number = '1205'), 'assigned',
   (select id from staff where name = '김민준'), 40, null),
  ((select id from rooms where room_number = '1206'), 'cleaning',
   (select id from staff where name = '이서연'), 45, now() - interval '15 minutes'),
  ((select id from rooms where room_number = '1207'), 'inspection',
   (select id from staff where name = '박도윤'), 35, now() - interval '55 minutes'),
  ((select id from rooms where room_number = '1204'), 'unassigned', null, 45, null),
  ((select id from rooms where room_number = '1208'), 'unassigned', null, 45, null);

insert into issues (room_id, category, description, reporter_type, urgency, status, assignee_id, ai_suggested_category, ai_suggested_urgency)
values
  ((select id from rooms where room_number = '802'), 'facility',
   '난방기는 켜지는데 따뜻한 바람이 나오지 않아요.', 'guest', 'urgent', 'in_progress',
   (select id from staff where name = '최지호'), 'facility', 'urgent'),
  ((select id from rooms where room_number = '1206'), 'cleaning',
   '침구에 얼룩이 남아있어 재청소가 필요합니다.', 'cleaner', 'normal', 'new', null, null, null);

-- Additional demo data: more branches/staff, and more variety in
-- room status / task status / issue category+urgency+reporter combinations.

insert into staff (name, role, branch) values
  ('한지민', 'cleaner', null),
  ('오세훈', 'cleaner', null),
  ('강수진', 'facility', null),
  ('배영호', 'manager', '해운대 오션하우스'),
  ('윤지호', 'manager', '홍대 하이브'),
  ('서예은', 'manager', '마포 브릭하우스'),
  ('최민아', 'manager', '선셋베이 해운대');

insert into properties (
  name, region_id, address, room_count, manager_id, checkin_time, checkout_time, status
) values
  ('노블리안 강남', 'seoul-gangnam', '서울 강남구 테헤란로 92길 12', 4,
   (select id from staff where name = '정하은'), '15:00', '11:00', 'active'),
  ('강남 스퀘어 스테이', 'seoul-gangnam', '서울 강남구 테헤란로 87길 5', 4,
   (select id from staff where name = '이지훈'), '15:00', '11:00', 'active'),
  ('홍대 하이브', 'seoul-mapo', '서울 마포구 어울마당로 45', 3,
   (select id from staff where name = '윤지호'), '15:00', '11:00', 'active'),
  ('마포 브릭하우스', 'seoul-mapo', '서울 마포구 월드컵로 20길 8', 3,
   (select id from staff where name = '서예은'), '15:00', '11:00', 'active'),
  ('해운대 오션하우스', 'busan-haeundae', '부산 해운대구 해운대로 620', 3,
   (select id from staff where name = '배영호'), '15:00', '11:00', 'active'),
  ('선셋베이 해운대', 'busan-haeundae', '부산 해운대구 달맞이길 65', 2,
   (select id from staff where name = '최민아'), '15:00', '11:00', 'active');

insert into rooms (
  branch, room_number, occupancy_status, operation_status, operation_note, checkout_at, next_checkin_at,
  guest_name, guest_phone, guest_count, nights, payment_status, payment_amount, door_lock_code
) values
  ('강남 스퀘어 스테이', '1301', 'occupied', 'ready', null, now() + interval '2 days',    now() - interval '1 day',      '최유진', '010-8210-6634', 2, 3, 'paid',   270000, '8890#'),
  ('강남 스퀘어 스테이', '1302', 'vacant',   'ready', null, now() - interval '3 hours',   now() + interval '1 day 3 hours', '이도현', '010-2234-5567', 2, 2, 'unpaid', 176000, '1263#'),
  ('강남 스퀘어 스테이', '1303', 'vacant',   'ready', null, now() - interval '20 minutes', now() + interval '25 minutes', '장하윤', '010-3345-7789', 1, 1, 'unpaid',  92000, '4470#'),
  ('마포 브릭하우스',    '805',  'vacant',   'ready', null, now() - interval '1 hour',    now() + interval '50 minutes',  '임수빈', '010-9987-2214', 2, 2, 'paid',   176000, '6023#'),
  ('마포 브릭하우스',    '806',  'vacant',   'ready', null, now() - interval '40 minutes', now() + interval '30 minutes', '노지호', '010-1156-8890', 1, 2, 'paid',   176000, '3381#'),
  ('마포 브릭하우스',    '807',  'vacant',   'ready', null, now() - interval '1 day',     now() + interval '4 days',      '백승우', '010-4432-0087', 3, 5, 'paid',   450000, '7654#'),
  ('해운대 오션하우스',  '901',  'occupied', 'ready', null, now() + interval '1 day 6 hours', now() - interval '18 hours', '문채원', '010-2298-6613', 2, 2, 'paid',   200000, '9042#'),
  ('해운대 오션하우스',  '902',  'vacant',   'ready', null, now() - interval '15 minutes', now() + interval '20 minutes', '류시원', '010-6671-3348', 1, 1, 'unpaid', 100000, '1587#'),
  ('해운대 오션하우스',  '903',  'vacant',   'ready', null, now() - interval '2 hours',    now() + interval '40 minutes', '심유나', '010-8843-2201', 2, 3, 'paid',   300000, '2936#'),
  ('선셋베이 해운대',    '904',  'vacant',   'ready', null, now() - interval '3 hours',    now() + interval '3 days 4 hours', '정다은', '010-5512-9087', 2, 2, 'paid',   200000, '6708#'),
  ('선셋베이 해운대',    '905',  'vacant',   'ready', null, now() - interval '1 day',     null,                           null,     null,             null, null, null,     null,   '4193#');

insert into cleaning_tasks (room_id, status, assignee_id, estimated_minutes, started_at, completed_at)
values
  ((select id from rooms where branch = '강남 스퀘어 스테이' and room_number = '1303'), 'unassigned',
   null, 45, null, null),
  ((select id from rooms where branch = '마포 브릭하우스' and room_number = '805'), 'assigned',
   (select id from staff where name = '한지민'), 40, null, null),
  ((select id from rooms where branch = '마포 브릭하우스' and room_number = '806'), 'cleaning',
   (select id from staff where name = '오세훈'), 45, now() - interval '20 minutes', null),
  ((select id from rooms where branch = '해운대 오션하우스' and room_number = '902'), 'unassigned',
   null, 45, null, null),
  ((select id from rooms where branch = '해운대 오션하우스' and room_number = '903'), 'inspection',
   (select id from staff where name = '한지민'), 35, now() - interval '65 minutes', null),
  ((select id from rooms where branch = '강남 스퀘어 스테이' and room_number = '1302'), 'done',
   (select id from staff where name = '오세훈'), 40, now() - interval '2 hours', now() - interval '80 minutes'),
  ((select id from rooms where branch = '마포 브릭하우스' and room_number = '807'), 'done',
   (select id from staff where name = '박도윤'), 45, now() - interval '1 day' - interval '1 hour', now() - interval '1 day' - interval '15 minutes'),
  ((select id from rooms where branch = '선셋베이 해운대' and room_number = '905'), 'done',
   (select id from staff where name = '한지민'), 30, now() - interval '1 day' - interval '40 minutes', now() - interval '1 day' - interval '10 minutes');

insert into issues (room_id, category, description, reporter_type, urgency, status, assignee_id, ai_suggested_category, ai_suggested_urgency)
values
  ((select id from rooms where branch = '선셋베이 해운대' and room_number = '904'), 'facility',
   '에어컨에서 물이 새서 바닥이 젖어있어요.', 'guest', 'urgent', 'checking',
   (select id from staff where name = '강수진'), 'facility', 'urgent'),
  ((select id from rooms where branch = '강남 스퀘어 스테이' and room_number = '1303'), 'amenity',
   '수건과 어메니티가 부족합니다.', 'cleaner', 'low', 'new', null, 'amenity', 'low'),
  ((select id from rooms where branch = '마포 브릭하우스' and room_number = '806'), 'environment',
   '옆방 소음이 심하다는 게스트 문의가 있었습니다.', 'guest', 'normal', 'assigned',
   (select id from staff where name = '강수진'), 'environment', 'normal'),
  ((select id from rooms where branch = '해운대 오션하우스' and room_number = '902'), 'access',
   '도어락 비밀번호가 인식되지 않는다는 신고가 접수됐습니다.', 'manager', 'urgent', 'in_progress',
   (select id from staff where name = '배영호'), 'access', 'urgent'),
  ((select id from rooms where branch = '강남 스퀘어 스테이' and room_number = '1301'), 'other',
   '체크인 안내 문자가 오지 않았다는 문의였습니다.', 'guest', 'low', 'done',
   (select id from staff where name = '배영호'), null, null);

update rooms
set property_id = properties.id
from properties
where rooms.branch = properties.name;
