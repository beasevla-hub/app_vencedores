import { z } from "zod";
import { getOrgans, getReport, syncNotionBase } from "../notion";
import { protectedProcedure, router } from "../_core/trpc";

const reportFiltersSchema = z
  .object({
    orgao: z.string().min(1, "Selecione um órgão ou subprefeitura."),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data inicial."),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data final."),
  })
  .refine(values => values.startDate <= values.endDate, {
    path: ["endDate"],
    message: "A data final deve ser igual ou posterior à data inicial.",
  });

export const reportRouter = router({
  organs: protectedProcedure.query(() => getOrgans()),
  generate: protectedProcedure.input(reportFiltersSchema).query(({ input }) => getReport(input)),
  sync: protectedProcedure.mutation(() => syncNotionBase()),
});
