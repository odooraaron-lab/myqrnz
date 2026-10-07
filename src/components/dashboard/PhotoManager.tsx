"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MAX_PHOTOS } from "@/lib/limits";
import { uploadImage } from "@/lib/resize-client";

export type Photo = { url: string; width: number | null; height: number | null };
type Pending = { key: string; preview: string; error?: string };

/** Multi-photo uploader: resize in the browser, upload, reorder, remove. The first photo is the main one. */
export function PhotoManager({
  initial,
  name = "photos",
  onUploadingChange,
}: {
  initial: Photo[];
  name?: string;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Photo[]>(initial);
  const [pending, setPending] = useState<Pending[]>([]);
  const room = MAX_PHOTOS - photos.length - pending.filter((p) => !p.error).length;

  async function add(files: FileList | null) {
    if (!files?.length) return;
    const chosen = Array.from(files).slice(0, Math.max(0, room));
    const jobs = chosen.map((file) => ({ file, key: `${file.name}-${file.size}-${Math.random()}`, preview: URL.createObjectURL(file) }));
    setPending((p) => [...p, ...jobs.map(({ key, preview }) => ({ key, preview }))]);
    if (input.current) input.current.value = "";

    // Upload two at a time — kind to phone connections.
    const queue = [...jobs];
    const worker = async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        try {
          const { url, width, height } = await uploadImage(job.file, "listing");
          setPhotos((p) => [...p, { url, width, height }]);
          setPending((p) => p.filter((x) => x.key !== job!.key));
          URL.revokeObjectURL(job.preview);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Upload failed.";
          setPending((p) => p.map((x) => (x.key === job!.key ? { ...x, error: msg } : x)));
        }
      }
    };
    await Promise.all([worker(), worker()]);
  }

  function move(index: number, by: number) {
    setPhotos((p) => {
      const next = [...p];
      const target = index + by;
      if (target < 0 || target >= next.length) return p;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  const uploading = pending.some((p) => !p.error);
  useEffect(() => onUploadingChange?.(uploading), [uploading, onUploadingChange]);

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(photos)} />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Product photos">
        {photos.map((p, i) => (
          <li key={p.url} className="group relative border border-line bg-paper">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" className="aspect-square w-full object-cover" />
            {i === 0 && <span className="absolute left-2 top-2 bg-ink px-2 py-0.5 text-xs font-semibold text-white">Main photo</span>}
            <div className="flex items-center justify-between gap-1 border-t border-line bg-card p-1">
              <div className="flex">
                <button type="button" className="btn btn-quiet btn-sm !min-h-8 !px-2" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move photo ${i + 1} earlier`}>
                  ←
                </button>
                <button
                  type="button"
                  className="btn btn-quiet btn-sm !min-h-8 !px-2"
                  onClick={() => move(i, 1)}
                  disabled={i === photos.length - 1}
                  aria-label={`Move photo ${i + 1} later`}
                >
                  →
                </button>
              </div>
              <button
                type="button"
                className="btn btn-quiet btn-sm !min-h-8 !px-2 text-stop"
                onClick={() => setPhotos((ps) => ps.filter((x) => x.url !== p.url))}
                aria-label={`Remove photo ${i + 1}`}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
        {pending.map((p) => (
          <li key={p.key} className="relative border border-line bg-paper">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.preview} alt="" className={`aspect-square w-full object-cover ${p.error ? "opacity-40" : "opacity-60"}`} />
            <div className="absolute inset-x-0 top-0 grid aspect-square place-items-center p-2 text-center text-sm font-semibold">
              {p.error ? <span className="bg-card px-2 py-1 text-stop">{p.error}</span> : <span className="bg-card px-2 py-1">Uploading…</span>}
            </div>
            {p.error && (
              <button type="button" className="btn btn-quiet btn-sm w-full" onClick={() => setPending((x) => x.filter((y) => y.key !== p.key))}>
                Dismiss
              </button>
            )}
          </li>
        ))}
        {room > 0 && (
          <li>
            <label
              htmlFor={id}
              className="grid aspect-square cursor-pointer place-items-center border-[1.5px] border-dashed border-line-strong bg-card p-3 text-center hover:border-cobalt hover:text-cobalt"
            >
              <span>
                <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" className="mx-auto">
                  <path d="M14 6v16M6 14h16" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span className="mt-2 block text-sm font-semibold">Add photos</span>
                <span className="block text-xs text-ink-soft">{room} more allowed</span>
              </span>
            </label>
          </li>
        )}
      </ul>
      <input
        ref={input}
        id={id}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => add(e.target.files)}
      />
      <p className="field-hint">
        Up to {MAX_PHOTOS} photos. The first is shown in your shop grid. Photos are shrunk before uploading, so big phone
        photos are fine.
      </p>
    </div>
  );
}
