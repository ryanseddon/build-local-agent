import { Agent } from "./agent.js";
import { initialPrompts } from "./tools.js";

function promptAsync(message: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const input = prompt(message);
    if (input === null) {
      reject(new Error("User cancelled the input"));
      return;
    }
    resolve(input);
  });
}

async function getUserMessage(str: string): Promise<string> {
  const message: string = await promptAsync(str);
  return message;
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

main();
