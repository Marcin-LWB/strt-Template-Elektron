import { get, set, del } from 'idb-keyval';

const KEY_ROOT_DIR = 'root-dir-handle';

export async function saveRootDirHandle(handle: FileSystemDirectoryHandle) {
  // FileSystem*Handle można zapisać w IndexedDB (structured clone)
  await set(KEY_ROOT_DIR, handle);
}

export async function loadRootDirHandle(): Promise<FileSystemDirectoryHandle | null> {
  return (await get(KEY_ROOT_DIR)) ?? null;
}

export async function clearRootDirHandle() {
  await del(KEY_ROOT_DIR);
}