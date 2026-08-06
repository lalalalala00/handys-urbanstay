-- Per-issue and per-cleaning-task manager override. Both default to the
-- room's property.manager_id at read time (not backfilled here) so an
-- unset value always tracks whoever is currently the branch's resident
-- manager instead of freezing a snapshot.
alter table issues
  add column if not exists manager_id uuid references staff(id);

alter table cleaning_tasks
  add column if not exists manager_id uuid references staff(id);
