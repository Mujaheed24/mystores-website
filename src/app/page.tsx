import HomeView from "@/components/HomeView";
import { getDirectory } from "@/lib/cached";

export const dynamic = "force-dynamic";

export default async function Home() {
  const shops = await getDirectory().catch((e) => { console.error(e); return []; });
  return <HomeView shops={shops} />;
}
