-- jodongari Phase 4B-14: Sighting Delete + Review Rejection (revision)
-- 참고: docs/ARCHITECTURE.md, docs/DECISIONS.md
--
-- 기존 sighting_participants/sighting_species/sighting_media/sighting_likes/sighting_comments는
-- 이미 모두 sightings(id)에 on delete cascade로 걸려 있어(0001_init.sql) 별도 cascade 작업이 필요 없다.
-- Storage object(사진/영상/오디오 실제 파일)는 DB cascade로 지워지지 않으므로 client가 삭제 전에
-- storage_path를 확보해 별도로 지운다 (lib/app-data-context.tsx deleteSighting).

-- status에 'revision' 추가 (반려 = 기존 revision 상태 재사용, 새 enum/column 없음).
alter table public.sightings drop constraint sightings_status_check;
alter table public.sightings add constraint sightings_status_check
  check (status in ('draft', 'pending', 'approved', 'revision'));

-- sighting 삭제: 작성자(author) 또는 leader/admin. participant라는 이유만으로는 삭제 불가.
create policy sightings_delete on public.sightings
  for delete to authenticated
  using (
    author_id = auth.uid()
    or public.is_reviewer()
  );

-- storage object 삭제: 본인이 올린 파일이거나 leader/admin(다른 사람 기록 삭제 시 미디어 정리 필요).
drop policy sighting_media_storage_delete on storage.objects;
create policy sighting_media_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'sighting-media'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_reviewer()
    )
  );
