import { gql } from '../src/clients/graphql.js';
import { sleep } from '../src/util/sleep.js';

async function findProjectByName(name: string): Promise<{ id: string; name: string } | null> {
  const res = await gql<{ findProjects: Array<{ id: string; name: string }> }>(
    `
    query FindProject($name: String!) {
      findProjects(limit: 5, name: { is: $name }) { id name }
    }
  `,
    { name }
  );
  return res.findProjects?.[0] ?? null;
}

async function createScene(projectName: string) {
  const res = await gql<{ scenes: { create: { entities: Array<{ id: string }>; message: string } } }>(
    `
    mutation CreateScene($project: String!, $name: String!, $num: Int!) {
      scenes {
        create(
          name: $name,
          sceneNumber: $num,
          project: { name: { is: $project } },
          state: { name: { is: "Idea" } }
        ) {
          message
          entities { id }
        }
      }
    }
  `,
    { project: projectName, name: 'Smoke A/B', num: Math.floor(Math.random() * 1000) }
  );
  const created = res.scenes.create.entities?.[0];
  if (!created) throw new Error('Scene creation returned no entity');
  return created.id;
}

async function getSceneShotCount(sceneId: string): Promise<number> {
  const res = await gql<{ findScenes: Array<{ id: string; shotCount: number }> }>(
    `
    query OneScene($id: ID!) {
      findScenes(limit: 1, id: { is: $id }) { id shotCount }
    }
  `,
    { id: sceneId }
  );
  return res.findScenes?.[0]?.shotCount ?? 0;
}

async function lockScene(sceneId: string) {
  await gql(
    `
    mutation LockScene($id: ID!) {
      scenes(id: { is: $id }) {
        update(state: { name: { is: "Locked" } }) { message }
      }
    }
  `,
    { id: sceneId }
  );
}

async function countDeliverablesForProject(projectId: string): Promise<number> {
  const res = await gql<{ findDeliverables: Array<{ id: string }> }>(
    `
    query Dels($pid: ID!) {
      findDeliverables(limit: 500, project: { id: { is: $pid } }) { id }
    }
  `,
    { pid: projectId }
  );
  return res.findDeliverables?.length ?? 0;
}

async function listRecentDeliverablesForProject(projectId: string, limit = 10) {
  return gql<{ findDeliverables: Array<{ id: string; name: string; type: { name: string }; version: number }> }>(
    `
    query Dels($pid: ID!, $limit: Int!) {
      findDeliverables(limit: $limit, project: { id: { is: $pid } }, orderBy: { creationDate: DESC }) {
        id
        name
        version
        type { name }
      }
    }
  `,
    { pid: projectId, limit }
  );
}

async function main() {
  const projectName = 'Snakebite MV';
  const proj = await findProjectByName(projectName);
  if (!proj) throw new Error(`Project "${projectName}" not found`);

  const baselineDels = await countDeliverablesForProject(proj.id);

  // 1) Create Scene → Automation should spawn shots.
  const sceneId = await createScene(projectName);
  console.log('Scene created:', sceneId);

  let shots = 0;
  for (let i = 0; i < 40; i++) {
    shots = await getSceneShotCount(sceneId);
    if (shots > 0) break;
    await sleep(500);
  }
  console.log('Shots spawned:', shots);

  // 2) Lock scene → Automation should create deliverables.
  await lockScene(sceneId);

  let dels = 0;
  for (let i = 0; i < 40; i++) {
    const current = await countDeliverablesForProject(proj.id);
    dels = Math.max(0, current - baselineDels);
    if (dels > 0) {
      const recent = await listRecentDeliverablesForProject(proj.id, 5);
      const pretty = recent.findDeliverables
        .slice(0, dels)
        .map(x => `${x.type?.name ?? 'Deliverable'} v${x.version}`);
      if (pretty.length) console.log('Deliverables:', pretty);
      break;
    }
    await sleep(500);
  }
  // If shots were not seeded earlier, check once more after lock.
  if (shots === 0) {
    for (let i = 0; i < 20; i++) {
      shots = await getSceneShotCount(sceneId);
      if (shots > 0) break;
      await sleep(500);
    }
  }
  console.log('Deliverables created:', dels);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
