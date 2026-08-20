import { Logger, type ILogObj, type ISettingsParam } from "tslog";

export { Logger, LogLevel } from "tslog";
export type { ILogObj, ISettingsParam } from "tslog";

export function createLogger(settings?: ISettingsParam<ILogObj>): Logger<ILogObj> {
  const resolved: ISettingsParam<ILogObj> = {
    ...settings,
    pretty: {
      timeZone: "local",
      ...settings?.pretty,
    },
  };

  if (process.env.VITEST !== undefined) {
    return Logger.fromEnv({ ...resolved, type: "hidden" });
  }
  return Logger.fromEnv(resolved);
}

export const log = createLogger();
