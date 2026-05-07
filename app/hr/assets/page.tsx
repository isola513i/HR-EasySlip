import type { Metadata } from "next";
import { AssetList } from "@/components/hr/asset-list";

export const metadata: Metadata = { title: "Assets — EasySlip HR" };

export default function AssetsPage() {
  return <AssetList />;
}
