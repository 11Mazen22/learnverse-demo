export type ImageEdit={
 rotation:0|90|180|270;flip:boolean;crop:"original"|"square"|"landscape"|"portrait";
 cropX:number;cropY:number;brightness:number;contrast:number;saturation:number;
 caption:string;font:"noata"|"editorial"|"mono";captionPosition:"top"|"bottom";captionColor:string;
};
export const initialImageEdit:ImageEdit={rotation:0,flip:false,crop:"original",cropX:50,cropY:50,brightness:1,contrast:1,saturation:1,caption:"",font:"noata",captionPosition:"bottom",captionColor:"#ffffff"};
function bound(value:number,min:number,max:number){return Number.isFinite(value)?Math.min(max,Math.max(min,value)):min;}
export function safeImageEdit(value:ImageEdit):ImageEdit{
 return {...initialImageEdit,...value,rotation:[0,90,180,270].includes(value.rotation)?value.rotation:0,
 crop:["original","square","landscape","portrait"].includes(value.crop)?value.crop:"original",
 flip:value.flip===true,cropX:bound(value.cropX,0,100),cropY:bound(value.cropY,0,100),
 brightness:bound(value.brightness,0.5,1.5),contrast:bound(value.contrast,0.5,1.5),saturation:bound(value.saturation,0,2),
 caption:String(value.caption??"").replace(/[\p{Cc}\p{Cf}]/gu,"").slice(0,120),
 font:["noata","editorial","mono"].includes(value.font)?value.font:"noata",
 captionPosition:value.captionPosition==="top"?"top":"bottom",
 captionColor:/^#[0-9a-f]{6}$/i.test(value.captionColor)?value.captionColor:"#ffffff"};
}
export function imageGeometry(width:number,height:number,edit:ImageEdit,maxEdge=4096){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>32000000||Math.max(width,height)>16384)throw Error("image_dimensions");
 const opts=safeImageEdit(edit),turned=opts.rotation===90||opts.rotation===270;
 const rw=turned?height:width,rh=turned?width:height;
 const ratio=opts.crop==="square"?1:opts.crop==="landscape"?16/9:opts.crop==="portrait"?4/5:rw/rh;
 const cw=Math.min(rw,rh*ratio),ch=Math.min(rh,rw/ratio),scale=Math.min(1,bound(maxEdge,64,4096)/Math.max(cw,ch));
 return {rotatedWidth:rw,rotatedHeight:rh,x:(rw-cw)*opts.cropX/100,y:(rh-ch)*opts.cropY/100,
  width:Math.max(1,Math.round(cw*scale)),height:Math.max(1,Math.round(ch*scale)),scale};
}
/** Deterministic RGB edits; alpha is preserved. Works without Canvas filter support. */
export function adjustImagePixels(pixels:Uint8ClampedArray,edit:ImageEdit){
 const {brightness,contrast,saturation}=safeImageEdit(edit);
 if(brightness===1&&contrast===1&&saturation===1)return;
 for(let i=0;i<pixels.length;i+=4){
  const r=(pixels[i]-128)*contrast+128,g=(pixels[i+1]-128)*contrast+128,b=(pixels[i+2]-128)*contrast+128;
  const luma=r*0.2126+g*0.7152+b*0.0722;
  pixels[i]=(luma+(r-luma)*saturation)*brightness;
  pixels[i+1]=(luma+(g-luma)*saturation)*brightness;
  pixels[i+2]=(luma+(b-luma)*saturation)*brightness;
 }
}
export function renderEditedImage(canvas:HTMLCanvasElement,image:ImageBitmap,edit:ImageEdit,maxEdge=4096){
 const opts=safeImageEdit(edit),g=imageGeometry(image.width,image.height,opts,maxEdge);
 canvas.width=g.width;canvas.height=g.height;
 const context=canvas.getContext("2d",{willReadFrequently:true});if(!context)throw Error("canvas_unavailable");
 context.clearRect(0,0,canvas.width,canvas.height);context.save();
 context.translate((g.rotatedWidth/2-g.x)*g.scale,(g.rotatedHeight/2-g.y)*g.scale);
 context.scale(g.scale,g.scale);context.scale(opts.flip?-1:1,1);context.rotate(opts.rotation*Math.PI/180);
 context.drawImage(image,-image.width/2,-image.height/2);context.restore();
 if(opts.brightness!==1||opts.contrast!==1||opts.saturation!==1){
  const data=context.getImageData(0,0,g.width,g.height);adjustImagePixels(data.data,opts);context.putImageData(data,0,0);
 }
 if(opts.caption){
  const family=opts.font==="editorial"?"Noata Image Lora":opts.font==="mono"?"Noata Image Mono":"Noata Image Cairo";
  const size=Math.max(12,Math.min(100,g.width/22)),padding=size*0.65,available=g.width-2*padding;
  context.font="600 "+size+"px "+JSON.stringify(family)+', "Noata Image Cairo", sans-serif';
  context.textAlign="center";context.textBaseline=opts.captionPosition==="top"?"top":"bottom";
  context.direction=/[\u0600-\u06ff]/.test(opts.caption)?"rtl":"ltr";
  context.shadowColor="rgba(0,0,0,.8)";context.shadowBlur=size/7;context.lineWidth=size/12;
  context.strokeStyle="rgba(0,0,0,.7)";context.fillStyle=opts.captionColor;
  const y=opts.captionPosition==="top"?padding:g.height-padding;
  context.strokeText(opts.caption,g.width/2,y,available);context.fillText(opts.caption,g.width/2,y,available);
 }
 return g;
}
export function imageCanvasBlob(canvas:HTMLCanvasElement):Promise<Blob>{
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>{
  if(!blob||blob.type!=="image/png"||blob.size<60||blob.size>10*1024*1024)reject(Error("image_export_limit"));else resolve(blob);
 },"image/png"));
}
