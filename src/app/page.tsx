import HomeView from "@/components/HomeView";
import { getDirectory } from "@/lib/cached";

export const dynamic = "force-dynamic";

export default async function Home() {
  let failed = false;
  const shops = await getDirectory().catch((e) => { console.error(e); failed = true; return []; });
  return <HomeView shops={shops} failed={failed} />;
}
