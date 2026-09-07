import { z } from "zod";

export const itemSchema = z.object({
  name: z.string().min(1, "名称不能为空"),
});

export type Item = z.infer<typeof itemSchema>;
