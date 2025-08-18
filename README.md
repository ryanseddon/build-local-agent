# Build a Local Agent

This repository contains the code to build and run a local AI agent directly in your browser. The agent leverages on-device AI capabilities, allowing it to interact with your local files securely and privately.

> [!IMPORTANT]
> This requires Chrome Canary or Edge Dev with the following flags enabled.

<details>
  <summary>Setup Instructions</summary>
  <ol>
    <li>**Install Chrome Canary**: Ensure you have version 141. [Download Chrome Canary](https://google.com/chrome/canary/).</li>
    <li>Check that you’re on 141.0.7362.0  or above</li>
    <li>Enable two flags:
      <ul>
        <li>chrome://flags/#optimization-guide-on-device-model - BypassPerfRequirement</li>
        <li>chrome://flags/#prompt-api-for-gemini-nano - Enabled</li>
      </ul>
    </li>
    <li>Relaunch Chrome</li>
    <li>Navigate to chrome://components</li>
    <li>Check that Optimization Guide On Device Model is downloading or force download if not
    Might take a few minutes for this component to even appear</li>
    <li>Open dev tools and type `(await LanguageModel.capabilities()).available`, should return "readily" when all good</li>
    <li>If not you can trigger the download by doing the follow:
      ```const session = await LanguageModel.create({monitor(m) {m.addEventListener("downloadprogress", e => {
        console.log(`Downloaded \${e.loaded} of \${e.total} bytes.`);
      });}});```</li>
  </ol>
</details>

This is an attempt to get the [How to Build an Agent](https://ampcode.com/how-to-build-an-agent) article working in the browser using the Gemini Nano and Phi-4-mini in Chrome and Edge respectively.

Read the [How to build an Agent, On-Device Edition](https://ryanseddon.com/ai/how-to-build-an-agent-on-device/).

## Getting Started

1. **Prerequisites:** You will need a browser that supports the Web AI API, such as a recent version of Google Chrome Canary or Microsoft Edge Dev.
2. **Installation:**

   ```bash
   npm install
   ```

3. **Build:**

   ```bash
   npm run build
   ```

4. **Run:** Open the `index.html` file in your browser.
5. **Open:** Open the devtools console (F12) to see the agent output.
6. **Start Agent:** Click the "Start Agent" button to begin interacting with the agent.
7. **Grant Access:** Click the "grant access to a directory" button when prompted by the agent.
