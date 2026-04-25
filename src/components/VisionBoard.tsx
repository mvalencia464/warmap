import { useCallback, useEffect, useRef, useState, useId } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { clsx } from "clsx";

const ZOOM_STEPS = [1, 1.2, 1.45] as const;

type Lightbox = { url: string; step: number };

export function VisionBoard() {
  const items = useQuery(api.vision.list, {});
  const addImage = useMutation(api.vision.add);
  const removeImage = useMutation(api.vision.remove);
  const prepareUpload = useAction(api.visionR2.prepareUpload);

  const [open, setOpen] = useState(false);
  const [lightbox, setLightbox] = useState<Lightbox | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const count = items?.length ?? 0;
  const first = items && items.length > 0 ? items[0] : null;

  const onPickFile = useCallback(
    async (file: File) => {
      setErr("");
      const name = file.name;
      const ext = (name.includes(".") ? name.split(".").pop() : "jpg") || "jpg";
      const extLower = ext.toLowerCase();
      if (!/^(jpe?g|png|webp|gif)$/.test(extLower)) {
        setErr("Use a JPG, PNG, WebP, or GIF");
        return;
      }
      const type = file.type || "image/jpeg";
      setUploading(true);
      try {
        const { uploadUrl, r2Key, publicUrl } = await prepareUpload({
          contentType: type,
          fileExtension: extLower,
        });
        const res = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": type },
        });
        if (!res.ok) {
          throw new Error(`Upload failed (${res.status})`);
        }
        await addImage({ r2Key, publicUrl });
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Could not add image");
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [addImage, prepareUpload],
  );

  const openLightbox = (url: string) => {
    setLightbox({ url, step: 0 });
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (wrapRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown, true);
    return () => document.removeEventListener("mousedown", onDown, true);
  }, [open]);

  const cycleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightbox((prev) => {
      if (!prev) return null;
      const next = (prev.step + 1) % ZOOM_STEPS.length;
      return { ...prev, step: next };
    });
  };

  return (
    <>
      <div
        ref={wrapRef}
        className="pointer-events-auto fixed z-50"
        style={{
          bottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
          left: "max(0.75rem, env(safe-area-inset-left, 0px))",
        }}
      >
        <button
          type="button"
          className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-stone-200/90 bg-white/95 shadow-md ring-1 ring-stone-900/5 transition hover:border-stone-300 hover:shadow-lg"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-label={
            count === 0
              ? "Add a vision image"
              : `Vision board, ${count} image${count === 1 ? "" : "s"}`
          }
          onClick={() => {
            setOpen((o) => !o);
            setErr("");
          }}
        >
          {first ? (
            <>
              <img
                src={first.publicUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              {count > 1 ? (
                <span className="absolute bottom-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-stone-900/75 px-0.5 text-[0.6rem] font-semibold text-white tabular-nums">
                  {count}
                </span>
              ) : null}
            </>
          ) : (
            <span
              className="text-lg font-light leading-none text-stone-500"
              aria-hidden
            >
              +
            </span>
          )}
        </button>

        {open && (
          <div
            id={panelId}
            className="absolute bottom-full left-0 mb-2 w-[min(calc(100vw-1.5rem),18rem)] rounded-2xl border border-stone-200/90 bg-white/98 p-3 shadow-xl ring-1 ring-stone-900/5"
            data-skip-global-shortcuts
          >
            <p className="text-xs font-medium tracking-wide text-stone-500 uppercase">
              Vision
            </p>
            <p className="mt-0.5 text-xs leading-snug text-stone-500">
              Reminders of what you’re building toward. Up to 6 images.
            </p>

            {err ? (
              <p className="mt-2 text-xs text-rose-600">{err}</p>
            ) : null}

            {items === undefined ? (
              <p className="mt-2 text-sm text-stone-400">Loading…</p>
            ) : count > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {items.map((row) => (
                  <li
                    key={row._id}
                    className="group flex items-center gap-2 rounded-lg border border-stone-200/80 bg-stone-50/80 p-1.5"
                  >
                    <button
                      type="button"
                      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md"
                      onClick={() => openLightbox(row.publicUrl)}
                      aria-label="View larger; click again in viewer to zoom"
                    >
                      <img
                        src={row.publicUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </button>
                    <div className="min-w-0 flex-1 text-xs text-stone-500">
                      Tap to open — click cycles zoom
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-md px-2 py-1.5 text-xs text-stone-400 transition hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => void removeImage({ id: row._id })}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-2 border-t border-stone-200/80 pt-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onPickFile(f);
                }}
              />
              <button
                type="button"
                disabled={uploading || count >= 6 || items === undefined}
                onClick={() => fileRef.current?.click()}
                className={clsx(
                  "w-full rounded-lg border border-dashed border-stone-300 bg-stone-50/60 py-2.5 text-sm font-medium text-stone-600 transition",
                  "hover:border-stone-400 hover:bg-stone-100/80",
                  (uploading || count >= 6 || items === undefined)
                    && "cursor-not-allowed opacity-50",
                )}
              >
                {items === undefined
                  ? "…"
                  : uploading
                    ? "Uploading…"
                    : count >= 6
                      ? "Max 6 images"
                      : "Add image"}
              </button>
            </div>
          </div>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => setLightbox(null)}
        >
          <div
            className="max-h-[min(90dvh,900px)] max-w-full"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Vision image"
          >
            <button
              type="button"
              className="mx-auto block max-w-[min(96vw,56rem)] cursor-zoom-in"
              onClick={cycleZoom}
            >
              <img
                src={lightbox.url}
                alt="Vision"
                className="max-h-[80dvh] w-full rounded-lg object-contain shadow-2xl transition-transform duration-200"
                style={{
                  transform: `scale(${ZOOM_STEPS[lightbox.step]})`,
                }}
              />
            </button>
            <p className="mt-2 text-center text-xs text-stone-300">
              Click image to zoom — backdrop to close
            </p>
          </div>
        </div>
      )}
    </>
  );
}
