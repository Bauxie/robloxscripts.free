import { MAX_CODE } from "@/lib/store";
import { parsePlaceId } from "@/lib/roblox";

export const TITLE_MIN = 3;
export const TITLE_MAX = 120;
export const DESC_MIN = 30;
export const DESC_MAX = 2000;
export const CODE_MIN = 20;
export const CODE_MAX = MAX_CODE;

export type UploadFieldErrors = {
  title?: string;
  description?: string;
  gameLink?: string;
  code?: string;
  executors?: string;
};

export function validateUploadFields(input: {
  title: string;
  description: string;
  gameLink?: string;
  code: string;
  executors?: string[];
}): UploadFieldErrors {
  const errors: UploadFieldErrors = {};
  const title = (input.title || "").trim();
  const description = (input.description || "").trim();
  const gameLink = (input.gameLink || "").trim();
  const code = (input.code || "").trim();
  const executors = input.executors || [];

  if (!title) {
    errors.title = "Please enter a title.";
  } else if (title.length < TITLE_MIN) {
    errors.title = `Title needs at least ${TITLE_MIN} characters (${title.length}/${TITLE_MIN}).`;
  } else if (title.length > TITLE_MAX) {
    errors.title = `Title is too long (max ${TITLE_MAX} characters).`;
  }

  if (!description) {
    errors.description = `Please add a description (at least ${DESC_MIN} characters).`;
  } else if (description.length < DESC_MIN) {
    errors.description = `Description needs ${DESC_MIN - description.length} more character${
      DESC_MIN - description.length === 1 ? "" : "s"
    } (${description.length}/${DESC_MIN}).`;
  } else if (description.length > DESC_MAX) {
    errors.description = `Description is too long (max ${DESC_MAX} characters).`;
  }

  if (gameLink && !parsePlaceId(gameLink)) {
    errors.gameLink = "Use a Roblox games URL or place ID (e.g. https://www.roblox.com/games/123…).";
  }

  if (!code) {
    errors.code = "Please paste or upload your script code.";
  } else if (code.length < CODE_MIN) {
    errors.code = `Code needs at least ${CODE_MIN} characters (${code.length}/${CODE_MIN}).`;
  } else if (code.length > CODE_MAX) {
    errors.code = `Script is too large (max ${Math.floor(CODE_MAX / 1024)} KB).`;
  }

  if (!executors.length) {
    errors.executors = "Pick at least one executor so people know what to run it with.";
  }

  return errors;
}

export function firstUploadError(errors: UploadFieldErrors): string | null {
  return (
    errors.title ||
    errors.gameLink ||
    errors.executors ||
    errors.description ||
    errors.code ||
    null
  );
}
