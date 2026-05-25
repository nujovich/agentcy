import { BrandIntakeAgent, type BrandIntakeInput, brandProfileSchema } from '@/agents/brand-intake.agent';
import { StrategyAgent, type StrategyInput, strategyDocSchema } from '@/agents/strategy.agent';
import { CalendarAgent, type CalendarInput, calendarSchema } from '@/agents/calendar.agent';
import { CopywriterAgent, type CopywriterInput } from '@/agents/copywriter.agent';
import { BriefAgent, type BriefInput, designBriefBatchSchema } from '@/agents/brief.agent';
import { ReportAgent, type ReportInput, monthlyReportSchema } from '@/agents/report.agent';
import { createProvider } from '@/agents/provider-registry';
import type { AgentProvider } from '@/agents/provider-registry';
import type { BrandProfile } from '@/types/brand-profile';
import type { AgentName } from '@/types/agent-outputs';

export type PipelineEvent = {
  agent: AgentName;
  status: 'running' | 'completed' | 'failed';
  elapsed: number;
  error?: string;
};

export type PipelineCallback = (event: PipelineEvent) => void;

export interface PipelineInput {
  brandIntake: BrandIntakeInput;
  providerName: 'anthropic' | 'openai' | 'google';
  providerModel: string;
  month: string;
  onEvent?: PipelineCallback;
}

export interface PipelineOutput {
  brandProfile: BrandProfile;
  strategy: unknown;
  calendar: unknown;
  copies: unknown;
  briefs: unknown;
  report: unknown;
}

function elapsed(start: number): number {
  return Math.round((Date.now() - start) / 100) / 10;
}

export async function runPipeline(input: PipelineInput): Promise<PipelineOutput> {
  const provider: AgentProvider = createProvider(input.providerName, input.providerModel);
  const month = input.month;

  // Step 1: Brand Intake
  const t1 = Date.now();
  input.onEvent?.({ agent: 'brand-intake', status: 'running', elapsed: 0 });
  const brandIntakeAgent = new BrandIntakeAgent(provider);
  const brandProfileRaw = await brandIntakeAgent.run(input.brandIntake);
  const brandProfile = brandProfileRaw as unknown as BrandProfile;
  input.onEvent?.({ agent: 'brand-intake', status: 'completed', elapsed: elapsed(t1) });

  // Step 2: Strategy
  const t2 = Date.now();
  input.onEvent?.({ agent: 'strategy', status: 'running', elapsed: 0 });
  const strategyAgent = new StrategyAgent(provider);
  const strategyInput: StrategyInput = { brandProfile, month };
  const strategy = await strategyAgent.run(strategyInput);
  input.onEvent?.({ agent: 'strategy', status: 'completed', elapsed: elapsed(t2) });

  // Step 3: Calendar
  const t3 = Date.now();
  input.onEvent?.({ agent: 'calendar', status: 'running', elapsed: 0 });
  const calendarAgent = new CalendarAgent(provider);
  const calendarInput: CalendarInput = { strategy: strategy as any, brandProfile, month };
  const calendar = await calendarAgent.run(calendarInput);
  input.onEvent?.({ agent: 'calendar', status: 'completed', elapsed: elapsed(t3) });

  // Step 4: Copywriter
  const t4 = Date.now();
  input.onEvent?.({ agent: 'copywriter', status: 'running', elapsed: 0 });
  const copywriterAgent = new CopywriterAgent(provider);
  const copywriterInput: CopywriterInput = { calendar: calendar as any, brandProfile };
  const copies = await copywriterAgent.run(copywriterInput);
  input.onEvent?.({ agent: 'copywriter', status: 'completed', elapsed: elapsed(t4) });

  // Step 5: Brief
  const t5 = Date.now();
  input.onEvent?.({ agent: 'brief', status: 'running', elapsed: 0 });
  const briefAgent = new BriefAgent(provider);
  const briefInput: BriefInput = {
    copies: copies.map((c, i) => ({
      copy: c.hook, // Map from 'hook' to 'copy'
      visualBrief: c.body, // Map from 'body' to 'visualBrief'
      format: (calendar as any).posts[i]?.format ?? 'post',
    })),
    brandProfile,
  };
  const briefs = await briefAgent.run(briefInput);
  input.onEvent?.({ agent: 'brief', status: 'completed', elapsed: elapsed(t5) });

  // Step 6: Report
  const t6 = Date.now();
  input.onEvent?.({ agent: 'report', status: 'running', elapsed: 0 });
  const reportAgent = new ReportAgent(provider);
  const reportInput: ReportInput = { strategy: strategy as any, brandProfile, month };
  const report = await reportAgent.run(reportInput);
  input.onEvent?.({ agent: 'report', status: 'completed', elapsed: elapsed(t6) });

  return {
    brandProfile,
    strategy,
    calendar,
    copies,
    briefs,
    report,
  };
}
