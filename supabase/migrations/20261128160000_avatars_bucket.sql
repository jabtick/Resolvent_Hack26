-- Profile pictures.
--
-- Bucket "avatars": public (the picture is shown on /u/<username> without login), at most
-- 2 MB, images only. Every user writes only into their own folder "<auth.uid()>/...";
-- profiles.avatar_url stores that path (see the column comment), the site turns it into
-- the public URL.
--
-- Public bucket = anyone who has the exact file URL can open it. Nobody can list the
-- bucket (no public select policy), and file names contain a timestamp, so URLs can't be
-- guessed. To review with Боги: whether under-14 accounts without parental consent should
-- be allowed to upload a picture at all.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Owner only, inside their own folder. Removing a file needs select + delete,
-- replacing one needs select + update (Supabase Storage rules).
create policy "avatars_owner_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars_owner_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
