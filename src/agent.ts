export class Agent {
  constructor(
    private client: LanguageModel,
    private getUserMessage: () => Promise<string>,
  ) {}

  async run() {
    const conversation: string[] = [];

    console.log("Chat with On-device LLM (cancel the prompt to quit)");

    const userInput = await this.getUserMessage();
    console.log(
      "%cYou:%c " + userInput,
      "color: oklch(70.7% .165 254.624)",
      "",
    );
    const result = await this.runInference(userInput);
    console.log("%cAgent:%c " + result, "color: oklch(90.5% .182 98.111)", "");
  }

  async runInference(message: string): Promise<string> {
    return this.client.prompt(message);
  }
}
