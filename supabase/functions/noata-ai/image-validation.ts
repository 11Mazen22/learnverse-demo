/** Validate Fanar raster bytes before claiming a generated PNG was produced. */
export function validGeneratedPng(bytes:Uint8Array):boolean{
 if(bytes.length<68||bytes.length>8*1024*1024)return false;
 const signature=[137,80,78,71,13,10,26,10];
 if(!signature.every((b,i)=>bytes[i]===b))return false;
 // PNG first chunk must be IHDR, fixed 13-byte header, with meaningful dimensions.
 if(bytes[8]!==0||bytes[9]!==0||bytes[10]!==0||bytes[11]!==13||
    bytes[12]!==73||bytes[13]!==72||bytes[14]!==68||bytes[15]!==82)return false;
 const dimensions=(offset:number)=>((bytes[offset]*16777216)+(bytes[offset+1]<<16)+(bytes[offset+2]<<8)+bytes[offset+3])>>>0;
 const width=dimensions(16),height=dimensions(20);
 return width>=1&&height>=1&&width<=4096&&height<=4096;
}
