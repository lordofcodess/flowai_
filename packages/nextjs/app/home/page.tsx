"use client";

import { Suspense } from "react";
import { HomeInterface } from "../../components/home/HomeInterface";
import { HomeLayout } from "./_components/HomeLayout";
import { HomeLoading } from "./_components/HomeLoading";

export default function HomePage() {
  return (
    <HomeLayout>
      <Suspense fallback={<HomeLoading />}>
        <HomeInterface />
      </Suspense>
    </HomeLayout>
  );
}
