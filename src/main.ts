import { Agent } from "./agent";

main();

async function main() {
  const client = LanguageModel.create();
  const agent = new Agent(client);

  return agent.run();
}
