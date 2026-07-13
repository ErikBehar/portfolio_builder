import Link from "next/link";
import { getStatsSummary } from "@/lib/stats";

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">
        {value.toLocaleString()}
      </p>
      {detail && <p className="mt-2 text-sm text-muted">{detail}</p>}
    </div>
  );
}

function EmptyRow({
  message,
  colSpan = 4,
}: {
  message: string;
  colSpan?: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-6 text-sm text-muted">
        {message}
      </td>
    </tr>
  );
}

export default async function AdminStatsPage() {
  const stats = await getStatsSummary(30);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">
          Admin
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Stats</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Lightweight, self-hosted analytics for visitors, page views, referrers,
          and external link clicks. Admin traffic is excluded.
        </p>
      </header>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Unique visitors"
          value={stats.uniqueVisitors}
          detail={`${stats.uniqueVisitorsToday.toLocaleString()} today`}
        />
        <StatCard
          label="Page views (30 days)"
          value={stats.pageViewsLast30Days}
        />
        <StatCard
          label="Link clicks (30 days)"
          value={stats.linkClicksLast30Days}
        />
        <StatCard
          label="Referrer sources"
          value={stats.referrers.length}
          detail="Top sources below"
        />
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-medium">Traffic sources (30 days)</h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface/80 text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Page views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.referrers.length === 0 ? (
                <EmptyRow message="No referrer data yet." colSpan={2} />
              ) : (
                stats.referrers.map((row) => (
                  <tr key={row.referrer}>
                    <td className="px-4 py-3">{row.referrer}</td>
                    <td className="px-4 py-3">{row.views.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mb-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-lg font-medium">Log pages (30 days)</h2>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface/80 text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Entry</th>
                  <th className="px-4 py-3 font-medium">Views</th>
                  <th className="px-4 py-3 font-medium">Unique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.logPages.length === 0 ? (
                  <EmptyRow message="No log page views yet." colSpan={3} />
                ) : (
                  stats.logPages.map((row) => (
                    <tr key={row.path}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{row.title}</div>
                        <div className="text-muted">{row.path}</div>
                      </td>
                      <td className="px-4 py-3">{row.views.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {row.uniqueViews.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-medium">Project pages (30 days)</h2>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface/80 text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Views</th>
                  <th className="px-4 py-3 font-medium">Unique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.projectPages.length === 0 ? (
                  <EmptyRow message="No project page views yet." colSpan={3} />
                ) : (
                  stats.projectPages.map((row) => (
                    <tr key={row.path}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{row.title}</div>
                        <div className="text-muted">{row.path}</div>
                      </td>
                      <td className="px-4 py-3">{row.views.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {row.uniqueViews.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-medium">Log content link clicks (30 days)</h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface/80 text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Log entry</th>
                <th className="px-4 py-3 font-medium">Link</th>
                <th className="px-4 py-3 font-medium">Clicks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.logLinkClicks.length === 0 ? (
                <EmptyRow message="No log content link clicks yet." colSpan={3} />
              ) : (
                stats.logLinkClicks.map((row) => (
                  <tr key={`${row.entryTitle}-${row.url}-${row.label ?? ""}`}>
                    <td className="px-4 py-3">{row.entryTitle}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{row.label ?? row.url}</div>
                      <div className="break-all text-muted">{row.url}</div>
                    </td>
                    <td className="px-4 py-3">{row.clicks.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-medium">All external link clicks (30 days)</h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface/80 text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Link</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Clicks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.linkClicks.length === 0 ? (
                <EmptyRow message="No external link clicks yet." colSpan={3} />
              ) : (
                stats.linkClicks.map((row) => (
                  <tr key={`${row.url}-${row.source}-${row.label ?? ""}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{row.label ?? row.url}</div>
                      <div className="break-all text-muted">{row.url}</div>
                    </td>
                    <td className="px-4 py-3">{row.source}</td>
                    <td className="px-4 py-3">{row.clicks.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Daily page views (30 days)</h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface/80 text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Views</th>
                <th className="px-4 py-3 font-medium">Unique page views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.dailyPageViews.length === 0 ? (
                <EmptyRow message="No daily traffic yet." colSpan={3} />
              ) : (
                stats.dailyPageViews.map((row) => (
                  <tr key={row.date}>
                    <td className="px-4 py-3">{row.date}</td>
                    <td className="px-4 py-3">{row.views.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {row.uniqueViews.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-10 text-sm text-muted">
        <Link href="/admin" className="text-accent underline-offset-4 hover:underline">
          ← Back to admin
        </Link>
      </p>
    </div>
  );
}
