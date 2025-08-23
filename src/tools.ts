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

export const responseConstraint = {
  type: "object",
  properties: {
    mode: {
      type: "string",
      enum: ["message", "tool_call"],
      description:
        "Indicates whether this is a plain message or a request to call a tool.",
    },
    message: {
      type: "string",
      description: "The message text to send if mode=message.",
    },
    tool: {
      type: "string",
      enum: ["readFile"],
      description: "Available tools: readFile(path: string)",
    },
    parameters: {
      type: "object",
      description:
        "Key-value arguments for the tool, only used if mode=tool_call.",
    },
  },
  required: ["mode"],
};

export const systemPrompt: LanguageModelSystemMessage = {
  role: "system",
  content: `You can respond in two modes:

1. Message mode
   Use when replying directly to the user.
   Example:
   {
     "mode": "message",
     "message": "Hello! How can I help you?"
   }

2. Tool mode
   Use ONLY when you actually need to call a tool to answer the request. I can give you access to things so don't assume you can't read file system or get other device access.

Available tool:

/**
 * Read the contents of a given relative file path. Use this when you want to see what's inside a file. Do not use this with directory names.
 *
 * @param path - The relative path of a file in the working directory.
 * @returns {Promise<string>} A promise that resolves with the files content as a string.
 */
async function readFile(path: string): Promise<string> {}

/**
 * List files of a directory that the user will grant permission too. All you're concerned with is calling this to get access to a directory and its files.
 *
 * @returns {Promise<string[]>} A promise that resolves with the array of file names.
 */
async function listFiles(): Promise<string[]> {}

Rules:
- Default to "message" unless calling the tool is absolutely necessary.
- Do not call a tool for greetings, small talk, or when the answer is already known.
- Use EXACTLY the parameter name and type shown in the signature.`,
};

export const initialPrompts: [
  LanguageModelSystemMessage,
  ...LanguageModelMessage[],
] = [
  systemPrompt,
  // {
  //   role: "user",
  //   content: "What's in notes.txt",
  // },
  // {
  //   role: "assistant",
  //   content:
  //     '{"mode": "tool_call", "tool": "readFile", "parameters": {"path": "notes.txt"}}',
  // },
  // {
  //   role: "user",
  //   content:
  //     "Get resposneContraints working instead of a fairly reliable, yet not always, system prompt code fence example with regexp parsing brittleness.",
  // },
  // {
  //   role: "assistant",
  //   content:
  //     "The file notes.txt talks about using responseContraint over a system prompt to get relliable format back over regexp and parsing text",
  // },
  // {
  //   role: "user",
  //   content: "What's in the dir?",
  // },
  // {
  //   role: "assistant",
  //   content: '{"mode": "tool_call", "tool": "listFiles"}',
  // },
  // {
  //   role: "user",
  //   content: "['file1.csv','tools.ts','things.txt']",
  // },
  // {
  //   role: "assistant",
  //   content:
  //     "The directory contains 3 files:\n\n- file1.csv\n-tools.ts\n-things.txt",
  // },
];
