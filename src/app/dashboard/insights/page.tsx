import { AiInsightsTool } from "@/components/app/ai-insights-tool";

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold md:text-2xl">AI Spending Insights</h1>
        <p className="text-muted-foreground">
          Get personalized recommendations to improve your financial health.
        </p>
      </div>
      <AiInsightsTool />
    </div>
  )
}
