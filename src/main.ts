import { Agent } from "./agent.js";
import { initialPrompts } from "./tools.js";
import { promptAsync } from "./utils.js";

async function getUserMessage(str: string): Promise<string> {
  return await promptAsync(str);
}

async function main() {
  const params = await LanguageModel.params();
  const client = await LanguageModel.create({
    temperature: 0.1,
    topK: params.defaultTopK,
    initialPrompts,
  });
  const agent = new Agent(client, () => getUserMessage("You:"));

  return agent.run();
}

document.querySelector("#start")?.addEventListener("click", () => main());
