// app/personalise/page.tsx
import Configurator3D from "@/components/config3d/Canvas3D";
import Overlay3D from "@/components/config3d/Overlay3D";

export default function Page() {
  return (
    <section className="config3d">{/* remplit le <main> en hauteur */}
      <Configurator3D />                 {/* Canvas absolute inset-0 */}
      <div className="overlay-abs">      {/* UI overlay sur toute la zone */}
        <Overlay3D />
      </div>
    </section>
  );
}
