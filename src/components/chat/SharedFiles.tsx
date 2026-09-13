import type { SharedFileView } from "@/core/shared-files";

const KIND_LABEL = { image: "Photo", pdf: "PDF", text: "Text file" } as const;

/** One shared file as a small chip: a thumbnail for a photo the page still holds, a page glyph otherwise. */
export function SharedFileChip({ file, onRemove }: { file: SharedFileView; onRemove?: () => void }) {
  const name = file.name || KIND_LABEL[file.kind];
  return (
    <li className="shared-file" title={file.url ? name : `${name} — Lumi read it when it was shared; it isn't kept`}>
      {file.kind === "image" && file.url ? (
        // eslint-disable-next-line @next/next/no-img-element -- a data URL the browser already holds; nothing to optimise
        <img src={file.url} alt="" className="shared-file-mini" />
      ) : (
        <svg className="shared-file-glyph" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
          <path d="M6 3h8l4 4v14H6z" />
          <path d="M14 3v4h4" />
        </svg>
      )}
      <span className="shared-file-name">{name}</span>
      {onRemove && (
        <button type="button" className="shared-file-remove" aria-label={`Don't share ${name}`} onClick={onRemove}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      )}
    </li>
  );
}

/** What was shared with one of your messages: a photo still in hand as itself; anything else, or anything from before this page open, as a chip. */
export function SharedFiles({ files }: { files: SharedFileView[] }) {
  return (
    <ul className="shared-files" aria-label="Shared with Lumi">
      {files.map((file, i) =>
        file.kind === "image" && file.url ? (
          <li key={i}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a data URL the browser already holds */}
            <img src={file.url} alt={file.name || "A photo"} className="shared-file-photo" />
          </li>
        ) : (
          <SharedFileChip key={i} file={file} />
        ),
      )}
    </ul>
  );
}
