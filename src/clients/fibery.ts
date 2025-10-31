import 'dotenv/config';

const BASE = process.env.FIBERY_BASE!;
const TOKEN = process.env.FIBERY_TOKEN!;

function headers(json = true) {
  const h: Record<string, string> = { Authorization: `Token ${TOKEN}` };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

/** Low-level helpers */
async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: headers(true),
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

/** REST API wrappers */
export const fiberyCmd = (commands: unknown[]): Promise<any[]> =>
  postJSON<any[]>('/api/commands', commands);

export const fiberyQuery = (q: unknown): Promise<any[]> =>
  postJSON<any[]>('/api/query', { q });

/** Utilities */
export async function findByName(
  type: string,
  name: string,
  select = ['Name', 'fibery/id']
) {
  const rows = await fiberyQuery({
    from: type,
    where: { Name: { '=': name } },
    select,
    limit: 1
  });
  return rows[0] ?? null;
}
