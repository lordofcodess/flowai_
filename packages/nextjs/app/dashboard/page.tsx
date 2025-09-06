"use client";

import { Suspense } from "react";
import { DashboardInterface } from "../../components/dashboard/DashboardInterface";
import { DashboardLayout } from "./_components/DashboardLayout";
import { DashboardLoading } from "./_components/DashboardLoading";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<DashboardLoading />}>
        <DashboardInterface />
      </Suspense>
    </DashboardLayout>
  );
}
