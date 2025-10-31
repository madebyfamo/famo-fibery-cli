import { gql } from '../src/clients/graphql.js';

async function main() {
  const projectName = 'Snakebite MV';
  const res = await gql<{ scenes: { create: { entities: Array<{ id: string }>; message: string } } }>(
    `
    mutation CreateScene($project: String!) {
      scenes {
        create(
          name: "VSCode Smoke Scene",
          sceneNumber: 1,
          project: { name: { is: $project } },
          state: { name: { is: "Idea" } }
        ) {
          message
          entities { id }
        }
      }
    }
  `,
    { project: projectName }
  );
  const created = res.scenes.create.entities?.[0];
  if (!created) throw new Error('Scene creation returned no entity');
  console.log('Created Scene:', created.id);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
