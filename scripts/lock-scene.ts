import { gql } from '../src/clients/graphql.js';

async function main() {
  // Fetch the most recent scene so we can toggle its state.
  const res = await gql<{ findScenes: Array<{ id: string; name: string }> }>(
    `
    query LatestScene {
      findScenes(limit: 1, orderBy: { creationDate: DESC }) { id name }
    }
  `
  );
  if (!res.findScenes?.length) throw new Error('No Scenes found');
  const sc = res.findScenes[0];
  console.log('Locking Scene:', sc.name);

  await gql(
    `
    mutation LockScene($id: ID!) {
      scenes(id: { is: $id }) {
        update(state: { name: { is: "Locked" } }) { message }
      }
    }
  `,
    { id: sc.id }
  );
  console.log('Scene locked.');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
