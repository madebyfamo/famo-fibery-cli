import { gql } from '../src/clients/graphql.js';

async function main() {
  const data = await gql(
    `
    query OneProject($limit: Int!) {
      findProjects(limit: $limit) { id name }
    }
  `,
    { limit: 1 }
  );

  console.log(JSON.stringify(data, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
