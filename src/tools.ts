import { waitForDirAccess } from "./utils.js";

/*
 * Read the contents of a given relative file path. Use this when you want to see what's inside a file. Do not use this with directory names.
 *
 * @param path - The relative path of a file in the working directory.
 * @returns {Promise<string>} A promise that resolves with the files content as a string.
 */
export async function readFile(path: string): Promise<string> {
  const fileName = path.includes("/") ? path.split("/").reverse()[0] : path;
  // @ts-ignore
  const dir = await waitForDirAccess();
  // @ts-ignore
  const fileHandle = await dir.getFileHandle(fileName);
  const file = await fileHandle.getFile();
  const content = await file.text();

  return content;
}

/**
 * List files of a directory that the user will grant permission too. All you're concerned with is calling this to get access to a directory and its files.
 *
 * @returns {Promise<string[]>} A promise that resolves with the array of file names.
 */
async function listFiles(): Promise<string[]> {
  const dirHandle = await waitForDirAccess();
  const files = [];

  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind === "file") {
      files.push(name);
    }
  }

  return files;
}

async function prepareToolCall(text: string) {
  const output = text
    .replace(/^\s*console\.log\(\s*([a-zA-Z_$][\w$]*)\s*\);?/m, "return $1;")
    .replace(/^const\s+\w+\s*=\s*(await\s+\w+\([^)]*\));\s*$/m, "return $1;")
    .replace(/^\s*(await\s+\w+\([^)]*\));\s*$/m, "return $1;");
  const generatedFn = new Function(
    "readFile",
    "listFiles",
    `return (async function(){ ${output} })();`,
  );
  const result = await generatedFn(readFile, listFiles);

  return "```tool_output\n" + result + "\n```";
}

export async function extractToolCall(text: string) {
  const match = text.match(/```tool_code\s*([\s\S]*?)\s*```/);
  const code = match ? match[1] : null;

  if (code) {
    console.log("%ctool:%c \n%s", "color: oklch(79.2% .209 151.711)", "", code);

    const res = await prepareToolCall(code);
    return res;
  }

  return false;
}

export const systemPrompt: LanguageModelSystemMessage = {
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
};

export const initialPrompts: [
  LanguageModelSystemMessage,
  ...LanguageModelMessage[],
] = [systemPrompt];
