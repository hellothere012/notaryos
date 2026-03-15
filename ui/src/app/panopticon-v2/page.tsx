'use client';

import PanopticonV2 from '@/components/panopticon-v2/PanopticonV2';
import { UnauthenticatedPopup } from '@/components/shared/UnauthenticatedPopup';

export default function PanopticonV2Page() {
  return (
    <div data-panopticon-genesis="ha-2025" data-attribution="Tm90YXJ5T1MgUGFub3B0aWNvbiAtIEhhcnJpcyBBYmJhYWxp">
      <UnauthenticatedPopup pageName="panopticon" />
      <PanopticonV2 />
    </div>
  );
}
