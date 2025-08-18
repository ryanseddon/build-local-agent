import { extractToolCall } from "./tools.js";

export class Agent {
  constructor(
    private client: LanguageModel,
    private getUserMessage: () => Promise<string>,
  ) {}

  async run() {
    console.log("Chat with On-device LLM (cancel the prompt to quit)");

    let readInput = true;
    let userInput = "";

    while (true) {
      try {
        if (readInput) {
          userInput = await this.getUserMessage();
          console.log(
            "%cYou:%c %s",
            "color: oklch(70.7% .165 254.624)",
            "",
            userInput,
          );
        }

        const result = await this.runInference(userInput);
        let toolRes = "";

        const isToolCall = await extractToolCall(result);

        if (isToolCall) {
          toolRes = isToolCall;
        }

        if (!toolRes) {
          readInput = true;
          console.log(
            "%cAgent:%c %s",
            "color: oklch(90.5% .182 98.111)",
            "",
            result,
          );

          continue;
        }

        readInput = false;
        console.log(toolRes);
        userInput = toolRes;
      } catch (err: any) {
        if (err.message.includes("User cancelled")) {
          break;
        }

        console.log("error: ", err);
      }
    }
  }

  async runInference(message: string): Promise<string> {
    console.log(this.client);
    return this.client.prompt(message);
  }
}
