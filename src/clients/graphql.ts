import 'dotenv/config';

const BASE = process.env.FIBERY_BASE!;
const TOKEN = process.env.FIBERY_TOKEN!;
const SPACE = process.env.FIBERY_SPACE!; // e.g., FAMO_Show_Bible_

/** Simple GraphQL POST to your space */
export async function gql<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const url = `${BASE}/api/graphql/space/${SPACE}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Token ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(JSON.stringify(json.errors, null, 2));
  }
  return json.data as T;
}
