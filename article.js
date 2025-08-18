const getUserMessage = async (str) =>
  new Promise((resolve) => resolve(prompt(str)));

const waitForClick = (button) =>
  new Promise((resolve) => {
    const handler = () => {
      button.removeEventListener("click", handler);
      resolve();
    };
    button.addEventListener("click", handler);
  });

async function waitForDirAccess() {
  if (cachedDirHandle === null) {
    const btn = document.querySelector("#fsAccess");
    console.log(
      "%ctool:%c You need to click the button to grant access to the directory",
      "color: oklch(79.2% .209 151.711)",
      "",
    );

    await waitForClick(btn);
  }

  return getDir();
}

async function readFile(path) {
  const fileName = path.includes("/") ? path.split("/").reverse()[0] : path;
  const dir = await waitForDirAccess();
  const fileHandle = await dir.getFileHandle(fileName);
  const file = await fileHandle.getFile();
  const content = await file.text();

  return content;
}

async function listFiles() {
  const dirHandle = await waitForDirAccess();
  const files = [];

  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind === "file") {
      files.push(name);
    }
  }

  return files;
}

let cachedDirHandle = null;
async function getDir() {
  if (
    cachedDirHandle &&
    (await cachedDirHandle.queryPermission({ mode: "read" })) === "granted"
  ) {
    return cachedDirHandle;
  }

  const dirHandle = await window.showDirectoryPicker();

  let permission = await dirHandle.queryPermission({ mode: "read" });

  if (permission === "prompt") {
    permission = await dirHandle.requestPermission({ mode: "read" });
  }

  if (permission === "granted") {
    cachedDirHandle = dirHandle;
    return dirHandle;
  }

  throw new Error("Permission not granted");
}

async function prepareToolCall(text) {
  const output = text
    .replace(/^\s*console\.log\(\s*([a-zA-Z_$][\w$]*)\s*\);?/m, "return $1;")
    .replace(/^const\s+\w+\s*=\s*(await\s+\w+\([^)]*\));\s*$/m, "return $1;")
    .replace(/^\s*(await\s+\w+\([^)]*\));\s*$/m, "return $1;");
  const generatedFn = new Function(`return (async function(){ ${output} })();`);
  const result = await generatedFn(readFile);

  return "```tool_output\n" + result + "\n```";
}

async function extractToolCall(text) {
  const match = text.match(/```tool_code\s*([\s\S]*?)\s*```/);
  const code = match?.[1] || null;
  if (code) {
    console.log("%ctool:%c \n%s", "color: oklch(79.2% .209 151.711)", "", code);
    const res = await prepareToolCall(code);
    return res;
  }
  return false;
}

const params = await LanguageModel.params();
const client = await LanguageModel.create({
  temperature: 0.1,
  topK: params.defaultTopK,
  initialPrompts: [
    {
      role: "system",
      content: `At each turn, if you decide to invoke any of the function(s), it should be wrapped with \`\`\`tool_code\`\`\`. The Typescript methods described below are imported and available, you can only use defined methods. The generated code should be readable and efficient. The response to a method will be wrapped in \`\`\`tool_output\`\`\` use it to call more tools or generate a helpful, friendly response. When using a \`\`\`tool_code\`\`\` think step by step why and how it should be used.
 
The following Typescript methods are available:
 
\`\`\`js
/**
 * Read the contents of a given relative file path. Use this when you want to see what's inside a file. Do not use this with directory names.
 *
 * @param path - The relative path of a file in the working directory.
 * @returns {Promise<string>} A promise that resolves with the files content as a string.
 */
async function readFile(path: string): Promise<string> {}
\`\`\`
 
\`\`\`js
/**
 * List files of a directory that the user will grant permission too. All you're concerned with is calling this to get access to a directory and its files.
 *
 * @returns {Promise<string[]>} A promise that resolves with the array of file names.
 */
async function listFiles(): Promise<string[]> {}
\`\`\`
 
User: `,
    },
  ],
});

class Agent {
  constructor(client, getUserMessage) {
    this.client = client;
    this.getUserMessage = getUserMessage;
  }

  async run() {
    console.log("Chat with On-device LLM (cancel the prompt to quit)");

    let readInput = true;
    let userInput = "";

    while (true) {
      if (readInput) {
        userInput = await this.getUserMessage();

        if (userInput === null) break;

        console.log(
          "%cYou:%c %s",
          "color: oklch(70.7% .165 254.624)",
          "",
          userInput,
        );
      }

      const result = await this.runInference(userInput);
      let toolRes = false;

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
      userInput = toolRes;
      console.log(userInput);
    }
  }

  async runInference(message) {
    return this.client.prompt(message);
  }
}

const agent = new Agent(client, () => getUserMessage("You:"));

agent.run();
