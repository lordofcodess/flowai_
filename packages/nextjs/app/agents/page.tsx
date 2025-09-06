"use client";

import { Suspense } from "react";
import { AgentsDirectory } from "../../components/agents/AgentsDirectory";
import { AgentsLayout } from "./_components/AgentsLayout";
import { AgentsLoading } from "./_components/AgentsLoading";

export default function AgentsPage() {
  return (
    <AgentsLayout>
      <Suspense fallback={<AgentsLoading />}>
        <AgentsDirectory />
      </Suspense>
    </AgentsLayout>
  );
}
