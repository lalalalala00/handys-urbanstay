-- Demo data for local/dev use. Timestamps are relative to now() so the
-- dashboard's delay-risk sorting always has something meaningful to show.
-- Run after schema.sql.

insert into staff (name, role) values
  ('김민준', 'cleaner'),
  ('이서연', 'cleaner'),
  ('박도윤', 'cleaner'),
  ('최지호', 'facility'),
  ('정하은', 'manager');

insert into rooms (branch, room_number, status, checkout_at, next_checkin_at) values
  ('urbanstay 강남', '1204', 'dirty',      now() - interval '10 minutes', now() + interval '40 minutes'),
  ('urbanstay 강남', '1205', 'assigned',   now() - interval '30 minutes', now() + interval '3 hours'),
  ('urbanstay 강남', '1206', 'cleaning',   now() - interval '50 minutes', now() + interval '2 hours'),
  ('urbanstay 강남', '1207', 'inspection', now() - interval '70 minutes', now() + interval '1 hour'),
  ('urbanstay 홍대',  '802',  'issue',      now() - interval '2 hours',   now() + interval '90 minutes'),
  ('urbanstay 홍대',  '803',  'occupied',   null,                          now() + interval '6 hours'),
  ('urbanstay 홍대',  '804',  'ready',      now() - interval '1 day',     null),
  ('urbanstay 강남', '1208', 'dirty',      now() - interval '5 minutes',  now() + interval '6 hours');

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
