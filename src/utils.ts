let cachedDirHandle: FileSystemDirectoryHandle | null = null;

export async function getDir(): Promise<FileSystemDirectoryHandle> {
  if (cachedDirHandle && (await hasAccess(cachedDirHandle))) {
    return cachedDirHandle;
  }

  // @ts-ignore
  const dirHandle = await window.showDirectoryPicker();

  const permission = await requestPermission(dirHandle);
  if (permission === "granted") {
    cachedDirHandle = dirHandle;
    return dirHandle;
  }

  throw new Error("Permission not granted");
}

async function hasAccess(handle: FileSystemDirectoryHandle): Promise<boolean> {
  // @ts-ignore
  const permission = await handle.queryPermission({ mode: "read" });
  return permission === "granted";
}

async function requestPermission(
  handle: FileSystemDirectoryHandle,
): Promise<PermissionState> {
  // @ts-ignore
  let permission = await handle.queryPermission({ mode: "read" });
  if (permission === "prompt") {
    // @ts-ignore
    permission = await handle.requestPermission({ mode: "read" });
  }
  return permission;
}

function waitForClick(button: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const handler = () => {
      button.removeEventListener("click", handler);
      resolve();
    };
    button.addEventListener("click", handler);
  });
}

export async function waitForDirAccess() {
  const btn = document.querySelector("#openBtn");
  console.log(
    "%ctool:%c You need to click the button to grant access to the directory",
    "color: oklch(79.2% .209 151.711)",
    "",
  );

  // @ts-ignore
  await waitForClick(btn);

  return await getDir();
}

export function promptAsync(message: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const input = prompt(message);
    if (input === null) {
      reject(new Error("User cancelled the input"));
      return;
    }
    resolve(input);
  });
}
