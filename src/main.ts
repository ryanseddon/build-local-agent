import { Agent } from "./agent";
import { initialPrompts } from "./tools";

async function main() {
  const params = await LanguageModel.params();
  const client = LanguageModel.create({
    temperature: 0.1,
    topK: params.defaultTopK,
    initialPrompts,
  });
  const agent = new Agent(client);

  return agent.run();
}

main();
