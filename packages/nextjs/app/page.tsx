import { Header } from "../components/Header";
import Footer from "../components/Footer";
import { HomeInterface } from "../components/home/HomeInterface";
import { HomeLayout } from "./home/_components/HomeLayout";

export default function HomePage() {
  return (
    <>
      <Header />
      <HomeLayout>
        <HomeInterface />
      </HomeLayout>
      <Footer />
    </>
  );
}
