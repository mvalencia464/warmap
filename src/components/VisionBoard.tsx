import { useCallback, useEffect, useRef, useState, useId } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { clsx } from "clsx";

const ZOOM_STEPS = [1, 1.2, 1.45] as const;

type Lightbox = { url: string; step: number };

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ChevronIcon({
  direction,
  className,
}: {
  direction: "left" | "right";
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {direction === "left" ? (
        <path d="M15 6l-6 6 6 6" />
      ) : (
        <path d="M9 6l6 6-6 6" />
      )}
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M6 7l1 12a2 2 0 002 1.99h6a2 2 0 002-1.99L18 7M10 11v5M14 11v5" />
    </svg>
  );
}

function ExpandIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 3h4v4M9 3H5v4M15 21h4v-4M9 21H5v-4" />
    </svg>
  );
}

export function VisionBoard() {
  const items = useQuery(api.vision.list, {});
  const addImage = useMutation(api.vision.add);
  const removeWithR2 = useAction(api.visionR2.removeWithR2);
  const prepareUpload = useAction(api.visionR2.prepareUpload);

  const [open, setOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [lightbox, setLightbox] = useState<Lightbox | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const count = items?.length ?? 0;
  const first = items && items.length > 0 ? items[0] : null;

  const current =
    items && items.length > 0
      ? items[Math.min(previewIndex, items.length - 1)]
      : null;

  useEffect(() => {
    if (!items || items.length === 0) return;
    if (previewIndex >= items.length) {
      setPreviewIndex(items.length - 1);
    }
  }, [items, previewIndex]);

  const onPickFile = useCallback(
    async (file: File) => {
      setErr("");
      const name = file.name;
      const ext = (name.includes(".") ? name.split(".").pop() : "jpg") || "jpg";
      const extLower = ext.toLowerCase();
      if (!/^(jpe?g|png|webp|gif)$/.test(extLower)) {
        setErr("Invalid file type");
        return;
      }
      const type = file.type || "image/jpeg";
      const indexBefore = items?.length ?? 0;
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
        setPreviewIndex(indexBefore);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [addImage, prepareUpload, items],
  );

  const goPrev = () => {
    if (!items || items.length < 2) return;
    setPreviewIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
  };

  const goNext = () => {
    if (!items || items.length < 2) return;
    setPreviewIndex((i) => (i >= items.length - 1 ? 0 : i + 1));
  };

  const canAdd =
    items !== undefined && !uploading && count < 6;
  const loadingList = items === undefined;

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
              ? "Vision board — add an image"
              : `Vision board, ${count} image${count === 1 ? "" : "s"} — open`
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
                <span
                  className="absolute bottom-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-stone-900/75 px-0.5 text-[0.6rem] font-semibold text-white tabular-nums"
                  aria-hidden
                >
                  {count}
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-lg font-light leading-none text-stone-500" aria-hidden>
              <PlusIcon className="h-5 w-5" />
            </span>
          )}
        </button>

        {open && (
          <div
            id={panelId}
            className="absolute bottom-full left-0 mb-2 flex h-[min(68vh,28rem)] w-[min(calc(100vw-1.25rem),20rem)] flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-stone-100/95 shadow-xl ring-1 ring-stone-900/5"
            data-skip-global-shortcuts
          >
            {err ? (
              <div
                className="border-b border-rose-200/80 bg-rose-50/95 px-3 py-1.5"
                title={err}
                role="status"
              >
                <span className="text-[0.7rem] leading-tight text-rose-600">
                  {err}
                </span>
              </div>
            ) : null}

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

            {/* Add — always the same small +; obvious affordance for new images */}
            <button
              type="button"
              disabled={!canAdd}
              onClick={() => {
                if (canAdd) fileRef.current?.click();
              }}
              className={clsx(
                "absolute right-2.5 top-2.5 z-20 flex h-10 w-10 items-center justify-center rounded-full",
                "border border-stone-200/90 bg-white/95 text-stone-600 shadow-md ring-1 ring-stone-900/5 transition",
                "hover:border-stone-300 hover:text-stone-900",
                "disabled:cursor-not-allowed disabled:opacity-40",
              )}
              aria-label="Add image"
            >
              {uploading ? (
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600"
                  aria-hidden
                />
              ) : (
                <PlusIcon className="h-5 w-5" />
              )}
            </button>

            {current ? (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    setErr("");
                    try {
                      await removeWithR2({ id: current._id });
                    } catch (e) {
                      setErr(e instanceof Error ? e.message : "Remove failed");
                    }
                  }}
                  className="absolute left-2.5 top-2.5 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-stone-200/90 bg-white/95 text-stone-500 shadow-md ring-1 ring-stone-900/5 transition hover:border-rose-200/90 hover:text-rose-600"
                  aria-label="Remove this image"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>

                <div className="relative min-h-0 flex-1">
                  {items && items.length > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={goPrev}
                        className="absolute left-1.5 top-1/2 z-10 -translate-y-1/2 rounded-full bg-stone-900/35 p-1.5 text-white shadow-sm backdrop-blur-sm transition hover:bg-stone-900/55"
                        aria-label="Previous image"
                      >
                        <ChevronIcon direction="left" className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        className="absolute right-1.5 top-1/2 z-10 -translate-y-1/2 rounded-full bg-stone-900/35 p-1.5 text-white shadow-sm backdrop-blur-sm transition hover:bg-stone-900/55"
                        aria-label="Next image"
                      >
                        <ChevronIcon direction="right" className="h-5 w-5" />
                      </button>
                    </>
                  ) : null}

                    <div
                    className="flex h-full min-h-48 flex-col p-2 pt-14"
                    role="group"
                    aria-label="Vision preview"
                  >
                    <button
                      type="button"
                      onClick={() => setLightbox({ url: current.publicUrl, step: 0 })}
                      className="group relative flex min-h-0 flex-1 cursor-zoom-in items-center justify-center overflow-hidden rounded-xl bg-stone-200/50"
                      aria-label="View full size"
                    >
                      <img
                        src={current.publicUrl}
                        alt=""
                        className="h-full w-full object-contain"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                      <span
                        className="pointer-events-none absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border border-stone-200/80 bg-white/90 text-stone-500 shadow-sm opacity-75 transition group-hover:opacity-100"
                        aria-hidden
                      >
                        <ExpandIcon className="h-3.5 w-3.5" />
                      </span>
                    </button>

                    {items && items.length > 1 ? (
                      <div
                        className="mt-2 flex shrink-0 items-center justify-center gap-1.5 pb-0.5"
                        role="tablist"
                        aria-label="Image index"
                      >
                        {items.map((row, i) => {
                          const active = row._id === current._id;
                          return (
                            <button
                              key={row._id}
                              type="button"
                              onClick={() => setPreviewIndex(i)}
                              className={clsx(
                                "h-1.5 rounded-full transition",
                                active
                                  ? "w-3.5 bg-stone-700"
                                  : "w-1.5 bg-stone-400/70 hover:bg-stone-500",
                              )}
                              aria-label={`Image ${i + 1} of ${items.length}`}
                              aria-current={active ? "true" : undefined}
                            />
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            ) : loadingList ? (
              <div
                className="m-2 mt-14 min-h-48 flex-1 animate-pulse rounded-xl bg-stone-200/70"
                aria-hidden
              />
            ) : (
              <div
                className="m-2 mt-14 min-h-48 flex-1 rounded-xl bg-stone-200/35"
                aria-hidden
              />
            )}
          </div>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => setLightbox(null)}
        >
          <div
            className="max-h-[min(90dvh,900px)] max-w-full"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Enlarged vision image"
          >
            <button
              type="button"
              className="mx-auto block max-w-[min(96vw,56rem)] cursor-zoom-in"
              onClick={cycleZoom}
            >
              <img
                src={lightbox.url}
                alt=""
                className="max-h-[80dvh] w-full rounded-lg object-contain shadow-2xl transition-transform duration-200"
                style={{
                  transform: `scale(${ZOOM_STEPS[lightbox.step]})`,
                }}
                draggable={false}
              />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
