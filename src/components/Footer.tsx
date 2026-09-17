import type { Meta } from '../types'

/** Report footer: source documents, methodology note, privacy note. Small, muted. */
export function Footer({ meta }: { meta: Meta }) {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto max-w-5xl px-4 py-6 text-xs leading-relaxed text-muted sm:px-6">
        <p className="font-medium text-muted">แหล่งข้อมูล</p>
        <ul className="mt-1.5 flex flex-col gap-1">
          {meta.sources.map((source) => (
            <li key={source} style={{ overflowWrap: 'break-word' }}>
              {source}
            </li>
          ))}
        </ul>
        <p className="mt-3">{meta.note}</p>
        <p className="mt-1">{meta.privacy}</p>
      </div>
    </footer>
  )
}
