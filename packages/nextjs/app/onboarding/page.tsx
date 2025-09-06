"use client";

import { Suspense } from "react";
import OnboardingFlow from "../../components/onboarding/OnboardingFlow";
import { OnboardingLayout } from "./_components/OnboardingLayout";
import { OnboardingLoading } from "./_components/OnboardingLoading";

export default function OnboardingPage() {
  return (
    <OnboardingLayout>
      <Suspense fallback={<OnboardingLoading />}>
        <OnboardingFlow />
      </Suspense>
    </OnboardingLayout>
  );
}
