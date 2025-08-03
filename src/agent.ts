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
            "%cYou:%c " + userInput,
            "color: oklch(70.7% .165 254.624)",
            "",
          );
        }

        const result = await this.runInference(userInput);
        const toolRes = [];

        console.log(
          "%cAgent:%c " + result,
          "color: oklch(90.5% .182 98.111)",
          "",
        );

        if (toolRes.length === 0) {
          readInput = true;
          continue;
        }
      } catch (err: any) {
        if (err.message.includes("User cancelled")) {
          break;
        }

        console.log("error: ", err);
      }
    }
  }

  async runInference(message: string): Promise<string> {
    return this.client.prompt(message);
  }
}
