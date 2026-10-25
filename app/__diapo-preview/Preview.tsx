"use client";
import SignageShell from "../(diapo)/diaporama/[slot]/SignageShell";
import ProductSpotlight from "../(diapo)/diaporama/[slot]/ProductSpotlight";
import MessageSlide from "../(diapo)/diaporama/[slot]/MessageSlide";
import DiaporamaClient from "../(diapo)/diaporama/[slot]/DiaporamaClient";
import type { DisplayMessage } from "../(diapo)/diaporama/[slot]/types";
const product = { product_id: 1928, product_model: "iPhone 17 Pro Max", product_price: "999.00", product_discount_price: "899.00", product_brand_name: "Apple", image: "/test.png", images: ["/test.png", "/mug-orange-face.png"], tags_slug: ["tres-bon-etat"], attributes: [ {code:"stockage",label:"Stockage",value:"256 Go"}, {code:"batterie",label:"Batterie",value:"96 %"}, {code:"reseau",label:"Réseau",value:"5G"}, {code:"garantie",label:"Garantie",value:"1 AN"} ] };
const message: DisplayMessage = {id:1,name:"Démo",slot:"demo",template:"promo",badge:"À découvrir",title:"Votre prochain coup de cœur.",line1:"Des appareils qui ont tout pour plaire.",line2:"Venez les découvrir en magasin",line3:null,footerText:"Parlons de vos envies",backgroundType:"blue",textAlign:"center",accentColor:"#66d8ff",durationSeconds:5,intervalSeconds:10,sortOrder:0,startsAt:null,endsAt:null};
export default function Preview({scene,portrait}: {scene:string;portrait:string}) {
if(scene === "grid") return <DiaporamaClient portrait={portrait} products={Array.from({length:9},(_,i)=>({...product,product_id:1928+i,salePending:i===2}))} messages={[message]} />;
return <SignageShell portrait={portrait} sceneKey="preview" durationMs={8200}>
{scene === "message" ? <MessageSlide message={message} slideKey="preview" /> : <ProductSpotlight product={product} index={0} portrait={portrait!=="0"} paused={false} onNext={()=>{}} />}
</SignageShell>;
}
